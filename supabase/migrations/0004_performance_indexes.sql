-- Performance Optimization Migration

-- 1. Enable pg_trgm for fuzzy search on product names
CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- 2. Products - Sorting & Filtering
-- For "New Arrivals" and default listing order
CREATE INDEX IF NOT EXISTS idx_products_active_created ON products(is_active, created_at DESC);

-- For "Sort by Price"
CREATE INDEX IF NOT EXISTS idx_products_price ON products(price);

-- For Fuzzy Search on Product Name
CREATE INDEX IF NOT EXISTS idx_products_name_trgm ON products USING gin (name gin_trgm_ops);

-- 3. Orders - Admin Dashboard Performance
-- For faster order lookups by date (Recent Orders)
CREATE INDEX IF NOT EXISTS idx_orders_created_at ON orders(created_at DESC);

-- For filtering orders by status
CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status);
