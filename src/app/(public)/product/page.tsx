/**
 * Product Listing Page — /product
 * Displays all active products with category filtering, sorting, and pagination.
 * Server Component using ISR for performance.
 */

import { Pagination } from '@/components/ui/pagination';
import { createPublicClient } from '@/lib/supabase/server';
import { SlidersHorizontal } from 'lucide-react';
import { Metadata } from 'next';
import Image from 'next/image';
import Link from 'next/link';

export const revalidate = 3600; // ISR: 1 hour

export const metadata: Metadata = {
  title: 'All Products | Niihut',
  description:
    'Browse our full collection of products. Fast delivery across Bangladesh.',
};

const SORT_OPTIONS = [
  { value: 'newest', label: 'Newest First' },
  { value: 'price_asc', label: 'Price: Low → High' },
  { value: 'price_desc', label: 'Price: High → Low' },
  { value: 'name_asc', label: 'Name: A → Z' },
];

const ITEMS_PER_PAGE = 16;

export default async function ProductsPage({
  searchParams,
}: {
  searchParams: Promise<{ category?: string; sort?: string; page?: string }>;
}) {
  const params = await searchParams;
  const { category, sort = 'newest' } = params;
  const page = Number(params.page) || 1;

  const supabase = await createPublicClient();

  // Fetch categories for filter bar
  const { data: categories } = await supabase
    .from('categories')
    .select('id, name, slug')
    .eq('is_active', true)
    .order('name');

  // Build product query
  let query = supabase
    .from('products')
    .select('id, name, slug, price, image_url, category_id, inventory', {
      count: 'exact',
    })
    .eq('is_active', true);

  // Category filter
  if (category) {
    const { data: cat } = await supabase
      .from('categories')
      .select('id')
      .eq('slug', category)
      .single();

    if (cat) {
      query = query.eq('category_id', cat.id);
    }
  }

  // Sorting
  switch (sort) {
    case 'price_asc':
      query = query.order('price', { ascending: true });
      break;
    case 'price_desc':
      query = query.order('price', { ascending: false });
      break;
    case 'name_asc':
      query = query.order('name', { ascending: true });
      break;
    default:
      query = query.order('created_at', { ascending: false });
  }

  // Pagination
  const from = (page - 1) * ITEMS_PER_PAGE;
  const to = from + ITEMS_PER_PAGE - 1;
  query = query.range(from, to);

  const { data: products, count } = await query;
  const totalPages = Math.ceil((count ?? 0) / ITEMS_PER_PAGE);

  // Find active category name for heading
  const activeCategory = categories?.find((c) => c.slug === category);

  return (
    <div className="container mx-auto px-4 py-6 md:py-10">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-gray-900">
            {activeCategory ? activeCategory.name : 'All Products'}
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            {count ?? 0} product{(count ?? 0) !== 1 ? 's' : ''}
          </p>
        </div>

        {/* Sort Controls */}
        <div className="flex items-center gap-2">
          <SlidersHorizontal className="w-4 h-4 text-gray-400" />
          <div className="flex gap-1">
            {SORT_OPTIONS.map((opt) => (
              <Link
                key={opt.value}
                href={`/product?${new URLSearchParams({
                  ...(category ? { category } : {}),
                  sort: opt.value,
                }).toString()}`}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                  sort === opt.value
                    ? 'bg-gray-900 text-white'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                {opt.label}
              </Link>
            ))}
          </div>
        </div>
      </div>

      {/* Category Filters */}
      <div className="flex flex-wrap gap-2 mb-8">
        <Link
          href="/product"
          className={`px-4 py-2 rounded-full text-sm font-medium transition-all duration-200 ${
            !category
              ? 'bg-gray-900 text-white shadow-md'
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          }`}
        >
          All
        </Link>
        {(categories ?? []).map((cat) => (
          <Link
            key={cat.id}
            href={`/product?category=${cat.slug}${sort !== 'newest' ? `&sort=${sort}` : ''}`}
            className={`px-4 py-2 rounded-full text-sm font-medium transition-all duration-200 ${
              category === cat.slug
                ? 'bg-gray-900 text-white shadow-md'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            {cat.name}
          </Link>
        ))}
      </div>

      {/* Product Grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
        {(products ?? []).map((product) => (
          <Link
            key={product.id}
            href={`/product/${product.slug}`}
            className="group"
          >
            <div className="aspect-square relative bg-gray-100 rounded-xl overflow-hidden mb-3">
              {product.image_url ? (
                <Image
                  src={product.image_url}
                  alt={product.name}
                  fill
                  className="object-cover group-hover:scale-105 transition-transform duration-500 ease-out"
                  sizes="(max-width: 768px) 50vw, 25vw"
                  loading="lazy"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-gray-300">
                  <svg
                    className="w-12 h-12"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={1}
                      d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                    />
                  </svg>
                </div>
              )}
              {/* Out of stock overlay */}
              {product.inventory <= 0 && (
                <div className="absolute inset-0 bg-white/60 flex items-center justify-center">
                  <span className="bg-gray-900/80 text-white text-xs font-medium px-3 py-1 rounded-full">
                    Out of Stock
                  </span>
                </div>
              )}
            </div>
            <h3 className="font-medium text-sm md:text-base text-gray-900 mb-1 group-hover:text-gray-600 transition-colors line-clamp-2">
              {product.name}
            </h3>
            <p className="font-bold text-gray-900">৳{product.price}</p>
          </Link>
        ))}
      </div>

      {/* Empty State */}
      {(products ?? []).length === 0 && (
        <div className="text-center py-20">
          <div className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center mx-auto mb-4">
            <svg
              className="w-8 h-8 text-gray-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.5}
                d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
              />
            </svg>
          </div>
          <p className="text-gray-500 text-lg mb-2">No products found</p>
          <p className="text-gray-400 text-sm mb-6">
            Try adjusting your filters or browse all products.
          </p>
          <Link
            href="/product"
            className="inline-flex items-center px-5 py-2.5 bg-gray-900 text-white text-sm font-medium rounded-lg hover:bg-gray-800 transition-colors"
          >
            View All Products
          </Link>
        </div>
      )}

      {/* Pagination */}
      <Pagination
        currentPage={page}
        totalPages={totalPages}
        baseUrl="/product"
        searchParams={{ category, sort }}
      />
    </div>
  );
}
