/**
 * Edit Product Page — /admin/products/[id]
 * Server component that fetches the product and categories, then renders the form.
 */

import { ProductForm } from '@/components/admin/product-form';
import { createClient } from '@/lib/supabase/server';
import { getAdminCategories } from '@/server-actions/admin';
import { ChevronRight } from 'lucide-react';
import { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';

export const metadata: Metadata = {
  title: 'Edit Product | Admin | Niihut',
};

type Props = {
  params: Promise<{ id: string }>;
};

export default async function EditProductPage({ params }: Props) {
  const { id } = await params;

  const supabase = await createClient();
  const { data: product } = await supabase
    .from('products')
    .select('*')
    .eq('id', id)
    .single();

  if (!product) {
    notFound();
  }

  const categories = await getAdminCategories();

  return (
    <div>
      {/* Breadcrumb */}
      <nav className="flex items-center gap-1.5 text-sm text-gray-400 mb-6">
        <Link
          href="/admin/products"
          className="hover:text-gray-600 transition-colors"
        >
          Products
        </Link>
        <ChevronRight className="w-3.5 h-3.5" />
        <span className="text-gray-700 font-medium truncate max-w-[200px]">
          {product.name}
        </span>
      </nav>

      <h1 className="text-2xl font-bold text-gray-900 mb-6">Edit Product</h1>
      <ProductForm product={product} categories={categories} />
    </div>
  );
}
