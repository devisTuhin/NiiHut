/**
 * Home Page — /
 * Premium landing page with hero section, featured categories, and new arrivals grid.
 * Server Component using ISR for performance.
 */

import { getNewArrivals } from '@/lib/products';
import { createPublicClient } from '@/lib/supabase/server';
import { ArrowRight } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';

export const revalidate = 3600; // ISR: Revalidate every hour

export default async function Home() {
  const supabase = await createPublicClient();

  // Fetch new arrivals & categories in parallel
  const [products, { data: categories }] = await Promise.all([
    getNewArrivals(),
    supabase
      .from('categories')
      .select('id, name, slug, image_url, description')
      .eq('is_active', true)
      .order('name')
      .limit(6),
  ]);

  return (
    <main className="min-h-screen bg-white">
      {/* ── Hero Section ── */}
      <section className="relative overflow-hidden bg-gradient-to-br from-gray-950 via-gray-900 to-gray-800 text-white">
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNmZmYiIGZpbGwtb3BhY2l0eT0iLjAzIj48cGF0aCBkPSJNMzYgMzRoLTJ2LTRoMnYtMmgtNHYyaC0ydjRoMnYyaDR2LTJ6bTAtMzBoLTJ2LTRoMnYtMmgtNHYyaC0ydjRoMnYyaDR2LTJ6Ii8+PC9nPjwvZz48L3N2Zz4=')] opacity-40" />
        <div className="container mx-auto px-4 py-24 md:py-36 relative z-10">
          <div className="max-w-3xl">
            <span className="inline-block px-3 py-1 rounded-full bg-white/10 text-white/80 text-xs font-medium mb-6 backdrop-blur-sm border border-white/10">
              🇧🇩 Fast Delivery Across Bangladesh
            </span>
            <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold tracking-tight mb-6 leading-[1.1]">
              Discover Quality
              <span className="block mt-1 bg-gradient-to-r from-white via-gray-200 to-gray-400 bg-clip-text text-transparent">
                Products at NiiHut
              </span>
            </h1>
            <p className="text-lg md:text-xl text-white/60 mb-10 max-w-xl leading-relaxed">
              Curated collection of premium products delivered to your doorstep.
              Cash on Delivery available nationwide.
            </p>
            <div className="flex flex-wrap gap-4">
              <Link
                href="/product"
                className="inline-flex items-center gap-2.5 bg-white text-gray-900 px-8 py-3.5 rounded-lg font-semibold text-sm hover:bg-gray-100 transition-all duration-300 hover:shadow-xl hover:shadow-white/10"
              >
                Shop Now
                <ArrowRight className="w-4 h-4" />
              </Link>
              <Link
                href="/category"
                className="inline-flex items-center gap-2.5 bg-white/10 text-white px-8 py-3.5 rounded-lg font-semibold text-sm hover:bg-white/20 transition-all duration-300 backdrop-blur-sm border border-white/10"
              >
                Browse Categories
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ── Featured Categories ── */}
      {(categories ?? []).length > 0 && (
        <section className="py-16 md:py-20 px-4 bg-gray-50">
          <div className="container mx-auto">
            <div className="flex items-end justify-between mb-10">
              <div>
                <p className="text-sm font-medium text-gray-500 mb-1">Explore</p>
                <h2 className="text-2xl md:text-3xl font-bold text-gray-900">
                  Shop by Category
                </h2>
              </div>
              <Link
                href="/category"
                className="text-sm font-medium text-gray-600 hover:text-gray-900 transition-colors flex items-center gap-1"
              >
                View All <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
              {(categories ?? []).slice(0, 8).map((cat) => (
                <Link
                  key={cat.id}
                  href={`/product?category=${cat.slug}`}
                  className="group relative overflow-hidden rounded-xl bg-gray-200 aspect-[4/3]"
                >
                  {cat.image_url ? (
                    <Image
                      src={cat.image_url}
                      alt={cat.name}
                      fill
                      className="object-cover group-hover:scale-110 transition-transform duration-700 ease-out"
                      sizes="(max-width: 768px) 50vw, 25vw"
                      loading="lazy"
                    />
                  ) : (
                    <div className="w-full h-full bg-gradient-to-br from-gray-300 to-gray-400" />
                  )}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
                  <div className="absolute bottom-0 left-0 right-0 p-4">
                    <h3 className="text-white font-semibold text-sm md:text-base">
                      {cat.name}
                    </h3>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ── New Arrivals ── */}
      <section className="py-16 md:py-20 px-4">
        <div className="container mx-auto">
          <div className="flex items-end justify-between mb-10">
            <div>
              <p className="text-sm font-medium text-gray-500 mb-1">Latest</p>
              <h2 className="text-2xl md:text-3xl font-bold text-gray-900">
                New Arrivals
              </h2>
            </div>
            <Link
              href="/product"
              className="text-sm font-medium text-gray-600 hover:text-gray-900 transition-colors flex items-center gap-1"
            >
              View All <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
            {products.map((product: any) => (
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
                      <svg className="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
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

          {products.length === 0 && (
            <div className="text-center py-16">
              <p className="text-gray-400 text-lg mb-4">No products available yet.</p>
              <p className="text-gray-400 text-sm">Check back soon!</p>
            </div>
          )}
        </div>
      </section>

      {/* ── Trust Badges ── */}
      <section className="py-12 border-t bg-gray-50">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
            <div>
              <div className="text-2xl mb-2">🚚</div>
              <h3 className="font-semibold text-sm text-gray-900">Fast Delivery</h3>
              <p className="text-xs text-gray-500 mt-1">3-5 days nationwide</p>
            </div>
            <div>
              <div className="text-2xl mb-2">💰</div>
              <h3 className="font-semibold text-sm text-gray-900">Cash on Delivery</h3>
              <p className="text-xs text-gray-500 mt-1">Pay when you receive</p>
            </div>
            <div>
              <div className="text-2xl mb-2">✅</div>
              <h3 className="font-semibold text-sm text-gray-900">Quality Assured</h3>
              <p className="text-xs text-gray-500 mt-1">Verified products only</p>
            </div>
            <div>
              <div className="text-2xl mb-2">📦</div>
              <h3 className="font-semibold text-sm text-gray-900">Secure Packaging</h3>
              <p className="text-xs text-gray-500 mt-1">Safe & intact delivery</p>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
