'use client';

/**
 * MultiImageUpload — Multi-image upload with drag-and-drop, reorder, preview.
 *
 * Features:
 *  - Drag & drop multiple files
 *  - Click to browse (multi-select)
 *  - Sortable image grid (drag to reorder)
 *  - First image = primary (marked with badge)
 *  - Remove individual images
 *  - Upload progress per image
 *  - Max 10 images
 *  - "Use URLs" fallback
 */

import {
    deleteProductImage,
    uploadProductImage,
} from '@/server-actions/upload';
import {
    GripVertical,
    ImagePlus,
    Loader2,
    Plus,
    Star,
    Trash2,
    Upload,
    X,
} from 'lucide-react';
import Image from 'next/image';
import { useCallback, useRef, useState } from 'react';

interface MultiImageUploadProps {
  value: string[];
  onChange: (urls: string[]) => void;
  label?: string;
  maxImages?: number;
}

export function MultiImageUpload({
  value = [],
  onChange,
  label = 'Product Images',
  maxImages = 10,
}: MultiImageUploadProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [uploadingCount, setUploadingCount] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [useUrls, setUseUrls] = useState(false);
  const [urlInput, setUrlInput] = useState('');
  const [dragIndex, setDragIndex] = useState<number | null>(null);
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFiles = useCallback(
    async (files: FileList | File[]) => {
      setError(null);
      const fileArray = Array.from(files).filter((f) =>
        f.type.startsWith('image/')
      );

      if (fileArray.length === 0) {
        setError('Please select image files (JPEG, PNG, WebP, or GIF).');
        return;
      }

      const remaining = maxImages - value.length;
      if (fileArray.length > remaining) {
        setError(`You can add up to ${remaining} more image(s). Max: ${maxImages}.`);
        return;
      }

      setUploadingCount(fileArray.length);

      const uploadedUrls: string[] = [];
      for (const file of fileArray) {
        try {
          const formData = new FormData();
          formData.append('file', file);
          const result = await uploadProductImage(formData);
          if (result.success && result.url) {
            uploadedUrls.push(result.url);
          } else {
            setError(result.error || `Failed to upload ${file.name}`);
          }
        } catch (err: any) {
          setError(err.message || `Failed to upload ${file.name}`);
        }
      }

      if (uploadedUrls.length > 0) {
        onChange([...value, ...uploadedUrls]);
      }
      setUploadingCount(0);
    },
    [value, onChange, maxImages]
  );

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      setIsDragging(false);
      if (e.dataTransfer.files?.length) {
        handleFiles(e.dataTransfer.files);
      }
    },
    [handleFiles]
  );

  const handleFileSelect = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      if (e.target.files?.length) {
        handleFiles(e.target.files);
      }
      e.target.value = '';
    },
    [handleFiles]
  );

  const handleRemove = useCallback(
    async (index: number) => {
      const url = value[index];
      // Try to delete from storage if it's an uploaded image
      if (url.includes('product-images')) {
        try {
          await deleteProductImage(url);
        } catch {
          // Ignore deletion errors
        }
      }
      const newUrls = value.filter((_, i) => i !== index);
      onChange(newUrls);
    },
    [value, onChange]
  );

  const handleAddUrl = useCallback(() => {
    if (!urlInput.trim()) return;
    if (value.length >= maxImages) {
      setError(`Maximum ${maxImages} images allowed.`);
      return;
    }
    onChange([...value, urlInput.trim()]);
    setUrlInput('');
  }, [urlInput, value, onChange, maxImages]);

  // Reorder via drag
  const handleReorderDragStart = useCallback((index: number) => {
    setDragIndex(index);
  }, []);

  const handleReorderDragOver = useCallback(
    (e: React.DragEvent, index: number) => {
      e.preventDefault();
      setDragOverIndex(index);
    },
    []
  );

  const handleReorderDrop = useCallback(
    (index: number) => {
      if (dragIndex === null || dragIndex === index) {
        setDragIndex(null);
        setDragOverIndex(null);
        return;
      }
      const newUrls = [...value];
      const [removed] = newUrls.splice(dragIndex, 1);
      newUrls.splice(index, 0, removed);
      onChange(newUrls);
      setDragIndex(null);
      setDragOverIndex(null);
    },
    [dragIndex, value, onChange]
  );

  return (
    <div className="w-full">
      <div className="flex items-center justify-between mb-1.5">
        <label className="block text-sm font-medium text-gray-700">
          {label}
          <span className="text-gray-400 font-normal ml-1">
            ({value.length}/{maxImages})
          </span>
        </label>
        <button
          type="button"
          onClick={() => {
            setUseUrls(!useUrls);
            setError(null);
          }}
          className="text-xs text-gray-500 hover:text-gray-700 transition-colors underline"
        >
          {useUrls ? 'Upload instead' : 'Use URLs instead'}
        </button>
      </div>

      {error && (
        <div className="mb-2 bg-red-50 border border-red-200 rounded-lg px-3 py-2 text-xs text-red-700 flex items-center gap-2">
          <X className="w-3.5 h-3.5 flex-shrink-0" />
          {error}
        </div>
      )}

      {/* Image Grid */}
      {value.length > 0 && (
        <div className="grid grid-cols-3 sm:grid-cols-4 gap-2 mb-3">
          {value.map((url, index) => (
            <div
              key={`${url}-${index}`}
              draggable
              onDragStart={() => handleReorderDragStart(index)}
              onDragOver={(e) => handleReorderDragOver(e, index)}
              onDrop={() => handleReorderDrop(index)}
              onDragEnd={() => {
                setDragIndex(null);
                setDragOverIndex(null);
              }}
              className={`
                relative group aspect-square rounded-lg overflow-hidden border-2 cursor-grab active:cursor-grabbing transition-all
                ${dragOverIndex === index ? 'border-gray-900 scale-105' : 'border-gray-200'}
                ${dragIndex === index ? 'opacity-40' : 'opacity-100'}
              `}
            >
              <Image
                src={url}
                alt={`Product image ${index + 1}`}
                fill
                className="object-cover"
                sizes="120px"
              />

              {/* Primary badge */}
              {index === 0 && (
                <div className="absolute top-1 left-1 bg-yellow-400 text-yellow-900 text-[10px] font-bold px-1.5 py-0.5 rounded flex items-center gap-0.5">
                  <Star className="w-2.5 h-2.5" />
                  Primary
                </div>
              )}

              {/* Overlay controls */}
              <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-colors flex items-center justify-center gap-1.5 opacity-0 group-hover:opacity-100">
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleRemove(index);
                  }}
                  className="p-1.5 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors"
                  title="Remove"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
                <div
                  className="p-1.5 bg-white/90 text-gray-700 rounded-lg"
                  title="Drag to reorder"
                >
                  <GripVertical className="w-3.5 h-3.5" />
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {value.length > 1 && (
        <p className="text-[11px] text-gray-400 mb-3">
          ↕ Drag to reorder · First image = primary thumbnail
        </p>
      )}

      {/* URL input mode */}
      {useUrls ? (
        <div className="flex gap-2">
          <input
            type="url"
            placeholder="https://example.com/image.jpg"
            value={urlInput}
            onChange={(e) => setUrlInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault();
                handleAddUrl();
              }
            }}
            className="flex-1 h-10 rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-black/10 focus:border-gray-900 transition-colors duration-200"
          />
          <button
            type="button"
            onClick={handleAddUrl}
            disabled={!urlInput.trim() || value.length >= maxImages}
            className="px-3 py-2 bg-gray-900 text-white rounded-lg text-sm font-medium hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-1.5"
          >
            <Plus className="w-4 h-4" />
            Add
          </button>
        </div>
      ) : value.length < maxImages ? (
        /* Drop Zone */
        <div
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
          className={`
            relative flex flex-col items-center justify-center gap-2 p-6
            border-2 border-dashed rounded-lg cursor-pointer
            transition-all duration-200
            ${
              isDragging
                ? 'border-gray-900 bg-gray-50 scale-[1.01]'
                : 'border-gray-300 bg-white hover:border-gray-400 hover:bg-gray-50/50'
            }
            ${uploadingCount > 0 ? 'pointer-events-none opacity-60' : ''}
          `}
        >
          {uploadingCount > 0 ? (
            <>
              <Loader2 className="w-8 h-8 text-gray-400 animate-spin" />
              <span className="text-sm text-gray-500">
                Uploading {uploadingCount} image{uploadingCount > 1 ? 's' : ''}…
              </span>
            </>
          ) : isDragging ? (
            <>
              <Upload className="w-8 h-8 text-gray-900" />
              <span className="text-sm font-medium text-gray-900">
                Drop to upload
              </span>
            </>
          ) : (
            <>
              <ImagePlus className="w-8 h-8 text-gray-400" />
              <div className="text-center">
                <span className="text-sm text-gray-600">
                  <span className="font-medium text-gray-900">
                    Click to upload
                  </span>{' '}
                  or drag and drop
                </span>
                <p className="text-xs text-gray-400 mt-1">
                  JPEG, PNG, WebP, or GIF (max 5MB each, up to {maxImages}{' '}
                  images)
                </p>
              </div>
            </>
          )}

          <input
            ref={fileInputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp,image/gif"
            multiple
            onChange={handleFileSelect}
            className="hidden"
          />
        </div>
      ) : (
        <p className="text-xs text-gray-400 text-center py-2">
          Maximum {maxImages} images reached. Remove an image to add more.
        </p>
      )}
    </div>
  );
}
