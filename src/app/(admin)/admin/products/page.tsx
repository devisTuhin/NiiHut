/**
 * Admin Products Page — /admin/products
 * Lists all products with status, inventory, category, and edit links.
 */

import { Pagination } from '@/components/ui/pagination';
import { getAdminProducts } from '@/server-actions/admin';
import { Plus } from 'lucide-react';
import { Metadata } from 'next';
import Image from 'next/image';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Products | Admin | Niihut',
};

const PAGE_SIZE = 20;

export default async function AdminProductsPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string }>;
}) {
  const params = await searchParams;
  const page = Number(params.page) || 1;

  const { products, total } = await getAdminProducts({
    page,
    perPage: PAGE_SIZE,
  });

  const totalPages = Math.ceil((total ?? 0) / PAGE_SIZE);

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Products</h1>
          <p className="text-sm text-gray-500 mt-1">{total ?? 0} products</p>
        </div>
        <Link
          href="/admin/products/new"
          className="inline-flex items-center gap-2 px-4 py-2.5 bg-gray-900 text-white text-sm font-medium rounded-lg hover:bg-gray-800 transition-colors"
        >
          <Plus className="w-4 h-4" />
          Add Product
        </Link>
      </div>

      {/* Products Table */}
      <div className="bg-white rounded-xl border overflow-hidden">
        {(products ?? []).length === 0 ? (
          <div className="py-16 text-center text-gray-400 text-sm">
            No products yet.{' '}
            <Link
              href="/admin/products/new"
              className="text-gray-900 underline hover:no-underline"
            >
              Add your first product
            </Link>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-gray-50/50">
                  <th className="text-left px-5 py-3 font-medium text-gray-500">
                    Product
                  </th>
                  <th className="text-left px-5 py-3 font-medium text-gray-500">
                    Category
                  </th>
                  <th className="text-right px-5 py-3 font-medium text-gray-500">
                    Price
                  </th>
                  <th className="text-right px-5 py-3 font-medium text-gray-500">
                    Inventory
                  </th>
                  <th className="text-center px-5 py-3 font-medium text-gray-500">
                    Status
                  </th>
                  <th className="text-right px-5 py-3 font-medium text-gray-500">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody>
                {(products ?? []).map((product: any) => (
                  <tr
                    key={product.id}
                    className="border-b last:border-b-0 hover:bg-gray-50/50 transition-colors"
                  >
                    <td className="px-5 py-3">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-gray-100 rounded-lg overflow-hidden flex-shrink-0 relative">
                          {product.images?.[0]?.url ? (
                            <Image
                              src={product.images[0].url}
                              alt={product.name}
                              fill
                              className="object-cover"
                              sizes="40px"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-gray-300 text-[9px]">
                              IMG
                            </div>
                          )}
                        </div>
                        <div className="min-w-0">
                          <p className="font-medium text-gray-900 truncate">
                            {product.name}
                          </p>
                          <p className="text-xs text-gray-400">
                            {product.slug}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-3 text-gray-600">
                      {product.category?.name || '—'}
                    </td>
                    <td className="px-5 py-3 text-right font-medium text-gray-900">
                      ৳{Number(product.price).toLocaleString()}
                    </td>
                    <td className="px-5 py-3 text-right">
                      <span
                        className={`font-medium ${
                          product.inventory <= 0
                            ? 'text-red-600'
                            : product.inventory <= 5
                              ? 'text-yellow-600'
                              : 'text-gray-900'
                        }`}
                      >
                        {product.inventory}
                      </span>
                    </td>
                    <td className="px-5 py-3 text-center">
                      <span
                        className={`text-xs font-medium px-2 py-1 rounded-full ${
                          product.is_active
                            ? 'bg-green-100 text-green-700'
                            : 'bg-gray-100 text-gray-500'
                        }`}
                      >
                        {product.is_active ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td className="px-5 py-3 text-right">
                      <Link
                        href={`/admin/products/${product.id}`}
                        className="text-xs font-medium text-gray-600 hover:text-gray-900 transition-colors px-3 py-1.5 bg-gray-50 hover:bg-gray-100 rounded-md"
                      >
                        Edit
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Pagination */}
      <Pagination
        currentPage={page}
        totalPages={totalPages}
        baseUrl="/admin/products"
      />
    </div>
  );
}
