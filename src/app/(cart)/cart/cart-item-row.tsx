/**
 * Cart Item Row — Client component for individual cart items.
 * Handles quantity changes and removal with optimistic updates.
 */

'use client';

import { removeFromCart, updateCartItem } from '@/server-actions/cart';
import { Loader2, Minus, Plus, Trash2 } from 'lucide-react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { useTransition } from 'react';

export function CartItemRow({ item }: { item: any }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const product = item.product;
  const imageUrl =
    product?.images?.sort((a: any, b: any) => a.display_order - b.display_order)?.[0]?.url ?? null;
  const price = Number(product?.price ?? 0);

  const handleQuantityChange = (newQty: number) => {
    if (newQty < 1) return;
    startTransition(async () => {
      await updateCartItem(item.id, newQty);
      router.refresh();
    });
  };

  const handleRemove = () => {
    startTransition(async () => {
      await removeFromCart(item.id);
      router.refresh();
    });
  };

  return (
    <div
      className={`bg-white rounded-xl border p-4 flex gap-4 items-center transition-opacity ${
        isPending ? 'opacity-60' : ''
      }`}
    >
      {/* Image */}
      <div className="relative w-20 h-20 bg-gray-100 rounded-lg overflow-hidden flex-shrink-0">
        {imageUrl ? (
          <Image
            src={imageUrl}
            alt={product?.name || 'Product'}
            fill
            className="object-cover"
            sizes="80px"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-gray-300 text-xs">
            No Image
          </div>
        )}
      </div>

      {/* Details */}
      <div className="flex-1 min-w-0">
        <h3 className="font-medium text-sm text-gray-900 truncate">
          {product?.name || 'Unknown Product'}
        </h3>
        <p className="text-sm font-bold text-gray-900 mt-1">
          ৳{price.toLocaleString()}
        </p>
      </div>

      {/* Quantity Controls */}
      <div className="flex items-center gap-1.5">
        <button
          onClick={() => handleQuantityChange(item.quantity - 1)}
          disabled={isPending || item.quantity <= 1}
          className="w-8 h-8 rounded-lg border flex items-center justify-center hover:bg-gray-50 disabled:opacity-40 transition-colors"
          aria-label="Decrease quantity"
        >
          <Minus className="w-3.5 h-3.5" />
        </button>
        <span className="w-8 text-center text-sm font-medium tabular-nums">
          {item.quantity}
        </span>
        <button
          onClick={() => handleQuantityChange(item.quantity + 1)}
          disabled={isPending}
          className="w-8 h-8 rounded-lg border flex items-center justify-center hover:bg-gray-50 disabled:opacity-40 transition-colors"
          aria-label="Increase quantity"
        >
          <Plus className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Subtotal & Remove */}
      <div className="text-right flex-shrink-0">
        <p className="text-sm font-bold text-gray-900">
          ৳{(price * item.quantity).toLocaleString()}
        </p>
        <button
          onClick={handleRemove}
          disabled={isPending}
          className="text-xs text-red-500 hover:text-red-700 transition-colors mt-1 inline-flex items-center gap-1"
          aria-label="Remove item"
        >
          {isPending ? (
            <Loader2 className="w-3 h-3 animate-spin" />
          ) : (
            <Trash2 className="w-3 h-3" />
          )}
          Remove
        </button>
      </div>
    </div>
  );
}
