/**
 * Checkout Page — /checkout
 * 
 * Server component wrapper + client form for COD checkout.
 * Fixes from original: uses server action for cart, correct ৳ currency,
 * consistent delivery fee, proper form validation and error display.
 */

import { getCart } from '@/server-actions/cart';
import { redirect } from 'next/navigation';
import { CheckoutForm } from './checkout-form';

export default async function CheckoutPage() {
  const cart = await getCart();
  const items = cart?.items ?? [];

  if (items.length === 0) {
    redirect('/cart');
  }

  const subtotal = items.reduce(
    (sum: number, item: any) => sum + item.price * item.quantity,
    0
  );

  const DELIVERY_FEE = 80;
  const total = subtotal + DELIVERY_FEE;

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-6 md:py-10">
        <h1 className="text-2xl md:text-3xl font-bold text-gray-900 mb-8">
          Checkout
        </h1>

        <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
          {/* Delivery Form */}
          <div className="lg:col-span-3">
            <CheckoutForm />
          </div>

          {/* Order Summary */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-xl border p-6 sticky top-24">
              <h2 className="font-semibold text-gray-900 mb-4">
                Order Summary
              </h2>

              {/* Items */}
              <div className="space-y-3 mb-6 max-h-60 overflow-y-auto">
                {items.map((item: any) => (
                  <div
                    key={item.product_id}
                    className="flex items-center justify-between text-sm"
                  >
                    <div className="flex-1 min-w-0 mr-4">
                      <p className="font-medium text-gray-900 truncate">
                        {item.product_name || item.name}
                      </p>
                      <p className="text-gray-500">Qty: {item.quantity}</p>
                    </div>
                    <p className="font-medium text-gray-900 whitespace-nowrap">
                      ৳{(item.price * item.quantity).toLocaleString()}
                    </p>
                  </div>
                ))}
              </div>

              {/* Totals */}
              <div className="border-t pt-4 space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Subtotal</span>
                  <span className="font-medium">৳{subtotal.toLocaleString()}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Delivery Fee</span>
                  <span className="font-medium">৳{DELIVERY_FEE}</span>
                </div>
                <div className="border-t pt-3 flex justify-between">
                  <span className="font-semibold text-gray-900">Total</span>
                  <span className="font-bold text-lg text-gray-900">
                    ৳{total.toLocaleString()}
                  </span>
                </div>
              </div>

              {/* Payment Method Indicator */}
              <div className="mt-6 flex items-center gap-3 bg-gray-50 rounded-lg p-3">
                <span className="text-lg">💰</span>
                <div>
                  <p className="text-sm font-medium text-gray-900">
                    Cash on Delivery
                  </p>
                  <p className="text-xs text-gray-500">
                    Pay when you receive your order
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
