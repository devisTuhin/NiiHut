'use server'

import { RiskEngine } from "@/lib/risk-engine";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

interface ShippingAddress {
    fullName: string;
    phone: string;
    division: string;
    district: string;
    area: string;
    address: string;
}

export async function createCheckoutSession(
    cartItems: { product_id: string; quantity: number }[],
    shippingAddress: ShippingAddress
) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        throw new Error("Must be logged in to checkout");
    }

    // 1. Validation
    const phoneRegex = /^(\+88)?01[3-9]\d{8}$/;
    if (!phoneRegex.test(shippingAddress.phone)) {
        throw new Error("Invalid Bangladesh phone number");
    }

    // 2. Fraud Checks (High Level)
    const riskEngine = new RiskEngine(supabase);

    // 2a. Check Hard Blocklist (Fast Fail)
    const { data: blocked } = await supabase
        .from('blocked_entries')
        .select('reason, severity')
        .or(`type.eq.phone,type.eq.user_id`)
        .in('value', [shippingAddress.phone, user.id])
        .eq('severity', 'hard_block') // Only hard blocks stop checkout immediately
        .single();
    
    if (blocked) {
        throw new Error(`You are restricted from placing orders: ${blocked.reason}`);
    }

    // 2b. Check Daily Order Limit
    const today = new Date();
    today.setHours(0,0,0,0);
    const { count: dailyOrders } = await supabase
        .from('orders')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user.id)
        .gte('created_at', today.toISOString());

    const { data: maxDailyOrdersRule } = await supabase
        .from('risk_rules')
        .select('value')
        .eq('key', 'max_daily_orders')
        .single();
    
    const MAX_DAILY = maxDailyOrdersRule ? Number(maxDailyOrdersRule.value) : 3;

    if (dailyOrders && dailyOrders >= MAX_DAILY) {
        throw new Error(`Daily order limit reached (${MAX_DAILY}). Please try again tomorrow.`);
    }

    // 3. Process Cart & Calculate Total
    let totalAmount = 0;
    const orderItemsData = [];
    const deliveryFee = 60; // Flat rate for now

    for (const item of cartItems) {
        const { data: product } = await supabase
            .from('products')
            .select('*')
            .eq('id', item.product_id)
            .single();

        if (!product) throw new Error(`Product ${item.product_id} not found`);

        if (product.inventory < item.quantity) {
             throw new Error(`Insufficient inventory for ${product.name}`);
        }

        const quantity = item.quantity;
        const price = product.price;
        totalAmount += (price * quantity);

        orderItemsData.push({
            product_id: product.id,
            quantity: quantity,
            price_at_purchase: price
        });
    }

    totalAmount += deliveryFee;

    // 4. Create Order with Initial Status
    // We start as pending_confirmation, but might change based on risk
    let initialStatus = 'pending_confirmation';

    // 5. Run Full Risk Assessment (Pre-creation simulation to determine status)
    // In a real high-throughput system, this might be async after creation.
    // Here we do it synchronous to immediately flag high risk.
    const riskAnalysis = await riskEngine.evaluateOrder(
        user.id,
        shippingAddress.phone,
        totalAmount,
        shippingAddress
    );

    if (riskAnalysis.blocked) {
         throw new Error("Order rejected due to high risk assessment.");
    }

    if (riskAnalysis.flagged) {
        initialStatus = 'flagged_for_review';
    }

    // 6. DB Insertions
    const { data: order, error: orderError } = await supabase
        .from('orders')
        .insert({
            user_id: user.id,
            total_amount: totalAmount,
            status: initialStatus,
            phone_number: shippingAddress.phone,
            delivery_fee: deliveryFee,
            shipping_address: shippingAddress as any, // Cast to JSON
            admin_notes: riskAnalysis.flagged ? `Flagged by Risk Engine (Score: ${riskAnalysis.score})` : null
        })
        .select('id')
        .single();

    if (orderError) throw new Error(`Order creation failed: ${orderError.message}`);

    // 7. Store Risk Assessment Result
    if (riskAnalysis.score > 0) {
        await supabase.from('order_risk_assessments').insert({
            order_id: order.id,
            risk_score: riskAnalysis.score,
            factors: riskAnalysis.factors
        });
    }

    // 8. Create Order Items
    const { error: itemsError } = await supabase
        .from('order_items')
        .insert(orderItemsData.map(item => ({
            ...item,
            order_id: order.id
        })));
    
    if (itemsError) {
        // Rollback strategy would go here (delete order), but for now we throw
        console.error("Failed to create items", itemsError);
        throw new Error(`Order items creation failed: ${itemsError.message}`);
    }

    // 9. Update User Stats
    // Increment total orders
    // In a real production app, use an RPC or a trigger. Here we do a read-modify-write for simplicity.
    const { data: userData } = await supabase.from('users').select('total_orders').eq('id', user.id).single();
    if (userData) {
        await supabase.from('users').update({ total_orders: (userData.total_orders || 0) + 1 }).eq('id', user.id);
    }

    // 10. Log Status History
    await supabase.from('order_status_history').insert({
        order_id: order.id,
        status: initialStatus,
        notes: 'Order placed via website',
        changed_by: user.id
    });

    // 11. Clear Cart
    const { data: cart } = await supabase
        .from('carts')
        .select('id')
        .eq('user_id', user.id)
        .single();
    
    if (cart) {
        await supabase.from('cart_items').delete().eq('cart_id', cart.id);
    }
   
    // 12. Redirect
    redirect(`/orders/${order.id}?success=true`);
}
