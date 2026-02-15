/**
 * Cart Page — /cart
 * Displays cart items with quantity controls, removal, and order summary.
 * Server Component that fetches cart via server action.
 */

import { EmptyState } from '@/components/ui/empty-state';
import { getCart } from '@/server-actions/cart';
import { ShoppingBag } from 'lucide-react';
import Link from 'next/link';
import { CartItemRow } from './cart-item-row';

const DELIVERY_FEE = 80;

export default async function CartPage() {
  const cart = await getCart();
  const items = cart?.items ?? [];

  const subtotal = items.reduce(
    (sum: number, item: any) => sum + Number(item.product?.price ?? 0) * item.quantity,
    0
  );
  const total = subtotal + (items.length > 0 ? DELIVERY_FEE : 0);

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-6 md:py-10">
        <h1 className="text-2xl md:text-3xl font-bold text-gray-900 mb-8">
          Shopping Cart
        </h1>

        {items.length === 0 ? (
          <EmptyState
            icon={ShoppingBag}
            title="Your cart is empty"
            description="Looks like you haven't added anything to your cart yet."
            actionLabel="Browse Products"
            actionHref="/product"
          />
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
            {/* Cart Items */}
            <div className="lg:col-span-3 space-y-3">
              {items.map((item: any) => (
                <CartItemRow key={item.product_id} item={item} />
              ))}
            </div>

            {/* Order Summary */}
            <div className="lg:col-span-2">
              <div className="bg-white rounded-xl border p-6 sticky top-24">
                <h2 className="font-semibold text-gray-900 mb-4">
                  Order Summary
                </h2>
                <div className="space-y-3 mb-6">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500">
                      Subtotal ({items.length} item
                      {items.length !== 1 ? 's' : ''})
                    </span>
                    <span className="font-medium">
                      ৳{subtotal.toLocaleString()}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500">Delivery Fee</span>
                    <span className="font-medium">৳{DELIVERY_FEE}</span>
                  </div>
                </div>

                <div className="border-t pt-4 flex justify-between mb-6">
                  <span className="font-semibold text-gray-900">Total</span>
                  <span className="font-bold text-lg text-gray-900">
                    ৳{total.toLocaleString()}
                  </span>
                </div>

                <Link
                  href="/checkout"
                  className="block w-full text-center bg-gray-900 text-white py-3.5 rounded-lg font-semibold text-sm hover:bg-gray-800 transition-all duration-200"
                >
                  Proceed to Checkout
                </Link>

                <div className="mt-4 flex items-center gap-2 justify-center text-xs text-gray-400">
                  <span>💰</span>
                  <span>Cash on Delivery available</span>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
