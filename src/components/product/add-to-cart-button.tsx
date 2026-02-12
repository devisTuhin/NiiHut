'use client';

/**
 * AddToCartButton — Client component that calls the addToCart server action.
 * Shows loading state during submission and success feedback after.
 */

import { addToCart } from '@/server-actions/cart';
import { Check, Loader2, ShoppingBag } from 'lucide-react';
import { useState, useTransition } from 'react';

export function AddToCartButton({
  productId,
  disabled = false,
  className,
}: {
  productId: string;
  disabled?: boolean;
  className?: string;
}) {
  const [isPending, startTransition] = useTransition();
  const [showSuccess, setShowSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleAddToCart = () => {
    setError(null);
    startTransition(async () => {
      try {
        const result = await addToCart(productId, 1);
        if (result.success) {
          setShowSuccess(true);
          setTimeout(() => setShowSuccess(false), 2000);
        }
      } catch (err: any) {
        setError(err.message || 'Failed to add to cart');
      }
    });
  };

  return (
    <div>
      <button
        onClick={handleAddToCart}
        disabled={isPending || disabled || showSuccess}
        className={`
          inline-flex items-center justify-center gap-2.5
          w-full sm:w-auto px-8 py-3.5 rounded-lg
          font-semibold text-sm
          transition-all duration-300 ease-out
          ${
            showSuccess
              ? 'bg-green-600 text-white scale-[1.02]'
              : disabled
                ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                : 'bg-gray-900 text-white hover:bg-gray-800 hover:shadow-lg active:scale-[0.98]'
          }
          disabled:cursor-not-allowed
          ${className ?? ''}
        `}
      >
        {isPending ? (
          <>
            <Loader2 className="w-4 h-4 animate-spin" />
            Adding…
          </>
        ) : showSuccess ? (
          <>
            <Check className="w-4 h-4" />
            Added to Cart!
          </>
        ) : (
          <>
            <ShoppingBag className="w-4 h-4" />
            {disabled ? 'Out of Stock' : 'Add to Cart'}
          </>
        )}
      </button>
      {error && (
        <p className="text-sm text-red-600 mt-2">{error}</p>
      )}
    </div>
  );
}
