'use server';

/**
 * Cart Server Actions
 * Handles adding, updating, and removing items from the shopping cart.
 * Supports both authenticated users (via Clerk → Supabase user_id) and
 * guest sessions (via a cookie-based session ID).
 */

import { createAdminClient } from '@/lib/supabase/server';
import { auth } from '@clerk/nextjs/server';
import { revalidatePath } from 'next/cache';
import { cookies } from 'next/headers';

const CART_SESSION_COOKIE = 'niihut_cart_session';

/**
 * Generates or retrieves a session ID for guest carts.
 */
async function getCartSessionId(): Promise<string> {
  const cookieStore = await cookies();
  let sessionId = cookieStore.get(CART_SESSION_COOKIE)?.value;

  if (!sessionId) {
    sessionId = crypto.randomUUID();
    cookieStore.set(CART_SESSION_COOKIE, sessionId, {
      path: '/',
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 30, // 30 days
    });
  }

  return sessionId;
}

/**
 * Resolves the internal Supabase user UUID from the Clerk auth ID.
 */
async function resolveUserId(supabase: any): Promise<string | null> {
  const { userId: clerkId } = await auth();
  if (!clerkId) return null;

  const { data: user } = await supabase
    .from('users')
    .select('id')
    .eq('clerk_id', clerkId)
    .single();

  return user?.id ?? null;
}

/**
 * Retrieves the current user's cart with all items and product details.
 */
export async function getCart() {
  const supabase = createAdminClient();
  const internalUserId = await resolveUserId(supabase);
  const sessionId = await getCartSessionId();


  const selectQuery = '*, items:cart_items(*, product:products(id, name, slug, price, inventory, images:product_images(url, display_order)))';

  // Try by user_id first, then session_id
  if (internalUserId) {
    const { data } = await supabase
      .from('carts')
      .select(selectQuery)
      .eq('user_id', internalUserId)
      .single();

    if (data) {
      // Also merge any orphaned session cart into this user cart
      await mergeSessionCart(supabase, data.id, sessionId);
      return data;
    }
  }

  // Fallback to session cart
  const { data: sessionCart } = await supabase
    .from('carts')
    .select(selectQuery)
    .eq('session_id', sessionId)
    .single();

  // If logged in user found a session cart, claim it
  if (internalUserId && sessionCart && !sessionCart.user_id) {
    await supabase
      .from('carts')
      .update({ user_id: internalUserId })
      .eq('id', sessionCart.id);
  }

  return sessionCart;
}

/**
 * Merges items from a guest session cart into the authenticated user's cart.
 */
async function mergeSessionCart(supabase: any, userCartId: string, sessionId: string) {
  const { data: sessionCart } = await supabase
    .from('carts')
    .select('id, items:cart_items(product_id, quantity)')
    .eq('session_id', sessionId)
    .single();

  if (!sessionCart || sessionCart.id === userCartId) return;

  // Merge each item
  for (const item of sessionCart.items || []) {
    const { data: existing } = await supabase
      .from('cart_items')
      .select('id, quantity')
      .eq('cart_id', userCartId)
      .eq('product_id', item.product_id)
      .single();

    if (existing) {
      await supabase
        .from('cart_items')
        .update({ quantity: existing.quantity + item.quantity })
        .eq('id', existing.id);
    } else {
      await supabase.from('cart_items').insert({
        cart_id: userCartId,
        product_id: item.product_id,
        quantity: item.quantity,
      });
    }
  }

  // Delete the orphaned session cart
  await supabase.from('carts').delete().eq('id', sessionCart.id);
}

/**
 * Adds a product to the cart. Creates a cart if none exists.
 */
export async function addToCart(productId: string, quantity: number = 1) {
  const supabase = createAdminClient();
  const internalUserId = await resolveUserId(supabase);
  const sessionId = await getCartSessionId();

  // 1. Find or create the cart
  let cartQuery = supabase.from('carts').select('id');
  if (internalUserId) {
    cartQuery = cartQuery.eq('user_id', internalUserId);
  } else {
    cartQuery = cartQuery.eq('session_id', sessionId);
  }
  const { data: existingCart } = await cartQuery.single();

  let cartId: string;
  if (existingCart) {
    cartId = existingCart.id;
  } else {
    const { data: newCart, error } = await supabase
      .from('carts')
      .insert({ user_id: internalUserId, session_id: sessionId })
      .select('id')
      .single();

    if (error || !newCart) {
      console.error('[addToCart] Failed to create cart:', { error, internalUserId, sessionId });
      throw new Error('Failed to create cart: ' + (error?.message || 'unknown'));
    }
    cartId = newCart.id;
  }

  // 2. Upsert the item
  const { data: existingItem } = await supabase
    .from('cart_items')
    .select('id, quantity')
    .eq('cart_id', cartId)
    .eq('product_id', productId)
    .single();

  if (existingItem) {
    await supabase
      .from('cart_items')
      .update({ quantity: existingItem.quantity + quantity })
      .eq('id', existingItem.id);
  } else {
    await supabase.from('cart_items').insert({
      cart_id: cartId,
      product_id: productId,
      quantity,
    });
  }

  revalidatePath('/cart');
  return { success: true };
}

/**
 * Updates the quantity of a cart item. Removes it if quantity <= 0.
 */
export async function updateCartItem(itemId: string, quantity: number) {
  const supabase = createAdminClient();

  if (quantity <= 0) {
    await supabase.from('cart_items').delete().eq('id', itemId);
  } else {
    await supabase.from('cart_items').update({ quantity }).eq('id', itemId);
  }

  revalidatePath('/cart');
  return { success: true };
}

/**
 * Removes an item from the cart.
 */
export async function removeFromCart(itemId: string) {
  const supabase = createAdminClient();
  await supabase.from('cart_items').delete().eq('id', itemId);

  revalidatePath('/cart');
  return { success: true };
}

/**
 * Returns the total number of items in the current cart (for header badge).
 */
export async function getCartItemCount(): Promise<number> {
  const cart = await getCart();
  if (!cart || !cart.items) return 0;
  return cart.items.reduce((sum: number, item: any) => sum + item.quantity, 0);
}
