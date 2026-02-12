'use client';

/**
 * ProductForm — Shared form component for creating and editing products.
 * Used by both /admin/products/new and /admin/products/[id] pages.
 */

import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { createProduct, updateProduct } from '@/server-actions/admin';
import { Loader2 } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useState, useTransition } from 'react';

interface ProductFormProps {
  product?: any;
  categories: { id: string; name: string }[];
}

export function ProductForm({ product, categories }: ProductFormProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const isEdit = !!product;

  const [formData, setFormData] = useState({
    name: product?.name ?? '',
    slug: product?.slug ?? '',
    description: product?.description ?? '',
    price: product?.price ?? '',
    inventory: product?.inventory ?? 0,
    category_id: product?.category_id ?? '',
    image_url: product?.image_url ?? '',
    is_active: product?.is_active ?? true,
  });

  const handleChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => {
      const updated = { ...prev, [name]: value };
      // Auto-generate slug from name (only on create)
      if (name === 'name' && !isEdit) {
        updated.slug = value
          .toLowerCase()
          .replace(/[^a-z0-9]+/g, '-')
          .replace(/(^-|-$)/g, '');
      }
      return updated;
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!formData.name || !formData.slug || !formData.price) {
      setError('Name, slug, and price are required.');
      return;
    }

    startTransition(async () => {
      try {
        const data = {
          ...formData,
          price: Number(formData.price),
          inventory: Number(formData.inventory),
          category_id: formData.category_id || null,
        };

        let result;
        if (isEdit) {
          result = await updateProduct(product.id, data);
        } else {
          result = await createProduct(data);
        }

        if (result.success) {
          router.push('/admin/products');
          router.refresh();
        } else {
          setError(result.error || 'Failed to save product.');
        }
      } catch (err: any) {
        setError(err.message || 'An unexpected error occurred.');
      }
    });
  };

  const categoryOptions = [
    { value: '', label: 'No Category' },
    ...categories.map((c) => ({ value: c.id, label: c.name })),
  ];

  return (
    <form
      onSubmit={handleSubmit}
      className="bg-white rounded-xl border p-6 space-y-5 max-w-2xl"
    >
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-sm text-red-700">
          {error}
        </div>
      )}

      <Input
        label="Product Name"
        name="name"
        placeholder="Enter product name"
        value={formData.name}
        onChange={handleChange}
        required
      />

      <Input
        label="Slug"
        name="slug"
        placeholder="product-slug"
        value={formData.slug}
        onChange={handleChange}
        required
      />

      <Textarea
        label="Description"
        name="description"
        placeholder="Product description..."
        value={formData.description}
        onChange={handleChange}
        rows={4}
      />

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Input
          label="Price (৳)"
          name="price"
          type="number"
          placeholder="0"
          min="0"
          step="0.01"
          value={formData.price}
          onChange={handleChange}
          required
        />
        <Input
          label="Inventory"
          name="inventory"
          type="number"
          placeholder="0"
          min="0"
          value={formData.inventory}
          onChange={handleChange}
        />
      </div>

      <Select
        label="Category"
        name="category_id"
        value={formData.category_id}
        onChange={handleChange}
        options={categoryOptions}
      />

      <Input
        label="Image URL"
        name="image_url"
        placeholder="https://..."
        value={formData.image_url}
        onChange={handleChange}
      />

      <label className="flex items-center gap-2 cursor-pointer">
        <input
          type="checkbox"
          checked={formData.is_active}
          onChange={(e) =>
            setFormData((prev) => ({ ...prev, is_active: e.target.checked }))
          }
          className="rounded border-gray-300"
        />
        <span className="text-sm text-gray-700">Active (visible to customers)</span>
      </label>

      <div className="flex gap-3 pt-2">
        <button
          type="submit"
          disabled={isPending}
          className="flex items-center gap-2 px-6 py-2.5 bg-gray-900 text-white rounded-lg font-medium text-sm hover:bg-gray-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isPending ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              Saving…
            </>
          ) : isEdit ? (
            'Update Product'
          ) : (
            'Create Product'
          )}
        </button>
        <button
          type="button"
          onClick={() => router.push('/admin/products')}
          className="px-6 py-2.5 bg-gray-100 text-gray-700 rounded-lg font-medium text-sm hover:bg-gray-200 transition-colors"
        >
          Cancel
        </button>
      </div>
    </form>
  );
}
