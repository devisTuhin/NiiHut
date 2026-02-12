/**
 * Public Shop Layout
 * Shared header with navigation, cart badge, and footer.
 * Used by all public-facing pages: /home, /product, /category
 */

import { getCartItemCount } from '@/server-actions/cart';
import { UserButton } from '@clerk/nextjs';
import { ShoppingCart } from 'lucide-react';
import Link from 'next/link';

export default async function ShopLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  let cartCount = 0;
  try {
    cartCount = await getCartItemCount();
  } catch {
    // Silently handle — cart count is non-critical
  }

  return (
    <div className="flex min-h-screen flex-col">
      {/* ── Header ── */}
      <header className="sticky top-0 z-50 bg-white/95 backdrop-blur-md border-b border-gray-100">
        <div className="container mx-auto flex items-center justify-between px-4 h-16">
          {/* Logo */}
          <Link
            href="/home"
            className="text-xl font-bold tracking-tight text-gray-900 hover:text-gray-700 transition-colors"
          >
            NiiHut
          </Link>

          {/* Desktop Nav */}
          <nav className="hidden md:flex items-center gap-8">
            <Link
              href="/product"
              className="text-sm font-medium text-gray-600 hover:text-gray-900 transition-colors"
            >
              Products
            </Link>
            <Link
              href="/category"
              className="text-sm font-medium text-gray-600 hover:text-gray-900 transition-colors"
            >
              Categories
            </Link>
          </nav>

          {/* Right Actions */}
          <div className="flex items-center gap-4">
            {/* Cart */}
            <Link
              href="/cart"
              className="relative flex items-center justify-center w-10 h-10 rounded-full hover:bg-gray-100 transition-colors"
              aria-label="Shopping Cart"
            >
              <ShoppingCart className="w-5 h-5 text-gray-700" />
              {cartCount > 0 && (
                <span className="absolute -top-0.5 -right-0.5 w-5 h-5 bg-gray-900 text-white text-[10px] font-bold rounded-full flex items-center justify-center">
                  {cartCount > 99 ? '99+' : cartCount}
                </span>
              )}
            </Link>

            {/* Profile */}
            <Link
              href="/profile"
              className="text-sm font-medium text-gray-600 hover:text-gray-900 transition-colors hidden md:block"
            >
              My Orders
            </Link>

            {/* Clerk */}
            <UserButton />
          </div>
        </div>
      </header>

      {/* ── Main Content ── */}
      <main className="flex-1">{children}</main>

      {/* ── Footer ── */}
      <footer className="border-t bg-gray-50">
        <div className="container mx-auto px-4 py-10">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div>
              <h3 className="font-bold text-gray-900 mb-3">NiiHut</h3>
              <p className="text-sm text-gray-500 leading-relaxed">
                Your trusted online store. Quality products delivered across
                Bangladesh with Cash on Delivery.
              </p>
            </div>
            <div>
              <h4 className="font-semibold text-gray-900 text-sm mb-3">
                Quick Links
              </h4>
              <nav className="flex flex-col gap-2">
                <Link
                  href="/product"
                  className="text-sm text-gray-500 hover:text-gray-900 transition-colors"
                >
                  All Products
                </Link>
                <Link
                  href="/category"
                  className="text-sm text-gray-500 hover:text-gray-900 transition-colors"
                >
                  Categories
                </Link>
                <Link
                  href="/profile"
                  className="text-sm text-gray-500 hover:text-gray-900 transition-colors"
                >
                  My Orders
                </Link>
              </nav>
            </div>
            <div>
              <h4 className="font-semibold text-gray-900 text-sm mb-3">
                Support
              </h4>
              <p className="text-sm text-gray-500">
                Cash on Delivery available
              </p>
              <p className="text-sm text-gray-500">3-5 day delivery</p>
            </div>
          </div>
          <div className="border-t mt-8 pt-6 text-center">
            <p className="text-xs text-gray-400">
              &copy; {new Date().getFullYear()} NiiHut. All rights reserved.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
