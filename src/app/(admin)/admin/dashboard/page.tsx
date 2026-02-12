/**
 * Admin Dashboard — /admin/dashboard
 * Overview statistics and recent orders table.
 */

import { StatusBadge } from '@/components/ui/badge';
import { getAdminOrders, getDashboardStats } from '@/server-actions/admin';
import {
    DollarSign,
    Package,
    ShoppingCart,
    TrendingUp,
} from 'lucide-react';
import Link from 'next/link';

export default async function AdminDashboard() {
  const [stats, { orders: recentOrders }] = await Promise.all([
    getDashboardStats(),
    getAdminOrders({ perPage: 5 }),
  ]);

  const statCards = [
    {
      label: 'Total Orders',
      value: stats.totalOrders ?? 0,
      icon: ShoppingCart,
      color: 'bg-blue-50 text-blue-600',
    },
    {
      label: 'Revenue',
      value: `৳${(stats.totalRevenue ?? 0).toLocaleString()}`,
      icon: DollarSign,
      color: 'bg-green-50 text-green-600',
    },
    {
      label: 'Active Products',
      value: stats.totalProducts ?? 0,
      icon: Package,
      color: 'bg-purple-50 text-purple-600',
    },
    {
      label: 'Pending Orders',
      value: stats.pendingOrders ?? 0,
      icon: TrendingUp,
      color: 'bg-yellow-50 text-yellow-600',
    },
  ];

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Dashboard</h1>

      {/* Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {statCards.map((stat) => (
          <div
            key={stat.label}
            className="bg-white rounded-xl border p-5"
          >
            <div className="flex items-center justify-between mb-3">
              <p className="text-sm font-medium text-gray-500">{stat.label}</p>
              <div
                className={`w-9 h-9 rounded-lg flex items-center justify-center ${stat.color}`}
              >
                <stat.icon className="w-4.5 h-4.5" />
              </div>
            </div>
            <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
          </div>
        ))}
      </div>

      {/* Quick Actions */}
      <div className="flex gap-3 mb-8">
        <Link
          href="/admin/products/new"
          className="inline-flex items-center gap-2 px-4 py-2 bg-gray-900 text-white text-sm font-medium rounded-lg hover:bg-gray-800 transition-colors"
        >
          + Add Product
        </Link>
        <Link
          href="/admin/orders"
          className="inline-flex items-center gap-2 px-4 py-2 bg-white border text-gray-700 text-sm font-medium rounded-lg hover:bg-gray-50 transition-colors"
        >
          View All Orders
        </Link>
      </div>

      {/* Recent Orders */}
      <div className="bg-white rounded-xl border">
        <div className="px-5 py-4 border-b">
          <h2 className="font-semibold text-gray-900">Recent Orders</h2>
        </div>

        {(recentOrders ?? []).length === 0 ? (
          <div className="py-12 text-center text-gray-400 text-sm">
            No orders yet.
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
                    Status
                  </th>
                  <th className="text-right px-5 py-3 font-medium text-gray-500">
                    Total
                  </th>
                  <th className="text-right px-5 py-3 font-medium text-gray-500">
                    Date
                  </th>
                </tr>
              </thead>
              <tbody>
                {(recentOrders ?? []).map((order: any) => (
                  <tr
                    key={order.id}
                    className="border-b last:border-b-0 hover:bg-gray-50/50 transition-colors"
                  >
                    <td className="px-5 py-3 font-medium text-gray-900">
                      #{order.id.slice(0, 8)}
                    </td>
                    <td className="px-5 py-3 text-gray-600">
                      {order.delivery_name || order.customer_name || '—'}
                    </td>
                    <td className="px-5 py-3">
                      <StatusBadge status={order.status} />
                    </td>
                    <td className="px-5 py-3 text-right font-medium text-gray-900">
                      ৳{Number(order.total_amount).toLocaleString()}
                    </td>
                    <td className="px-5 py-3 text-right text-gray-500">
                      {new Date(order.created_at).toLocaleDateString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
