'use server';

/**
 * Order Server Actions
 * Handles the full COD order lifecycle:
 * Cart → Risk Check → Order Creation → Admin Confirmation → Steadfast → Delivery
 */

import { RiskEngine } from '@/lib/risk-engine';
import { createAdminClient, createClient } from '@/lib/supabase/server';
import type { OrderStatus } from '@/types/db';
import { auth } from '@clerk/nextjs/server';
import { revalidatePath } from 'next/cache';
import { getCart } from './cart';

export interface CheckoutFormData {
  phoneNumber: string;
  recipientName: string;
  shippingAddress: {
    address: string;
    city: string;
    area: string;
    note?: string;
  };
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
 * Creates a Cash on Delivery order:
 * 1. Validates the cart
 * 2. Checks inventory
 * 3. Runs fraud/risk analysis
 * 4. Creates the order + order_items atomically
 * 5. Clears the cart
 */
export async function createCodOrder(formData: CheckoutFormData) {
  const supabase = createAdminClient();
  const internalUserId = await resolveUserId(supabase);

  // 1. Get Cart
  const cart = await getCart();
  if (!cart || !cart.items || cart.items.length === 0) {
    return { success: false, error: 'Cart is empty' };
  }

  // 2. Validate inventory for each item
  for (const item of cart.items) {
    if (item.product.inventory < item.quantity) {
      return {
        success: false,
        error: `"${item.product.name}" only has ${item.product.inventory} units in stock.`,
      };
    }
  }

  // 3. Calculate totals
  let subtotal = 0;
  for (const item of cart.items) {
    subtotal += item.product.price * item.quantity;
  }
  const deliveryFee = 80; // BDT flat rate — can be made dynamic later
  const totalAmount = subtotal + deliveryFee;

  // 4. Risk Analysis
  const riskEngine = new RiskEngine(supabase);
  const riskResult = await riskEngine.evaluateOrder(
    internalUserId,
    formData.phoneNumber,
    totalAmount,
    formData.shippingAddress
  );

  if (riskResult.blocked) {
    return {
      success: false,
      error: 'This order could not be processed. Please contact support.',
    };
  }

  // 5. Determine initial status based on risk
  const initialStatus: OrderStatus = riskResult.flagged
    ? 'pending_confirmation'
    : 'pending';

  // 6. Create Order
  const { data: order, error: orderError } = await supabase
    .from('orders')
    .insert({
      user_id: internalUserId,
      total_amount: totalAmount,
      delivery_fee: deliveryFee,
      status: initialStatus,
      shipping_address: formData.shippingAddress,
      phone_number: formData.phoneNumber,
      admin_notes: riskResult.flagged
        ? `⚠️ Flagged (score: ${riskResult.score}): ${riskResult.factors.map((f) => f.factor).join(', ')}`
        : null,
    })
    .select('id')
    .single();

  if (orderError || !order) {
    return { success: false, error: 'Failed to create order: ' + (orderError?.message ?? 'Unknown') };
  }

  // 7. Create Order Items + Decrement Inventory
  const orderItems = cart.items.map((item: any) => ({
    order_id: order.id,
    product_id: item.product.id,
    quantity: item.quantity,
    price_at_purchase: item.product.price,
  }));

  const { error: itemsError } = await supabase.from('order_items').insert(orderItems);
  if (itemsError) {
    // Rollback: delete the order
    await supabase.from('orders').delete().eq('id', order.id);
    return { success: false, error: 'Failed to save order items' };
  }

  // Decrement inventory
  for (const item of cart.items) {
    await supabase.rpc('decrement_inventory', {
      p_product_id: item.product.id,
      p_quantity: item.quantity,
    }).then(({ error }: any) => {
      if (error) {
        console.error('Inventory decrement failed for', item.product.id, error);
      }
    });
  }

  // 8. Record initial status history
  await supabase.from('order_status_history').insert({
    order_id: order.id,
    status: initialStatus,
    notes: riskResult.flagged ? 'Auto-flagged by risk engine' : 'Order placed via COD',
  });

  // 9. Clear Cart
  await supabase.from('cart_items').delete().eq('cart_id', cart.id);

  revalidatePath('/cart');
  revalidatePath('/profile');
  return { success: true, orderId: order.id };
}

/**
 * Gets all orders for the currently authenticated user.
 */
export async function getUserOrders() {
  const { userId: clerkId } = await auth();
  if (!clerkId) return [];

  const supabase = await createClient();
  const { data: user } = await supabase
    .from('users')
    .select('id')
    .eq('clerk_id', clerkId)
    .single();

  if (!user) return [];

  const { data: orders } = await supabase
    .from('orders')
    .select('*, items:order_items(*, product:products(id, name, slug, price, image_url))')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false });

  return orders ?? [];
}

/**
 * Gets a single order by ID (verifies ownership unless admin).
 */
export async function getOrderById(orderId: string) {
  const supabase = await createClient();

  const { data: order } = await supabase
    .from('orders')
    .select('*, items:order_items(*, product:products(id, name, slug, price, image_url))')
    .eq('id', orderId)
    .single();

  return order;
}
