'use server';

/**
 * Upload Server Actions
 * Handles image uploads to Supabase Storage for admin operations.
 */

import { requireRole } from '@/lib/auth';
import { createAdminClient } from '@/lib/supabase/server';

const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
const MAX_SIZE = 5 * 1024 * 1024; // 5MB

/**
 * Upload a category image to Supabase Storage.
 * Accepts FormData with a 'file' field.
 * Returns the public URL on success.
 */
export async function uploadCategoryImage(formData: FormData): Promise<{
  success: boolean;
  url?: string;
  error?: string;
}> {
  await requireRole('admin');

  const file = formData.get('file') as File | null;
  if (!file) {
    return { success: false, error: 'No file provided.' };
  }

  // Validate type
  if (!ALLOWED_TYPES.includes(file.type)) {
    return {
      success: false,
      error: `Invalid file type. Allowed: ${ALLOWED_TYPES.map((t) => t.split('/')[1]).join(', ')}`,
    };
  }

  // Validate size
  if (file.size > MAX_SIZE) {
    return {
      success: false,
      error: `File too large. Max size: ${MAX_SIZE / (1024 * 1024)}MB`,
    };
  }

  const supabase = createAdminClient();

  // Generate unique filename
  const ext = file.name.split('.').pop()?.toLowerCase() || 'jpg';
  const filename = `${Date.now()}-${Math.random().toString(36).substring(2, 8)}.${ext}`;
  const filePath = `categories/${filename}`;

  // Convert file to buffer for upload
  const arrayBuffer = await file.arrayBuffer();
  const buffer = new Uint8Array(arrayBuffer);

  const { error: uploadError } = await supabase.storage
    .from('category-images')
    .upload(filePath, buffer, {
      contentType: file.type,
      upsert: false,
    });

  if (uploadError) {
    return { success: false, error: uploadError.message };
  }

  // Get public URL
  const { data: urlData } = supabase.storage
    .from('category-images')
    .getPublicUrl(filePath);

  return { success: true, url: urlData.publicUrl };
}

/**
 * Delete a category image from Supabase Storage.
 * Extracts the file path from the full URL and removes it.
 */
export async function deleteCategoryImage(imageUrl: string): Promise<{
  success: boolean;
  error?: string;
}> {
  await requireRole('admin');

  const supabase = createAdminClient();

  // Extract path from URL: .../category-images/categories/filename.ext
  const match = imageUrl.match(/category-images\/(.+)$/);
  if (!match) {
    return { success: false, error: 'Invalid image URL format.' };
  }

  const filePath = match[1];

  const { error } = await supabase.storage
    .from('category-images')
    .remove([filePath]);

  if (error) {
    return { success: false, error: error.message };
  }

  return { success: true };
}

/**
 * Upload a product image to Supabase Storage.
 * Accepts FormData with a 'file' field.
 * Returns the public URL on success.
 */
export async function uploadProductImage(formData: FormData): Promise<{
  success: boolean;
  url?: string;
  error?: string;
}> {
  await requireRole('admin');

  const file = formData.get('file') as File | null;
  if (!file) {
    return { success: false, error: 'No file provided.' };
  }

  if (!ALLOWED_TYPES.includes(file.type)) {
    return {
      success: false,
      error: `Invalid file type. Allowed: ${ALLOWED_TYPES.map((t) => t.split('/')[1]).join(', ')}`,
    };
  }

  if (file.size > MAX_SIZE) {
    return {
      success: false,
      error: `File too large. Max size: ${MAX_SIZE / (1024 * 1024)}MB`,
    };
  }

  const supabase = createAdminClient();

  const ext = file.name.split('.').pop()?.toLowerCase() || 'jpg';
  const filename = `${Date.now()}-${Math.random().toString(36).substring(2, 8)}.${ext}`;
  const filePath = `products/${filename}`;

  const arrayBuffer = await file.arrayBuffer();
  const buffer = new Uint8Array(arrayBuffer);

  const { error: uploadError } = await supabase.storage
    .from('product-images')
    .upload(filePath, buffer, {
      contentType: file.type,
      upsert: false,
    });

  if (uploadError) {
    return { success: false, error: uploadError.message };
  }

  const { data: urlData } = supabase.storage
    .from('product-images')
    .getPublicUrl(filePath);

  return { success: true, url: urlData.publicUrl };
}

/**
 * Delete a product image from Supabase Storage.
 */
export async function deleteProductImage(imageUrl: string): Promise<{
  success: boolean;
  error?: string;
}> {
  await requireRole('admin');

  const supabase = createAdminClient();

  const match = imageUrl.match(/product-images\/(.+)$/);
  if (!match) {
    return { success: false, error: 'Invalid image URL format.' };
  }

  const { error } = await supabase.storage
    .from('product-images')
    .remove([match[1]]);

  if (error) {
    return { success: false, error: error.message };
  }

  return { success: true };
}
