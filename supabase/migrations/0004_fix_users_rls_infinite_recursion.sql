-- Fix: Infinite recursion in users RLS policy
-- The "Users can view own profile" policy calls is_admin() which queries users,
-- triggering the same policy again → infinite recursion.

-- Drop the problematic policy
DROP POLICY IF EXISTS "Users can view own profile" ON users;

-- Create two simpler, non-recursive policies
-- 1. Users can always see their own profile (by clerk_id match)
CREATE POLICY "Users view own profile" ON users
  FOR SELECT
  USING (auth.uid()::text = clerk_id);

-- 2. Authenticated users can view user records for role checks
-- This allows the is_admin() function used in other tables' policies
-- to query users without triggering recursive policy evaluation
CREATE POLICY "Authenticated users view for role checks" ON users
  FOR SELECT
  TO authenticated
  USING (true);
