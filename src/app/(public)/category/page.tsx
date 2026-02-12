/**
 * Category Listing Page — /category
 * Shows all active categories in a visually rich grid with images.
 * Server Component using ISR.
 */

import { createPublicClient } from '@/lib/supabase/server';
import { Metadata } from 'next';
import Image from 'next/image';
import Link from 'next/link';

export const revalidate = 3600;

export const metadata: Metadata = {
  title: 'Categories | Niihut',
  description: 'Browse product categories at Niihut.',
};

export default async function CategoriesPage() {
  const supabase = await createPublicClient();

  const { data: categories } = await supabase
    .from('categories')
    .select('id, name, slug, image_url, description')
    .eq('is_active', true)
    .order('name');

  return (
    <div className="container mx-auto px-4 py-6 md:py-10">
      <div className="mb-10">
        <h1 className="text-2xl md:text-3xl font-bold text-gray-900">
          Shop by Category
        </h1>
        <p className="text-sm text-gray-500 mt-1">
          Find exactly what you&apos;re looking for
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {(categories ?? []).map((cat) => (
          <Link
            key={cat.id}
            href={`/product?category=${cat.slug}`}
            className="group relative overflow-hidden rounded-2xl bg-gray-200 aspect-[4/3] block"
          >
            {cat.image_url ? (
              <Image
                src={cat.image_url}
                alt={cat.name}
                fill
                className="object-cover group-hover:scale-110 transition-transform duration-700 ease-out"
                sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                loading="lazy"
              />
            ) : (
              <div className="w-full h-full bg-gradient-to-br from-gray-300 to-gray-400" />
            )}
            <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/30 to-transparent group-hover:from-black/80 transition-colors duration-500" />
            <div className="absolute bottom-0 left-0 right-0 p-6">
              <h3 className="text-white font-bold text-lg md:text-xl mb-1">
                {cat.name}
              </h3>
              {cat.description && (
                <p className="text-white/70 text-sm line-clamp-2">
                  {cat.description}
                </p>
              )}
            </div>
          </Link>
        ))}
      </div>

      {(categories ?? []).length === 0 && (
        <div className="text-center py-20">
          <p className="text-gray-400 text-lg">No categories available yet.</p>
        </div>
      )}
    </div>
  );
}
