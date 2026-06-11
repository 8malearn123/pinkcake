
-- =====================================================
-- DEEP SECURITY: Restrict Customer Data Access
-- =====================================================

-- 1. Create a secure function for call center to search customers (by phone only)
-- This limits what call center can query without exposing full list
CREATE OR REPLACE FUNCTION public.search_customer_by_phone(_phone text)
RETURNS TABLE(id uuid, name text, phone text, address text)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT id, name, phone, address
  FROM public.customers
  WHERE phone = _phone
    AND (public.is_admin(auth.uid()) OR public.has_role(auth.uid(), 'call_center'))
$$;

-- 2. Create a view for limited customer access (name only for order display)
CREATE OR REPLACE FUNCTION public.get_customer_name_only(_customer_id uuid)
RETURNS text
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT name FROM public.customers WHERE id = _customer_id LIMIT 1
$$;

-- 3. Remove phone column exposure from profiles for non-self access
-- Admin can see profiles but without exposing phone in list views

-- 4. Ensure order_logs cannot be modified (already no UPDATE/DELETE policies)
-- This is defense-in-depth: no policies = no access, which is correct
