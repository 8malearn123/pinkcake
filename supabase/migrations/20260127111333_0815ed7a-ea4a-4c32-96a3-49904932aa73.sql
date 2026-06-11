-- =====================================================
-- FIX: Add explicit DENY policies for anonymous users
-- This ensures RLS blocks unauthenticated access completely
-- =====================================================

-- 1. Profiles - deny anonymous access
CREATE POLICY "Deny anonymous access to profiles"
ON public.profiles
FOR SELECT
TO anon
USING (false);

-- 2. Customers - deny anonymous access
CREATE POLICY "Deny anonymous access to customers"
ON public.customers
FOR SELECT
TO anon
USING (false);

-- 3. Orders - deny anonymous access
CREATE POLICY "Deny anonymous access to orders"
ON public.orders
FOR SELECT
TO anon
USING (false);

-- 4. Order items - deny anonymous access
CREATE POLICY "Deny anonymous access to order_items"
ON public.order_items
FOR SELECT
TO anon
USING (false);

-- 5. Order logs - deny anonymous access
CREATE POLICY "Deny anonymous access to order_logs"
ON public.order_logs
FOR SELECT
TO anon
USING (false);

-- 6. User roles - deny anonymous access
CREATE POLICY "Deny anonymous access to user_roles"
ON public.user_roles
FOR SELECT
TO anon
USING (false);

-- 7. User branch assignments - deny anonymous access
CREATE POLICY "Deny anonymous access to user_branch_assignments"
ON public.user_branch_assignments
FOR SELECT
TO anon
USING (false);

-- 8. Branches - deny anonymous access
CREATE POLICY "Deny anonymous access to branches"
ON public.branches
FOR SELECT
TO anon
USING (false);

-- 9. Products - deny anonymous access
CREATE POLICY "Deny anonymous access to products"
ON public.products
FOR SELECT
TO anon
USING (false);