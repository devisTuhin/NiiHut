'use server';

/**
 * Admin Server Actions
 * Handles admin-only operations: order management, product/category CRUD,
 * order status updates, flagged order review, and blocked phone management.
 */

import { requireRole } from '@/lib/auth';
import { createAdminClient } from '@/lib/supabase/server';
import type { OrderStatus } from '@/types/db';
import { revalidatePath } from 'next/cache';

// ─── Order Management ────────────────────────────────────────────────

/**
 * Get all orders with filtering and pagination (admin only).
 */
export async function getAdminOrders(params?: {
  status?: OrderStatus;
  page?: number;
  perPage?: number;
  flaggedOnly?: boolean;
}) {
  await requireRole('admin');
  const supabase = createAdminClient();

  const page = params?.page ?? 1;
  const perPage = params?.perPage ?? 20;
  const from = (page - 1) * perPage;
  const to = from + perPage - 1;

  let query = supabase
    .from('orders')
    .select('*, user:users(id, email, first_name, last_name), items:order_items(*, product:products(id, name, slug, price))', { count: 'exact' })
    .order('created_at', { ascending: false })
    .range(from, to);

  if (params?.status) {
    query = query.eq('status', params.status);
  }

  if (params?.flaggedOnly) {
    query = query.eq('status', 'pending_confirmation');
  }

  const { data: orders, count, error } = await query;

  return {
    orders: orders ?? [],
    total: count ?? 0,
    page,
    perPage,
    totalPages: Math.ceil((count ?? 0) / perPage),
  };
}

/**
 * Update an order's status (admin only).
 * Records status change in order_status_history.
 */
export async function updateOrderStatus(
  orderId: string,
  newStatus: OrderStatus,
  notes?: string
) {
  await requireRole('admin');
  const supabase = createAdminClient();

  // Get admin user id for history tracking
  const { data: adminUser } = await supabase
    .from('users')
    .select('id')
    .eq('role', 'admin')
    .single();

  // Update order status
  const { error: updateError } = await supabase
    .from('orders')
    .update({ status: newStatus, admin_notes: notes })
    .eq('id', orderId);

  if (updateError) {
    return { success: false, error: updateError.message };
  }

  // Record in history
  await supabase.from('order_status_history').insert({
    order_id: orderId,
    status: newStatus,
    changed_by: adminUser?.id ?? null,
    notes: notes ?? `Status updated to ${newStatus}`,
  });

  revalidatePath('/dashboard/orders');
  return { success: true };
}

/**
 * Confirm a flagged order (moves from pending_confirmation → confirmed).
 */
export async function confirmOrder(orderId: string) {
  return updateOrderStatus(orderId, 'confirmed', 'Order confirmed by admin');
}

/**
 * Cancel an order (admin only).
 */
export async function cancelOrder(orderId: string, reason?: string) {
  return updateOrderStatus(orderId, 'cancelled', reason ?? 'Cancelled by admin');
}

// ─── Product Management ──────────────────────────────────────────────

/**
 * Get all products for the admin dashboard.
 */
export async function getAdminProducts(params?: { page?: number; perPage?: number }) {
  await requireRole('admin');
  const supabase = createAdminClient();

  const page = params?.page ?? 1;
  const perPage = params?.perPage ?? 20;
  const from = (page - 1) * perPage;
  const to = from + perPage - 1;

  const { data, count } = await supabase
    .from('products')
    .select('*, category:categories(id, name), images:product_images(url)', { count: 'exact' })
    .order('created_at', { ascending: false })
    .range(from, to);

  return {
    products: data ?? [],
    total: count ?? 0,
    page,
    perPage,
    totalPages: Math.ceil((count ?? 0) / perPage),
  };
}

/**
 * Create a new product with images (admin only).
 */
export async function createProduct(productData: {
  name: string;
  slug: string;
  description?: string;
  price: number;
  inventory: number;
  category_id?: string | null;
  is_active?: boolean;
  image_urls?: string[];
}) {
  await requireRole('admin');
  const supabase = createAdminClient();

  const { image_urls, ...product } = productData;

  const { data, error } = await supabase
    .from('products')
    .insert({
      ...product,
      category_id: product.category_id || null,
      is_active: product.is_active ?? true,
    })
    .select('id')
    .single();

  if (error) return { success: false, error: error.message };

  // Insert images if provided
  if (image_urls && image_urls.length > 0) {
    const imageRows = image_urls.map((url: string, index: number) => ({
      product_id: data.id,
      url,
      display_order: index,
    }));
    await supabase.from('product_images').insert(imageRows);
  }

  revalidatePath('/admin/products');
  revalidatePath('/');
  return { success: true, productId: data.id };
}

/**
 * Update an existing product with images (admin only).
 */
export async function updateProduct(
  productId: string,
  updates: Partial<{
    name: string;
    slug: string;
    description: string;
    price: number;
    inventory: number;
    category_id: string | null;
    is_active: boolean;
  }>,
  image_urls?: string[]
) {
  await requireRole('admin');
  const supabase = createAdminClient();

  const { error } = await supabase
    .from('products')
    .update(updates)
    .eq('id', productId);

  if (error) return { success: false, error: error.message };

  // Sync images if provided
  if (image_urls !== undefined) {
    // Delete existing images
    await supabase
      .from('product_images')
      .delete()
      .eq('product_id', productId);

    // Insert new images with order
    if (image_urls.length > 0) {
      const imageRows = image_urls.map((url: string, index: number) => ({
        product_id: productId,
        url,
        display_order: index,
      }));
      await supabase.from('product_images').insert(imageRows);
    }
  }

  revalidatePath('/admin/products');
  revalidatePath('/');
  return { success: true };
}

/**
 * Delete a product (admin only). Soft-deletes by setting is_active to false.
 */
export async function deleteProduct(productId: string) {
  await requireRole('admin');
  const supabase = createAdminClient();

  const { error } = await supabase
    .from('products')
    .update({ is_active: false })
    .eq('id', productId);

  if (error) return { success: false, error: error.message };

  revalidatePath('/dashboard/products');
  return { success: true };
}

// ─── Category Management ─────────────────────────────────────────────

/**
 * Get all categories (admin only — includes inactive).
 */
export async function getAdminCategories() {
  await requireRole('admin');
  const supabase = createAdminClient();

  const { data } = await supabase
    .from('categories')
    .select('*')
    .order('name');

  return data ?? [];
}

/**
 * Create a new category (admin only).
 */
export async function createCategory(categoryData: {
  name: string;
  slug: string;
  description?: string;
  image_url?: string;
}) {
  await requireRole('admin');
  const supabase = createAdminClient();

  const { data, error } = await supabase
    .from('categories')
    .insert({ ...categoryData, is_active: true })
    .select('id')
    .single();

  if (error) return { success: false, error: error.message };

  revalidatePath('/dashboard/categories');
  return { success: true, categoryId: data.id };
}

/**
 * Update a category (admin only).
 */
export async function updateCategory(
  categoryId: string,
  updates: Partial<{ name: string; slug: string; description: string; image_url: string; is_active: boolean }>
) {
  await requireRole('admin');
  const supabase = createAdminClient();

  const { error } = await supabase
    .from('categories')
    .update(updates)
    .eq('id', categoryId);

  if (error) return { success: false, error: error.message };

  revalidatePath('/dashboard/categories');
  return { success: true };
}

// ─── Blocked Phones ──────────────────────────────────────────────────

/**
 * Block a phone number from placing COD orders (admin only).
 */
export async function blockPhone(phoneNumber: string, reason: string) {
  await requireRole('admin');
  const supabase = createAdminClient();

  const { data: admin } = await supabase
    .from('users')
    .select('id')
    .eq('role', 'admin')
    .single();

  const { error } = await supabase.from('blocked_phones').insert({
    phone_number: phoneNumber,
    reason,
    blocked_by: admin?.id ?? null,
  });

  if (error) return { success: false, error: error.message };
  return { success: true };
}

/**
 * Unblock a phone number (admin only).
 */
export async function unblockPhone(phoneNumber: string) {
  await requireRole('admin');
  const supabase = createAdminClient();

  const { error } = await supabase
    .from('blocked_phones')
    .delete()
    .eq('phone_number', phoneNumber);

  if (error) return { success: false, error: error.message };
  return { success: true };
}

/**
 * Get all blocked phone numbers (admin only).
 */
export async function getBlockedPhones() {
  await requireRole('admin');
  const supabase = createAdminClient();

  const { data } = await supabase
    .from('blocked_phones')
    .select('*')
    .order('created_at', { ascending: false });

  return data ?? [];
}

// ─── Dashboard Stats ─────────────────────────────────────────────────

/**
 * Get dashboard overview statistics (admin only).
 */
export async function getDashboardStats() {
  await requireRole('admin');
  const supabase = createAdminClient();

  const [
    { count: totalOrders },
    { count: pendingOrders },
    { count: flaggedOrders },
    { count: totalProducts },
  ] = await Promise.all([
    supabase.from('orders').select('*', { count: 'exact', head: true }),
    supabase.from('orders').select('*', { count: 'exact', head: true }).eq('status', 'pending'),
    supabase.from('orders').select('*', { count: 'exact', head: true }).eq('status', 'pending_confirmation'),
    supabase.from('products').select('*', { count: 'exact', head: true }).eq('is_active', true),
  ]);

  // Revenue (delivered orders)
  const { data: revenueData } = await supabase
    .from('orders')
    .select('total_amount')
    .eq('status', 'delivered');

  const totalRevenue = revenueData?.reduce((sum, o) => sum + Number(o.total_amount), 0) ?? 0;

  return {
    totalOrders: totalOrders ?? 0,
    pendingOrders: pendingOrders ?? 0,
    flaggedOrders: flaggedOrders ?? 0,
    totalProducts: totalProducts ?? 0,
    totalRevenue,
  };
}
