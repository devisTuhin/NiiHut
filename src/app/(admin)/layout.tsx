/**
 * Admin Layout
 * Sidebar navigation with icons and active state highlighting.
 * Enforces admin authentication.
 */

import { checkRole } from '@/lib/auth';
import { currentUser } from '@clerk/nextjs/server';
import {
    FolderTree,
    LayoutDashboard,
    Package,
    ShoppingCart
} from 'lucide-react';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import { AdminSidebarLink } from './admin-sidebar-link';

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await currentUser();
  const isAdmin = await checkRole('admin');

  if (!user || !isAdmin) {
    redirect('/');
  }

  const navItems = [
    { href: '/admin/dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { href: '/admin/orders', label: 'Orders', icon: ShoppingCart },
    { href: '/admin/products', label: 'Products', icon: Package },
    { href: '/admin/categories', label: 'Categories', icon: FolderTree },
  ];

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Sidebar */}
      <aside className="w-64 bg-white border-r flex flex-col flex-shrink-0">
        {/* Logo */}
        <div className="h-16 flex items-center px-6 border-b">
          <Link
            href="/admin/dashboard"
            className="text-lg font-bold text-gray-900"
          >
            NiiHut Admin
          </Link>
        </div>

        {/* Nav Links */}
        <nav className="flex-1 px-3 py-4 space-y-1">
          {navItems.map((item) => (
            <AdminSidebarLink key={item.href} {...item} />
          ))}
        </nav>

        {/* Footer */}
        <div className="border-t px-4 py-3">
          <Link
            href="/"
            className="text-xs text-gray-500 hover:text-gray-900 transition-colors"
          >
            ← Back to Store
          </Link>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto">
        <div className="p-6 md:p-8">{children}</div>
      </main>
    </div>
  );
}
