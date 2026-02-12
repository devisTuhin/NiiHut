import { createClient } from "@/lib/supabase/server";
import type { OrderStatus } from "@/types/db";
import { headers } from "next/headers";
import { NextResponse } from "next/server";

/**
 * Steadfast Courier Webhook Handler
 * Receives delivery status updates from Steadfast and syncs them
 * to the orders table and order_status_history.
 */

function mapSteadfastStatus(courierStatus: string): OrderStatus | null {
    const status = courierStatus.toLowerCase();
    switch (status) {
        case 'in_review':
        case 'pending':
            return 'processing';
        case 'in_transit':
        case 'delivered_approval_pending':
            return 'shipped';
        case 'delivered':
        case 'partial_delivered':
            return 'delivered';
        case 'cancelled':
            return 'cancelled';
        case 'returned_to_merchant':
            return 'returned';
        default:
            return null;
    }
}

export async function POST(req: Request) {
    // 1. Basic verification — accept if API key matches
    const headerPayload = await headers();
    const apiKey = headerPayload.get('X-Steadfast-Key');

    // Optional: Uncomment for production
    // if (apiKey !== process.env.STEADFAST_API_KEY) {
    //     return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    // }

    const payload = await req.json();
    const { consignment_id, status: courierStatus, tracking_code } = payload;

    if (!consignment_id || !courierStatus) {
        return NextResponse.json({ error: 'Invalid payload' }, { status: 400 });
    }

    const supabase = await createClient();

    // 2. Find the order by consignment ID stored in admin_notes
    const { data: order, error } = await supabase
        .from('orders')
        .select('id, status')
        .ilike('admin_notes', `%Consignment: ${consignment_id}%`)
        .single();

    if (error || !order) {
        console.error(`Steadfast webhook: Order not found for consignment ${consignment_id}`);
        // Return 200 to acknowledge receipt and prevent retries
        return NextResponse.json({ message: 'Order not found, ignored' }, { status: 200 });
    }

    // 3. Map status and update
    const newStatus = mapSteadfastStatus(courierStatus);

    if (newStatus && newStatus !== order.status) {
        await supabase
            .from('orders')
            .update({ status: newStatus })
            .eq('id', order.id);

        await supabase.from('order_status_history').insert({
            order_id: order.id,
            status: newStatus,
            notes: `Steadfast webhook: "${courierStatus}" → ${newStatus}`,
        });
    }

    return NextResponse.json({ success: true });
}
