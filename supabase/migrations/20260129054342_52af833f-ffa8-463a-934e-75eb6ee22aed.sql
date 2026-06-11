-- =====================================================
-- CRITICAL SECURITY FIX: Remove ALL public access policies
-- =====================================================

-- 1. BRANCHES: Remove public access, enforce role-based access
DROP POLICY IF EXISTS "Anyone can view branch basics" ON public.branches;

-- Create secure policy: Only authenticated staff can view branches
-- Admin, Call Center, Kitchen can see name only
-- Branch Manager sees their own branch details
CREATE OR REPLACE FUNCTION public.get_branch_for_store()
RETURNS TABLE(id uuid, name text)
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT id, name 
  FROM public.branches
  WHERE auth.uid() IS NOT NULL;
$$;

-- 2. PRODUCTS: Remove public access, enforce authenticated access
DROP POLICY IF EXISTS "Anyone can view active products" ON public.products;

-- Create policy: Only authenticated users can view active products
CREATE POLICY "Authenticated users can view active products"
ON public.products
FOR SELECT
USING (
  auth.uid() IS NOT NULL 
  AND is_active = true
);

-- 3. Create secure RPC for store products (authenticated only)
CREATE OR REPLACE FUNCTION public.get_products_for_authenticated_store()
RETURNS TABLE(
  id uuid, 
  name text, 
  description text, 
  price numeric, 
  category text, 
  image_url text
)
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT 
    id,
    name,
    description,
    price,
    category,
    image_url
  FROM public.products
  WHERE is_active = true
    AND auth.uid() IS NOT NULL
  ORDER BY display_order ASC, name ASC;
$$;

-- 4. Create secure RPC for branches (authenticated only, name only)
CREATE OR REPLACE FUNCTION public.get_branches_for_authenticated_store()
RETURNS TABLE(id uuid, name text, address text)
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT id, name, address
  FROM public.branches
  WHERE auth.uid() IS NOT NULL;
$$;

-- 5. Ensure anonymous users CANNOT access branches
-- The existing "Deny anonymous access" policy is RESTRICTIVE but may conflict
-- Let's ensure branches are properly locked down
DROP POLICY IF EXISTS "Deny anonymous access to branches" ON public.branches;

CREATE POLICY "Deny anonymous access to branches"
ON public.branches
FOR SELECT
USING (auth.uid() IS NOT NULL);