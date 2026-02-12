/**
 * Admin Orders Page — /admin/orders
 * Lists all orders with status filtering, pagination, and action buttons.
 */

import { StatusBadge } from '@/components/ui/badge';
import { Pagination } from '@/components/ui/pagination';
import { getAdminOrders } from '@/server-actions/admin';
import type { OrderStatus } from '@/types/db';
import { Metadata } from 'next';
import Link from 'next/link';
import { OrderActions } from './order-actions';

export const metadata: Metadata = {
  title: 'Orders | Admin | Niihut',
};

const STATUS_FILTERS = [
  { value: '', label: 'All' },
  { value: 'pending', label: 'Pending' },
  { value: 'pending_confirmation', label: 'Needs Confirmation' },
  { value: 'confirmed', label: 'Confirmed' },
  { value: 'shipped', label: 'Shipped' },
  { value: 'delivered', label: 'Delivered' },
  { value: 'cancelled', label: 'Cancelled' },
];

const PAGE_SIZE = 20;

export default async function AdminOrdersPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string; page?: string }>;
}) {
  const params = await searchParams;
  const { status = '' } = params;
  const page = Number(params.page) || 1;

  const { orders, total } = await getAdminOrders({
    status: (status || undefined) as OrderStatus | undefined,
    page,
    perPage: PAGE_SIZE,
  });

  const totalPages = Math.ceil((total ?? 0) / PAGE_SIZE);

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Orders</h1>
        <span className="text-sm text-gray-500">{total ?? 0} total</span>
      </div>

      {/* Status Filters */}
      <div className="flex flex-wrap gap-2 mb-6">
        {STATUS_FILTERS.map((f) => (
          <Link
            key={f.value}
            href={`/admin/orders${f.value ? `?status=${f.value}` : ''}`}
            className={`px-3.5 py-1.5 rounded-full text-xs font-medium transition-colors ${
              status === f.value || (!status && !f.value)
                ? 'bg-gray-900 text-white'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            {f.label}
          </Link>
        ))}
      </div>

      {/* Orders Table */}
      <div className="bg-white rounded-xl border overflow-hidden">
        {(orders ?? []).length === 0 ? (
          <div className="py-16 text-center text-gray-400 text-sm">
            No orders found.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-gray-50/50">
                  <th className="text-left px-5 py-3 font-medium text-gray-500">
                    Order
                  </th>
                  <th className="text-left px-5 py-3 font-medium text-gray-500">
                    Customer
                  </th>
                  <th className="text-left px-5 py-3 font-medium text-gray-500">
                    Phone
                  </th>
                  <th className="text-left px-5 py-3 font-medium text-gray-500">
                    Status
                  </th>
                  <th className="text-right px-5 py-3 font-medium text-gray-500">
                    Total
                  </th>
                  <th className="text-right px-5 py-3 font-medium text-gray-500">
                    Date
                  </th>
                  <th className="text-right px-5 py-3 font-medium text-gray-500">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody>
                {(orders ?? []).map((order: any) => (
                  <tr
                    key={order.id}
                    className="border-b last:border-b-0 hover:bg-gray-50/50 transition-colors"
                  >
                    <td className="px-5 py-3">
                      <p className="font-medium text-gray-900">
                        #{order.id.slice(0, 8)}
                      </p>
                      {order.tracking_number && (
                        <p className="text-xs text-gray-400 mt-0.5">
                          🚚 {order.tracking_number}
                        </p>
                      )}
                    </td>
                    <td className="px-5 py-3">
                      <p className="text-gray-900">
                        {order.delivery_name || '—'}
                      </p>
                      <p className="text-xs text-gray-400 truncate max-w-[180px]">
                        {order.delivery_address || ''}
                      </p>
                    </td>
                    <td className="px-5 py-3 text-gray-600">
                      {order.delivery_phone || '—'}
                    </td>
                    <td className="px-5 py-3">
                      <StatusBadge status={order.status} />
                    </td>
                    <td className="px-5 py-3 text-right font-medium text-gray-900">
                      ৳{Number(order.total_amount).toLocaleString()}
                    </td>
                    <td className="px-5 py-3 text-right text-gray-500 text-xs">
                      {new Date(order.created_at).toLocaleDateString()}
                    </td>
                    <td className="px-5 py-3 text-right">
                      <OrderActions order={order} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Pagination */}
      <Pagination
        currentPage={page}
        totalPages={totalPages}
        baseUrl="/admin/orders"
        searchParams={{ status }}
      />
    </div>
  );
}
