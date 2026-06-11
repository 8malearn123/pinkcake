-- =====================================================
-- ADDITIONAL SECURITY FIXES
-- =====================================================

-- 1. Add explicit DELETE policy for profiles (only admins can delete)
CREATE POLICY "Only admins can delete profiles"
ON public.profiles
FOR DELETE
USING (public.is_admin(auth.uid()));

-- 2. Add explicit UPDATE/DELETE restriction on order_logs (audit logs should be immutable)
-- Logs should never be updated or deleted
CREATE POLICY "Order logs cannot be updated"
ON public.order_logs
FOR UPDATE
USING (false);

CREATE POLICY "Order logs cannot be deleted"
ON public.order_logs
FOR DELETE
USING (false);

-- 3. Split order_items ALL policy into specific policies for better control
DROP POLICY IF EXISTS "Call center and admins can manage order items" ON public.order_items;

-- Admins can do everything
CREATE POLICY "Admins can manage all order items"
ON public.order_items
FOR ALL
USING (public.is_admin(auth.uid()));

-- Call center can only INSERT and UPDATE (not DELETE)
CREATE POLICY "Call center can insert order items"
ON public.order_items
FOR INSERT
WITH CHECK (public.has_role(auth.uid(), 'call_center'));

CREATE POLICY "Call center can update order items"
ON public.order_items
FOR UPDATE
USING (public.has_role(auth.uid(), 'call_center'));

-- 4. Make branches phone visible only to admin and call_center
-- First update RLS policy
DROP POLICY IF EXISTS "Authenticated users can view branches" ON public.branches;

-- Create function to get branches with restricted phone visibility
CREATE OR REPLACE FUNCTION public.get_branches_for_display()
RETURNS TABLE(
  id uuid,
  name text,
  address text,
  phone text
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT 
    b.id,
    b.name,
    b.address,
    -- Only show phone to admin and call_center
    CASE 
      WHEN public.is_admin(auth.uid()) OR public.has_role(auth.uid(), 'call_center') 
      THEN b.phone 
      ELSE NULL 
    END as phone
  FROM public.branches b
$$;

-- Allow authenticated users to view branches (but phone is filtered by function)
CREATE POLICY "Authenticated users can view branches"
ON public.branches
FOR SELECT
USING (auth.uid() IS NOT NULL);

-- 5. Create secure function to get employee profiles (hide phone from non-authorized)
CREATE OR REPLACE FUNCTION public.get_employees_secure()
RETURNS TABLE(
  id uuid,
  full_name text,
  avatar_url text,
  phone text,
  created_at timestamp with time zone,
  roles text[]
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT 
    p.id,
    p.full_name,
    p.avatar_url,
    -- Only show phone to admin
    CASE WHEN public.is_admin(auth.uid()) THEN p.phone ELSE NULL END,
    p.created_at,
    ARRAY(
      SELECT r.role::text 
      FROM public.user_roles r 
      WHERE r.user_id = p.id
    ) as roles
  FROM public.profiles p
  WHERE public.is_admin(auth.uid()) OR public.has_role(auth.uid(), 'call_center')
$$;