'use server'

import { steadfastClient } from "@/lib/steadfast/client";
import { SteadfastCreateOrderPayload } from "@/lib/steadfast/types";
import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

export async function createShipment(orderId: string) {
    const supabase = await createClient();
    
    // 1. Auth Check
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error("Unauthorized");

    // Check if admin
    const { data: userData } = await supabase
        .from('users')
        .select('role')
        .eq('id', user.id)
        .single();
    
    if (userData?.role !== 'admin') {
        throw new Error("Forbidden: Admin access only");
    }

    // 2. Fetch Order
    const { data: order, error: orderError } = await supabase
        .from('orders')
        .select('*')
        .eq('id', orderId)
        .single();

    if (orderError || !order) throw new Error("Order not found");

    // 3. Idempotency Check
    const { data: existingShipment } = await supabase
        .from('shipments')
        .select('id, start_tracking_code')
        .eq('order_id', orderId)
        .single();

    if (existingShipment) {
        throw new Error("Shipment already exists for this order");
    }

    // 4. Prepare Payload
    // Note: shipping_address is JSONB, so we need to cast or validate
    const address = order.shipping_address as any;
    const fullAddress = `${address.address}, ${address.area}, ${address.district}, ${address.division}`;

    const payload: SteadfastCreateOrderPayload = {
        invoice: order.id,
        recipient_name: address.fullName,
        recipient_phone: order.phone_number,
        recipient_address: fullAddress,
        cod_amount: order.total_amount, // logic for partial payment can be added here
        note: order.admin_notes || "Handle with care"
    };

    // 5. Call Courier API
    let apiResponse;
    try {
        apiResponse = await steadfastClient.createOrder(payload);
    } catch (error: any) {
        // Log failure
        await supabase.from('courier_logs').insert({
            order_id: orderId,
            action: 'create_parcel',
            request_payload: payload as any, // Cast to JSON
            error_message: error.message,
            status_code: 500 // Approximation
        });
        throw new Error(`Courier API Failed: ${error.message}`);
    }

    // 6. Save Shipment
    const { data: shipment, error: shipmentError } = await supabase
        .from('shipments')
        .insert({
            order_id: orderId,
            provider: 'steadfast',
            consignment_id: apiResponse.consignment.consignment_id.toString(),
            tracking_code: apiResponse.consignment.tracking_code,
            status: apiResponse.consignment.status,
            cod_amount: apiResponse.consignment.cod_amount,
            delivery_fee: apiResponse.consignment.delivery_fee,
            metadata: apiResponse as any
        })
        .select()
        .single();

    if (shipmentError) {
        // Critical: API succeeded but DB failed. Log this!
        console.error("CRITICAL: Shipment created at Courier but DB insert failed", shipmentError);
        throw new Error("System Error: Shipment created but database update failed. Check logs.");
    }

    // 7. Log Success
    await supabase.from('courier_logs').insert({
        order_id: orderId,
        shipment_id: shipment.id,
        action: 'create_parcel',
        request_payload: payload as any,
        response_payload: apiResponse as any,
        status_code: 200
    });

    // 8. Update Order Status
    await supabase.from('orders').update({ status: 'processing' }).eq('id', orderId);
    
    // Add history
    await supabase.from('order_status_history').insert({
        order_id: orderId,
        status: 'processing',
        changed_by: user.id,
        notes: `Shipment created. Tracking: ${apiResponse.consignment.tracking_code}`
    });

    revalidatePath(`/admin/orders/${orderId}`);
    return { success: true, tracking_code: apiResponse.consignment.tracking_code };
}
