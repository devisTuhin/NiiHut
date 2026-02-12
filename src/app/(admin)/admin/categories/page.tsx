/**
 * Admin Categories Page — /admin/categories
 * Lists all categories with inline create/edit form.
 * Server Component with client form.
 */

import { getAdminCategories } from '@/server-actions/admin';
import { Metadata } from 'next';
import Image from 'next/image';
import { CategoryForm } from './category-form';

export const metadata: Metadata = {
  title: 'Categories | Admin | Niihut',
};

export default async function AdminCategoriesPage() {
  const categories = await getAdminCategories();

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Categories</h1>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Category Form */}
        <div className="lg:col-span-1">
          <CategoryForm />
        </div>

        {/* Category List */}
        <div className="lg:col-span-2">
          <div className="bg-white rounded-xl border">
            <div className="px-5 py-4 border-b">
              <h2 className="font-semibold text-gray-900">
                All Categories ({categories.length})
              </h2>
            </div>

            {categories.length === 0 ? (
              <div className="py-12 text-center text-gray-400 text-sm">
                No categories yet. Create one using the form.
              </div>
            ) : (
              <div className="divide-y">
                {categories.map((cat: any) => (
                  <div
                    key={cat.id}
                    className="px-5 py-4 flex items-center gap-4 hover:bg-gray-50/50 transition-colors"
                  >
                    {/* Thumbnail */}
                    <div className="w-12 h-12 bg-gray-100 rounded-lg overflow-hidden flex-shrink-0 relative">
                      {cat.image_url ? (
                        <Image
                          src={cat.image_url}
                          alt={cat.name}
                          fill
                          className="object-cover"
                          sizes="48px"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-gray-300 text-[10px]">
                          IMG
                        </div>
                      )}
                    </div>

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-gray-900 truncate">
                        {cat.name}
                      </p>
                      <p className="text-xs text-gray-500 mt-0.5">
                        Slug: {cat.slug}
                      </p>
                    </div>

                    {/* Status */}
                    <span
                      className={`text-xs font-medium px-2.5 py-1 rounded-full ${
                        cat.is_active
                          ? 'bg-green-100 text-green-700'
                          : 'bg-gray-100 text-gray-500'
                      }`}
                    >
                      {cat.is_active ? 'Active' : 'Inactive'}
                    </span>

                    {/* Edit Link — calls form with pre-fill */}
                    <CategoryForm
                      editMode
                      category={cat}
                    />
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
