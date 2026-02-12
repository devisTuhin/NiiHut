'use server'

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { cookies } from "next/headers";
import { v4 as uuidv4 } from 'uuid';

export async function getCart() {
    const supabase = await createClient();
    const cookieStore = await cookies();
    const { data: { user } } = await supabase.auth.getUser();

    let cart;

    if (user) {
        // Logged in user
        const { data } = await supabase
            .from('carts')
            .select('*, cart_items(*, product:products(*))')
            .eq('user_id', user.id)
            .maybeSingle(); // Use maybeSingle to avoid 406 on no rows
        cart = data;
    } else {
        // Guest user
        const sessionId = cookieStore.get('cart_session')?.value;
        if (sessionId) {
            const { data } = await supabase
                .from('carts')
                .select('*, cart_items(*, product:products(*))')
                .eq('session_id', sessionId)
                .maybeSingle(); // Use maybeSingle
             cart = data;
        }
    }
    
    return cart;
}


export async function addToCart(productId: string, quantity: number = 1) {
    const supabase = await createClient();
    const cookieStore = await cookies();
    const { data: { user } } = await supabase.auth.getUser();

    let cartId;

    if (user) {
        // --- Authenticated User Logic ---
        // 1. Check if user already has a cart
        const { data: existingCart } = await supabase
            .from('carts')
            .select('id')
            .eq('user_id', user.id)
            .maybeSingle();

        if (existingCart) {
            cartId = existingCart.id;
        } else {
            // Create new cart linked to user
            const { data: newCart, error } = await supabase
                .from('carts')
                .insert({ user_id: user.id })
                .select('id')
                .single();
            if (error) throw new Error(error.message);
            cartId = newCart.id;
        }
    } else {
        // --- Guest Logic ---
        let sessionId = cookieStore.get('cart_session')?.value;
        
        if (!sessionId) {
            sessionId = uuidv4();
            cookieStore.set('cart_session', sessionId, { httpOnly: true, secure: process.env.NODE_ENV === 'production', sameSite: 'lax', path: '/' });
        }

        const { data: existingCart } = await supabase
            .from('carts')
            .select('id')
            .eq('session_id', sessionId)
            .maybeSingle();
            
        if (existingCart) {
            cartId = existingCart.id;
        } else {
             const { data: newCart, error } = await supabase
                .from('carts')
                .insert({ session_id: sessionId })
                .select('id')
                .single();
            if (error) throw new Error(error.message);
            cartId = newCart.id;
        }
    }

    // --- Upsert connection Item ---
    // Note: We use upsert to handle "add same item again" logic if we had unique constraints properly set to update,
    // but standard SQL upsert for "increment quantity" is tricky without a function or two steps.
    // For simplicity/reliability in this actions flow:
    
    // 1. Check if item exists
    const { data: existingItem } = await supabase
        .from('cart_items')
        .select('id, quantity')
        .eq('cart_id', cartId)
        .eq('product_id', productId)
        .maybeSingle();

    if (existingItem) {
        await supabase
            .from('cart_items')
            .update({ quantity: existingItem.quantity + quantity })
            .eq('id', existingItem.id);
    } else {
        await supabase
            .from('cart_items')
            .insert({
                cart_id: cartId,
                product_id: productId,
                quantity: quantity
            });
    }

    revalidatePath('/cart');
}

export async function removeFromCart(itemId: string) {
    const supabase = await createClient();
    await supabase.from('cart_items').delete().eq('id', itemId);
    revalidatePath('/cart');
}

export async function updateQuantity(itemId: string, quantity: number) {
    const supabase = await createClient();
    if (quantity <= 0) {
        await removeFromCart(itemId);
    } else {
        await supabase.from('cart_items').update({ quantity }).eq('id', itemId);
        revalidatePath('/cart');
    }
}
