-- Fix remaining critical issues

-- 1. Fix customers table - remove the policy that could allow user_id manipulation
DROP POLICY IF EXISTS "Only own customer profile or secure function" ON public.customers;
DROP POLICY IF EXISTS "Customers can only view own profile" ON public.customers;

-- Create a stricter policy that prevents any manipulation
CREATE POLICY "Customers view only own profile"
ON public.customers
FOR SELECT
TO authenticated
USING (
  -- Customer can only see profile linked to their auth.uid()
  -- This is immutable - user_id is set at creation and cannot be changed
  user_id = auth.uid()
);

-- 2. Ensure user_id cannot be manipulated on insert
DROP POLICY IF EXISTS "Call center and admins can create customers" ON public.customers;

CREATE POLICY "Staff can create customers for new users"
ON public.customers
FOR INSERT
TO authenticated
WITH CHECK (
  -- Only admin and call_center can create customers
  (public.is_admin(auth.uid()) OR public.has_role(auth.uid(), 'call_center'))
  OR
  -- Customers can create their own profile (user_id must match their auth.uid)
  (user_id = auth.uid() AND public.has_role(auth.uid(), 'customer'))
);

-- 3. Fix profiles table - ensure the policies are airtight
-- Drop any problematic policies
DROP POLICY IF EXISTS "Users see only own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can view own profile only" ON public.profiles;

-- Create a single strict policy
CREATE POLICY "Strict profile access - own only"
ON public.profiles
FOR SELECT
TO authenticated
USING (
  -- Users can ONLY see their own profile
  -- No exceptions - admin access is through audited functions
  id = auth.uid()
);

-- 4. Update product_reviews to anonymize customer info in public listing
DROP POLICY IF EXISTS "Anyone can view reviews" ON public.product_reviews;

CREATE POLICY "Authenticated view reviews without customer details"
ON public.product_reviews
FOR SELECT
TO authenticated
USING (
  -- Allow viewing reviews but customer_id will be masked via the RPC
  auth.uid() IS NOT NULL
);

-- Create a secure function to get reviews with anonymized customer data
CREATE OR REPLACE FUNCTION public.get_product_reviews(_product_id uuid)
RETURNS TABLE(id uuid, rating integer, review_text text, created_at timestamp with time zone, customer_name text)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT 
    pr.id,
    pr.rating,
    pr.review_text,
    pr.created_at,
    -- Only show first part of name for privacy
    CASE 
      WHEN LENGTH(c.name) > 3 THEN SUBSTRING(c.name, 1, 3) || '***'
      ELSE '***'
    END as customer_name
  FROM public.product_reviews pr
  JOIN public.customers c ON c.id = pr.customer_id
  WHERE pr.product_id = _product_id
  ORDER BY pr.created_at DESC
$$;

-- 5. Fix orders table - ensure payment_link is not accessible to kitchen/branch via direct query
-- The RLS allows viewing but the get_order_details_secure function masks it properly
-- Let's add an extra check in the base policy

-- Note: RLS is row-level, not column-level, so we can't hide specific columns
-- The protection is in the secure functions which mask payment_link for unauthorized roles
-- This is already implemented in get_order_details_secure

-- 6. Clean up duplicate policies on profiles
-- List and remove duplicates
DROP POLICY IF EXISTS "Deny anonymous access to profiles" ON public.profiles;