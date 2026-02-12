/**
 * New Product Page — /admin/products/new
 * Server component that fetches categories, then renders the product form.
 */

import { ProductForm } from '@/components/admin/product-form';
import { getAdminCategories } from '@/server-actions/admin';
import { ChevronRight } from 'lucide-react';
import { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Add Product | Admin | Niihut',
};

export default async function NewProductPage() {
  const categories = await getAdminCategories();

  return (
    <div>
      {/* Breadcrumb */}
      <nav className="flex items-center gap-1.5 text-sm text-gray-400 mb-6">
        <Link href="/admin/products" className="hover:text-gray-600 transition-colors">
          Products
        </Link>
        <ChevronRight className="w-3.5 h-3.5" />
        <span className="text-gray-700 font-medium">Add New Product</span>
      </nav>

      <h1 className="text-2xl font-bold text-gray-900 mb-6">Add New Product</h1>
      <ProductForm categories={categories} />
    </div>
  );
}
