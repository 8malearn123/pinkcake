-- Fix critical view access control issues

-- 1. Drop the views that have no RLS and are causing issues
DROP VIEW IF EXISTS public.profiles_staff_view;
DROP VIEW IF EXISTS public.profiles_admin_safe;

-- 2. Recreate profiles_admin_safe as a security definer function instead
-- This ensures proper access control
CREATE OR REPLACE FUNCTION public.get_profiles_for_admin()
RETURNS TABLE(
  id uuid,
  full_name text,
  avatar_url text,
  created_at timestamp with time zone,
  updated_at timestamp with time zone
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT 
    id,
    full_name,
    avatar_url,
    created_at,
    updated_at
    -- phone is intentionally excluded - must use get_profile_phone_audited
  FROM public.profiles
  WHERE public.is_admin(auth.uid()) OR public.has_role(auth.uid(), 'call_center')
$$;

-- 3. Drop the helper function that's no longer needed
DROP FUNCTION IF EXISTS public.can_view_profiles_basic();

-- 4. Add explicit DELETE deny policy for order_items
DROP POLICY IF EXISTS "Admins can manage all order items" ON public.order_items;

CREATE POLICY "Admins can fully manage order items"
ON public.order_items
FOR ALL
TO authenticated
USING (public.is_admin(auth.uid()))
WITH CHECK (public.is_admin(auth.uid()));

-- Explicit deny for non-admin deletions
CREATE POLICY "Non-admins cannot delete order items"
ON public.order_items
FOR DELETE
TO authenticated
USING (false);

-- 5. Add admin moderation policy for product reviews
CREATE POLICY "Admins can moderate reviews"
ON public.product_reviews
FOR ALL
TO authenticated
USING (public.is_admin(auth.uid()))
WITH CHECK (public.is_admin(auth.uid()));

-- 6. Fix the customers table access - ensure staff can only access through secure functions
-- Drop any remaining problematic SELECT policies
DROP POLICY IF EXISTS "Customers view only own profile" ON public.customers;

-- Recreate with very strict access
CREATE POLICY "Customer sees only own record"
ON public.customers
FOR SELECT
TO authenticated
USING (
  -- Customers can ONLY see their own profile (linked by user_id)
  user_id = auth.uid()
  -- All staff access MUST go through security definer functions like:
  -- - search_customer_by_phone (for call center/admin)
  -- - get_order_details_secure (for order-related access)
  -- - get_customer_phone_audited (for audited phone reveal)
);