import { createPublicClient } from '@/lib/supabase/server';
import { unstable_cache } from 'next/cache';

export type Product = {
  id: string;
  name: string;
  slug: string;
  description: string;
  price: number;
  inventory: number;
  category_id?: string;
  images?: { url: string }[];
  is_active: boolean;
};

export const getProductBySlug = unstable_cache(
  async (slug: string): Promise<Product | null> => {
    const supabase = await createPublicClient();
    const { data: product, error } = await supabase
      .from('products')
      .select('*, images:product_images(url, display_order)')
      .eq('slug', slug)
      .eq('is_active', true)
      .single();

    if (error || !product) {
      return null;
    }

    // Sort images by display_order
    if (product.images) {
      product.images.sort(
        (a: any, b: any) => (a.display_order ?? 0) - (b.display_order ?? 0)
      );
    }

    return product as Product;
  },
  ['product-by-slug'],
  { revalidate: 60, tags: ['products'] }
);

export const getRelatedProducts = unstable_cache(
  async (categoryId: string, currentProductId: string) => {
    const supabase = await createPublicClient();
    const { data } = await supabase
      .from('products')
      .select('id, name, slug, price, images:product_images(url, display_order)')
      .eq('category_id', categoryId)
      .eq('is_active', true)
      .neq('id', currentProductId)
      .limit(4);

    return data || [];
  },
  ['related-products'],
  { revalidate: 60, tags: ['products'] }
);

export const getNewArrivals = unstable_cache(
  async () => {
    const supabase = await createPublicClient();
    const { data } = await supabase
      .from('products')
      .select('id, name, slug, price, images:product_images(url, display_order)')
      .eq('is_active', true)
      .order('created_at', { ascending: false })
      .limit(8);

    return data || [];
  },
  ['new-arrivals'],
  { revalidate: 60, tags: ['products', 'home-content'] }
);
