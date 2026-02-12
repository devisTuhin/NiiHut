'use server';

/**
 * Steadfast Courier Server Actions
 * Handles parcel creation after admin confirmation, status tracking,
 * and webhook-driven order status updates.
 */

import { requireRole } from '@/lib/auth';
import { steadfastClient } from '@/lib/steadfastClient';
import { createClient } from '@/lib/supabase/server';
import type { OrderStatus } from '@/types/db';
import { revalidatePath } from 'next/cache';

/**
 * Maps Steadfast delivery statuses to internal order statuses.
 */
const STEADFAST_STATUS_MAP: Record<string, OrderStatus> = {
  in_review: 'processing',
  pending: 'processing',
  delivered: 'delivered',
  partial_delivered: 'delivered',
  cancelled: 'cancelled',
  hold: 'processing',
  unknown: 'processing',
};

// ─── Parcel Creation ─────────────────────────────────────────────────

/**
 * Creates a Steadfast parcel for a confirmed order (admin only).
 * This should be called after admin confirms the order.
 */
export async function createSteadfastParcel(orderId: string) {
  await requireRole('admin');
  const supabase = await createClient();

  // 1. Get the order
  const { data: order, error: orderError } = await supabase
    .from('orders')
    .select('*, items:order_items(quantity, price_at_purchase, product:products(name))')
    .eq('id', orderId)
    .single();

  if (orderError || !order) {
    return { success: false, error: 'Order not found' };
  }

  if (order.status !== 'confirmed' && order.status !== 'pending') {
    return {
      success: false,
      error: `Cannot create parcel for order with status "${order.status}". Order must be "confirmed" or "pending".`,
    };
  }

  const shippingAddress = order.shipping_address as any;

  // 2. Build Steadfast payload
  const payload = {
    invoice: order.id.slice(0, 20), // Steadfast invoice max length
    recipient_name: shippingAddress?.name ?? 'Customer',
    recipient_phone: order.phone_number ?? '',
    recipient_address: [
      shippingAddress?.address,
      shippingAddress?.area,
      shippingAddress?.city,
    ]
      .filter(Boolean)
      .join(', '),
    cod_amount: Number(order.total_amount),
    note: shippingAddress?.note ?? '',
  };

  // 3. Call Steadfast API with retry
  let response: any;
  let attempts = 0;
  const MAX_RETRIES = 3;

  while (attempts < MAX_RETRIES) {
    try {
      response = await steadfastClient.createOrder(payload);
      break; // Success
    } catch (error: any) {
      attempts++;
      console.error(`Steadfast API attempt ${attempts} failed:`, error?.message);

      if (attempts >= MAX_RETRIES) {
        // Log failure
        await supabase.from('order_status_history').insert({
          order_id: orderId,
          status: order.status,
          notes: `Steadfast parcel creation failed after ${MAX_RETRIES} attempts: ${error?.message}`,
        });

        return {
          success: false,
          error: `Steadfast API failed after ${MAX_RETRIES} retries: ${error?.message}`,
        };
      }

      // Wait before retry (exponential backoff)
      await new Promise((resolve) => setTimeout(resolve, 1000 * attempts));
    }
  }

  // 4. Store the consignment ID and update order status
  const consignmentId = response?.consignment?.consignment_id;
  const trackingCode = response?.consignment?.tracking_code;

  if (consignmentId) {
    // Update order to shipped status
    await supabase
      .from('orders')
      .update({
        status: 'shipped' as OrderStatus,
        admin_notes: `Steadfast Consignment: ${consignmentId}${trackingCode ? `, Tracking: ${trackingCode}` : ''}`,
      })
      .eq('id', orderId);

    // Record in history
    await supabase.from('order_status_history').insert({
      order_id: orderId,
      status: 'shipped',
      notes: `Parcel created — Consignment ID: ${consignmentId}`,
    });
  }

  revalidatePath('/dashboard/orders');
  return {
    success: true,
    consignmentId,
    trackingCode,
  };
}

// ─── Status Tracking ─────────────────────────────────────────────────

/**
 * Checks the delivery status of a specific order via Steadfast API (admin only).
 * Updates the order status in the database accordingly.
 */
export async function checkParcelStatus(orderId: string) {
  await requireRole('admin');
  const supabase = await createClient();

  // 1. Get the order's consignment ID from admin_notes
  const { data: order } = await supabase
    .from('orders')
    .select('id, status, admin_notes')
    .eq('id', orderId)
    .single();

  if (!order) return { success: false, error: 'Order not found' };

  // Extract consignment ID from admin_notes
  const consignmentMatch = order.admin_notes?.match(/Consignment: (\w+)/);
  if (!consignmentMatch) {
    return { success: false, error: 'No Steadfast consignment ID found for this order' };
  }

  const consignmentId = consignmentMatch[1];

  // 2. Check status via Steadfast API
  try {
    const statusResponse = await steadfastClient.checkDeliveryStatus(consignmentId);
    const deliveryStatus = statusResponse?.delivery_status;

    // 3. Map to internal status
    const newStatus = STEADFAST_STATUS_MAP[deliveryStatus] ?? order.status;

    if (newStatus !== order.status) {
      // Update order
      await supabase
        .from('orders')
        .update({ status: newStatus })
        .eq('id', orderId);

      // Record history
      await supabase.from('order_status_history').insert({
        order_id: orderId,
        status: newStatus,
        notes: `Steadfast status sync: ${deliveryStatus} → ${newStatus}`,
      });
    }

    revalidatePath('/dashboard/orders');
    return {
      success: true,
      steadfastStatus: deliveryStatus,
      internalStatus: newStatus,
    };
  } catch (error: any) {
    return { success: false, error: `Status check failed: ${error?.message}` };
  }
}

// ─── Webhook Handler Helper ──────────────────────────────────────────

/**
 * Processes a Steadfast webhook callback.
 * Called from the API route handler at /api/webhooks/steadfast.
 * This is NOT a server action (no 'use server') — it's exported for use by the route.
 */
export async function processSteadfastWebhook(payload: {
  consignment_id: string;
  status: string;
  invoice: string;
}) {
  const supabase = await createClient();

  // Find the order by the invoice (which is the order ID prefix)
  const { data: order } = await supabase
    .from('orders')
    .select('id, status')
    .ilike('admin_notes', `%${payload.consignment_id}%`)
    .single();

  if (!order) {
    console.error('Steadfast webhook: Order not found for consignment', payload.consignment_id);
    return { success: false };
  }

  const newStatus = STEADFAST_STATUS_MAP[payload.status] ?? order.status;

  if (newStatus !== order.status) {
    await supabase
      .from('orders')
      .update({ status: newStatus })
      .eq('id', order.id);

    await supabase.from('order_status_history').insert({
      order_id: order.id,
      status: newStatus,
      notes: `Webhook: Steadfast status "${payload.status}" → ${newStatus}`,
    });
  }

  return { success: true };
}
