'use client';

/**
 * ImageUpload — Reusable drag-and-drop image upload component.
 *
 * Features:
 *  - Drag & drop zone
 *  - Click to browse files
 *  - Image preview
 *  - Upload progress feedback
 *  - Remove uploaded image
 *  - Toggle to "Use URL" mode
 */

import { deleteCategoryImage, uploadCategoryImage } from '@/server-actions/upload';
import { ImagePlus, Loader2, Trash2, Upload, X } from 'lucide-react';
import Image from 'next/image';
import { useCallback, useRef, useState } from 'react';

interface ImageUploadProps {
  value?: string;
  onChange: (url: string | null) => void;
  label?: string;
}

export function ImageUpload({ value, onChange, label = 'Image' }: ImageUploadProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [useUrl, setUseUrl] = useState(false);
  const [urlInput, setUrlInput] = useState(value || '');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFile = useCallback(
    async (file: File) => {
      setError(null);
      setIsUploading(true);

      try {
        const formData = new FormData();
        formData.append('file', file);

        const result = await uploadCategoryImage(formData);

        if (!result.success) {
          setError(result.error || 'Upload failed.');
          return;
        }

        onChange(result.url || null);
      } catch (err: any) {
        setError(err.message || 'Upload failed.');
      } finally {
        setIsUploading(false);
      }
    },
    [onChange]
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

      const file = e.dataTransfer.files?.[0];
      if (file && file.type.startsWith('image/')) {
        handleFile(file);
      } else {
        setError('Please drop an image file (JPEG, PNG, WebP, or GIF).');
      }
    },
    [handleFile]
  );

  const handleFileSelect = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) {
        handleFile(file);
      }
      // Reset the input value so same file can be selected again
      e.target.value = '';
    },
    [handleFile]
  );

  const handleRemove = useCallback(async () => {
    if (value && value.includes('category-images')) {
      // It's an uploaded image, delete from storage
      setIsUploading(true);
      try {
        await deleteCategoryImage(value);
      } catch {
        // Ignore deletion errors
      } finally {
        setIsUploading(false);
      }
    }
    onChange(null);
    setUrlInput('');
  }, [value, onChange]);

  const handleUrlSubmit = useCallback(() => {
    if (urlInput.trim()) {
      onChange(urlInput.trim());
    }
  }, [urlInput, onChange]);

  return (
    <div className="w-full">
      <div className="flex items-center justify-between mb-1.5">
        <label className="block text-sm font-medium text-gray-700">
          {label}
        </label>
        <button
          type="button"
          onClick={() => {
            setUseUrl(!useUrl);
            setError(null);
          }}
          className="text-xs text-gray-500 hover:text-gray-700 transition-colors underline"
        >
          {useUrl ? 'Upload instead' : 'Use URL instead'}
        </button>
      </div>

      {error && (
        <div className="mb-2 bg-red-50 border border-red-200 rounded-lg px-3 py-2 text-xs text-red-700 flex items-center gap-2">
          <X className="w-3.5 h-3.5 flex-shrink-0" />
          {error}
        </div>
      )}

      {useUrl ? (
        /* URL Input Mode */
        <div className="flex gap-2">
          <input
            type="url"
            placeholder="https://example.com/image.jpg"
            value={urlInput}
            onChange={(e) => setUrlInput(e.target.value)}
            onBlur={handleUrlSubmit}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault();
                handleUrlSubmit();
              }
            }}
            className="flex-1 h-10 rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-black/10 focus:border-gray-900 transition-colors duration-200"
          />
        </div>
      ) : value ? (
        /* Preview Mode */
        <div className="relative group rounded-lg overflow-hidden border border-gray-200 bg-gray-50">
          <div className="relative w-full aspect-video">
            <Image
              src={value}
              alt="Category image"
              fill
              className="object-cover"
              sizes="400px"
            />
          </div>
          <button
            type="button"
            onClick={handleRemove}
            disabled={isUploading}
            className="absolute top-2 right-2 p-1.5 bg-red-500 text-white rounded-lg opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-600 disabled:opacity-50"
            title="Remove image"
          >
            {isUploading ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Trash2 className="w-4 h-4" />
            )}
          </button>
        </div>
      ) : (
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
            ${isUploading ? 'pointer-events-none opacity-60' : ''}
          `}
        >
          {isUploading ? (
            <>
              <Loader2 className="w-8 h-8 text-gray-400 animate-spin" />
              <span className="text-sm text-gray-500">Uploading…</span>
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
                  <span className="font-medium text-gray-900">Click to upload</span>{' '}
                  or drag and drop
                </span>
                <p className="text-xs text-gray-400 mt-1">
                  JPEG, PNG, WebP, or GIF (max 5MB)
                </p>
              </div>
            </>
          )}

          <input
            ref={fileInputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp,image/gif"
            onChange={handleFileSelect}
            className="hidden"
          />
        </div>
      )}

      {/* Show URL preview thumbnail if URL mode and we have a value */}
      {useUrl && value && (
        <div className="mt-2 relative w-20 h-20 rounded-lg overflow-hidden border border-gray-200 group">
          <Image
            src={value}
            alt="Preview"
            fill
            className="object-cover"
            sizes="80px"
          />
          <button
            type="button"
            onClick={handleRemove}
            className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity"
          >
            <Trash2 className="w-4 h-4 text-white" />
          </button>
        </div>
      )}
    </div>
  );
}
