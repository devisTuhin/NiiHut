/**
 * Profile Page — /profile
 * Displays user account info, order history with tracking info.
 * Server Component.
 */

import { StatusBadge } from '@/components/ui/badge';
import { EmptyState } from '@/components/ui/empty-state';
import { getCurrentUser } from '@/lib/auth';
import { getUserOrders } from '@/server-actions/order';
import { Package, ShoppingBag, UserIcon } from 'lucide-react';
import { redirect } from 'next/navigation';

export default async function ProfilePage() {
  const user = await getCurrentUser();

  if (!user) {
    redirect('/sign-in');
  }

  const orders = await getUserOrders();

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-6 md:py-10 max-w-4xl">
        {/* User Info Card */}
        <div className="bg-white rounded-xl border p-6 mb-8">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-full bg-gray-100 flex items-center justify-center">
              <UserIcon className="w-7 h-7 text-gray-400" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-gray-900">
                {user.full_name || 'Welcome back!'}
              </h1>
              <p className="text-sm text-gray-500">{user.email}</p>
              {user.phone && (
                <p className="text-sm text-gray-500">{user.phone}</p>
              )}
            </div>
          </div>
        </div>

        {/* Order History */}
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-bold text-gray-900">My Orders</h2>
          <span className="text-sm text-gray-500">
            {orders.length} order{orders.length !== 1 ? 's' : ''}
          </span>
        </div>

        {orders.length === 0 ? (
          <EmptyState
            icon={ShoppingBag}
            title="No orders yet"
            description="When you place an order, it will appear here."
            actionLabel="Start Shopping"
            actionHref="/product"
          />
        ) : (
          <div className="space-y-4">
            {orders.map((order: any) => (
              <div
                key={order.id}
                className="bg-white rounded-xl border p-5 hover:shadow-sm transition-shadow"
              >
                <div className="flex flex-wrap items-start justify-between gap-3 mb-3">
                  <div>
                    <p className="text-sm font-medium text-gray-900">
                      Order #{order.id.slice(0, 8)}
                    </p>
                    <p className="text-xs text-gray-500 mt-0.5">
                      {new Date(order.created_at).toLocaleDateString('en-US', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric',
                      })}
                    </p>
                  </div>
                  <StatusBadge status={order.status} />
                </div>

                {/* Items */}
                <div className="space-y-2 mb-3">
                  {(order.items || order.order_items || [])
                    .slice(0, 3)
                    .map((item: any, idx: number) => (
                      <div
                        key={idx}
                        className="flex justify-between text-sm text-gray-600"
                      >
                        <span className="truncate mr-4">
                          {item.product_name || item.name} × {item.quantity}
                        </span>
                        <span className="whitespace-nowrap font-medium">
                          ৳{(item.price * item.quantity).toLocaleString()}
                        </span>
                      </div>
                    ))}
                  {(order.items || order.order_items || []).length > 3 && (
                    <p className="text-xs text-gray-400">
                      +{(order.items || order.order_items || []).length - 3} more item(s)
                    </p>
                  )}
                </div>

                {/* Total & Tracking */}
                <div className="border-t pt-3 flex flex-wrap items-center justify-between gap-2">
                  <p className="font-semibold text-gray-900">
                    Total: ৳{Number(order.total_amount).toLocaleString()}
                  </p>

                  <div className="flex items-center gap-3">
                    {/* Tracking Number */}
                    {order.tracking_number && (
                      <div className="flex items-center gap-1.5 text-xs text-gray-500">
                        <Package className="w-3.5 h-3.5" />
                        <span>Tracking: {order.tracking_number}</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
