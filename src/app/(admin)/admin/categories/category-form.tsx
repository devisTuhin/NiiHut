'use client';

/**
 * CategoryForm — Client component for creating and editing categories.
 *
 * Usage:
 *   <CategoryForm />                          — renders inline "Add" form
 *   <CategoryForm editMode category={cat} />  — renders "Edit" button that shows modal
 */

import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { createCategory, updateCategory } from '@/server-actions/admin';
import { Loader2, Pencil } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useState, useTransition } from 'react';

interface CategoryFormProps {
  editMode?: boolean;
  category?: any;
}

export function CategoryForm({ editMode = false, category }: CategoryFormProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [showEdit, setShowEdit] = useState(false);

  const [formData, setFormData] = useState({
    name: category?.name ?? '',
    slug: category?.slug ?? '',
    description: category?.description ?? '',
    image_url: category?.image_url ?? '',
    is_active: category?.is_active ?? true,
  });

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => {
      const updated = { ...prev, [name]: value };
      // Auto-generate slug from name
      if (name === 'name' && !editMode) {
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

    startTransition(async () => {
      try {
        if (editMode && category) {
          const result = await updateCategory(category.id, {
            name: formData.name,
            slug: formData.slug,
            description: formData.description || null,
            image_url: formData.image_url || null,
            is_active: formData.is_active,
          });
          if (!result.success) {
            setError(result.error || 'Failed to update category.');
            return;
          }
          setShowEdit(false);
        } else {
          const result = await createCategory({
            name: formData.name,
            slug: formData.slug,
            description: formData.description || undefined,
            image_url: formData.image_url || undefined,
          });
          if (!result.success) {
            setError(result.error || 'Failed to create category.');
            return;
          }
          // Reset form
          setFormData({
            name: '',
            slug: '',
            description: '',
            image_url: '',
            is_active: true,
          });
        }
        router.refresh();
      } catch (err: any) {
        setError(err.message || 'An unexpected error occurred.');
      }
    });
  };

  // Edit mode: show button that toggles inline form
  if (editMode) {
    if (!showEdit) {
      return (
        <button
          onClick={() => setShowEdit(true)}
          className="p-2 text-gray-400 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
          title="Edit category"
        >
          <Pencil className="w-4 h-4" />
        </button>
      );
    }

    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-sm">
        <div className="bg-white rounded-xl border shadow-xl p-6 w-full max-w-md mx-4">
          <h3 className="font-semibold text-gray-900 mb-4">Edit Category</h3>
          <FormFields
            formData={formData}
            handleChange={handleChange}
            setFormData={setFormData}
            error={error}
            isPending={isPending}
            handleSubmit={handleSubmit}
            submitLabel="Update Category"
            onCancel={() => setShowEdit(false)}
          />
        </div>
      </div>
    );
  }

  // Create mode: inline form card
  return (
    <div className="bg-white rounded-xl border p-6">
      <h2 className="font-semibold text-gray-900 mb-4">Add Category</h2>
      <FormFields
        formData={formData}
        handleChange={handleChange}
        setFormData={setFormData}
        error={error}
        isPending={isPending}
        handleSubmit={handleSubmit}
        submitLabel="Create Category"
      />
    </div>
  );
}

function FormFields({
  formData,
  handleChange,
  setFormData,
  error,
  isPending,
  handleSubmit,
  submitLabel,
  onCancel,
}: any) {
  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-sm text-red-700">
          {error}
        </div>
      )}

      <Input
        label="Name"
        name="name"
        placeholder="Category name"
        value={formData.name}
        onChange={handleChange}
        required
      />
      <Input
        label="Slug"
        name="slug"
        placeholder="category-slug"
        value={formData.slug}
        onChange={handleChange}
        required
      />
      <Input
        label="Image URL"
        name="image_url"
        placeholder="https://..."
        value={formData.image_url}
        onChange={handleChange}
      />
      <Textarea
        label="Description"
        name="description"
        placeholder="Short description..."
        value={formData.description}
        onChange={handleChange}
        rows={3}
      />

      <label className="flex items-center gap-2 cursor-pointer">
        <input
          type="checkbox"
          checked={formData.is_active}
          onChange={(e) =>
            setFormData((prev: any) => ({ ...prev, is_active: e.target.checked }))
          }
          className="rounded border-gray-300"
        />
        <span className="text-sm text-gray-700">Active</span>
      </label>

      <div className="flex gap-3">
        <button
          type="submit"
          disabled={isPending || !formData.name || !formData.slug}
          className="flex-1 flex items-center justify-center gap-2 bg-gray-900 text-white py-2.5 rounded-lg font-medium text-sm hover:bg-gray-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isPending ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              Saving…
            </>
          ) : (
            submitLabel
          )}
        </button>
        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            className="px-4 py-2.5 bg-gray-100 text-gray-700 rounded-lg font-medium text-sm hover:bg-gray-200 transition-colors"
          >
            Cancel
          </button>
        )}
      </div>
    </form>
  );
}
