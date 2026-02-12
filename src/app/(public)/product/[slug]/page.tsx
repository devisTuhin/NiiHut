/**
 * Product Detail Page — /product/[slug]
 * Displays full product details with image gallery, working add-to-cart button,
 * stock status, and related products section.
 * Uses ISR with per-slug caching.
 */

import { AddToCartButton } from '@/components/product/add-to-cart-button';
import { getProductBySlug, getRelatedProducts } from '@/lib/products';
import { ChevronRight } from 'lucide-react';
import { Metadata } from 'next';
import Image from 'next/image';
import Link from 'next/link';
import { notFound } from 'next/navigation';

type Props = {
  params: Promise<{ slug: string }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const product = await getProductBySlug(slug);

  if (!product) {
    return { title: 'Product Not Found | Niihut' };
  }

  const images =
    product.images?.map((img) => img.url) ||
    (product.image_url ? [product.image_url] : []);

  return {
    title: `${product.name} | Niihut`,
    description:
      product.description?.slice(0, 160) || `Buy ${product.name} at Niihut.`,
    openGraph: {
      title: product.name,
      description: product.description?.slice(0, 160),
      images: images.map((url) => ({ url })),
    },
  };
}

export default async function ProductDetailsPage({ params }: Props) {
  const { slug } = await params;
  const product = await getProductBySlug(slug);

  if (!product) {
    notFound();
  }

  // Collect all images (primary + gallery)
  const allImages = [
    ...(product.image_url ? [product.image_url] : []),
    ...(product.images?.map((img) => img.url).filter((url) => url !== product.image_url) || []),
  ];

  // Fetch related products if category exists
  const relatedProducts = product.category_id
    ? await getRelatedProducts(product.category_id, product.id)
    : [];

  // Structured data for SEO
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: product.name,
    image: allImages,
    description: product.description,
    sku: product.slug,
    offers: {
      '@type': 'Offer',
      price: product.price,
      priceCurrency: 'BDT',
      availability:
        product.inventory > 0
          ? 'https://schema.org/InStock'
          : 'https://schema.org/OutOfStock',
    },
  };

  const inStock = product.inventory > 0;

  return (
    <div className="container mx-auto px-4 py-6 md:py-10">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      {/* Breadcrumb */}
      <nav className="flex items-center gap-1.5 text-sm text-gray-400 mb-6">
        <Link href="/home" className="hover:text-gray-600 transition-colors">
          Home
        </Link>
        <ChevronRight className="w-3.5 h-3.5" />
        <Link href="/product" className="hover:text-gray-600 transition-colors">
          Products
        </Link>
        <ChevronRight className="w-3.5 h-3.5" />
        <span className="text-gray-700 font-medium truncate max-w-[200px]">
          {product.name}
        </span>
      </nav>

      {/* Product Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-16">
        {/* Image Gallery */}
        <div className="space-y-3">
          {/* Main Image */}
          <div className="relative aspect-square bg-gray-100 rounded-2xl overflow-hidden">
            {allImages[0] ? (
              <Image
                src={allImages[0]}
                alt={product.name}
                fill
                className="object-cover"
                sizes="(max-width: 1024px) 100vw, 50vw"
                priority
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-gray-300">
                <svg
                  className="w-24 h-24"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={0.5}
                    d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                  />
                </svg>
              </div>
            )}
          </div>

          {/* Thumbnail Gallery */}
          {allImages.length > 1 && (
            <div className="flex gap-2 overflow-x-auto pb-1">
              {allImages.map((url, i) => (
                <div
                  key={i}
                  className="relative w-20 h-20 bg-gray-100 rounded-lg overflow-hidden flex-shrink-0 border-2 border-transparent hover:border-gray-900 transition-colors cursor-pointer"
                >
                  <Image
                    src={url}
                    alt={`${product.name} - Image ${i + 1}`}
                    fill
                    className="object-cover"
                    sizes="80px"
                  />
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Product Info */}
        <div className="lg:py-4">
          <h1 className="text-2xl md:text-3xl lg:text-4xl font-bold text-gray-900 mb-4 leading-tight">
            {product.name}
          </h1>

          {/* Price */}
          <div className="flex items-baseline gap-3 mb-6">
            <p className="text-3xl font-bold text-gray-900">
              ৳{Number(product.price).toLocaleString()}
            </p>
          </div>

          {/* Stock Status */}
          <div className="mb-6">
            {inStock ? (
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-green-50 text-green-700 text-sm font-medium">
                <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                In Stock ({product.inventory} available)
              </div>
            ) : (
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-red-50 text-red-700 text-sm font-medium">
                <span className="w-2 h-2 rounded-full bg-red-500" />
                Out of Stock
              </div>
            )}
          </div>

          {/* Description */}
          {product.description && (
            <div className="prose prose-sm max-w-none mb-8 text-gray-600 leading-relaxed">
              <p>{product.description}</p>
            </div>
          )}

          {/* Add to Cart */}
          <div className="mb-8">
            <AddToCartButton
              productId={product.id}
              disabled={!inStock}
            />
          </div>

          {/* Delivery Info */}
          <div className="border-t pt-6 space-y-3">
            <div className="flex items-start gap-3 text-sm">
              <span className="text-lg">🚚</span>
              <div>
                <p className="font-medium text-gray-900">Delivery</p>
                <p className="text-gray-500">3-5 business days • ৳80 flat rate</p>
              </div>
            </div>
            <div className="flex items-start gap-3 text-sm">
              <span className="text-lg">💰</span>
              <div>
                <p className="font-medium text-gray-900">Cash on Delivery</p>
                <p className="text-gray-500">
                  Pay when you receive your order
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Related Products */}
      {relatedProducts.length > 0 && (
        <section className="mt-16 md:mt-24 border-t pt-12">
          <h2 className="text-xl md:text-2xl font-bold text-gray-900 mb-8">
            You May Also Like
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
            {relatedProducts.map((rp: any) => (
              <Link
                key={rp.id}
                href={`/product/${rp.slug}`}
                className="group"
              >
                <div className="aspect-square relative bg-gray-100 rounded-xl overflow-hidden mb-3">
                  {rp.image_url ? (
                    <Image
                      src={rp.image_url}
                      alt={rp.name}
                      fill
                      className="object-cover group-hover:scale-105 transition-transform duration-500"
                      sizes="(max-width: 768px) 50vw, 25vw"
                      loading="lazy"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-gray-300 text-sm">
                      No Image
                    </div>
                  )}
                </div>
                <h3 className="font-medium text-sm text-gray-900 group-hover:text-gray-600 transition-colors line-clamp-2">
                  {rp.name}
                </h3>
                <p className="font-bold text-sm mt-1">৳{rp.price}</p>
              </Link>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
