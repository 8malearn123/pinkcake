-- =====================================================
-- FIX: Add authentication requirement to all tables
-- Ensure all SELECT policies require auth.uid() IS NOT NULL
-- =====================================================

-- 1. Profiles - update existing policies to ensure auth check
DROP POLICY IF EXISTS "Users can view own profile only" ON public.profiles;
DROP POLICY IF EXISTS "Admins and call_center can view all profiles" ON public.profiles;

CREATE POLICY "Users can view own profile only"
ON public.profiles
FOR SELECT
USING (auth.uid() IS NOT NULL AND id = auth.uid());

CREATE POLICY "Admins and call_center can view all profiles"
ON public.profiles
FOR SELECT
USING (auth.uid() IS NOT NULL AND (public.is_admin(auth.uid()) OR public.has_role(auth.uid(), 'call_center')));

-- 2. Customers - already has auth check, verify
DROP POLICY IF EXISTS "Admin and call center can view customers" ON public.customers;

CREATE POLICY "Admin and call center can view customers"
ON public.customers
FOR SELECT
USING (auth.uid() IS NOT NULL AND (public.is_admin(auth.uid()) OR public.has_role(auth.uid(), 'call_center')));

-- 3. Orders - update to ensure auth check
DROP POLICY IF EXISTS "Users can view orders based on role" ON public.orders;

CREATE POLICY "Authenticated users can view orders based on role"
ON public.orders
FOR SELECT
USING (
  auth.uid() IS NOT NULL 
  AND (
    public.is_admin(auth.uid()) 
    OR public.has_role(auth.uid(), 'call_center') 
    OR public.has_role(auth.uid(), 'kitchen') 
    OR (public.has_role(auth.uid(), 'branch') AND branch_id = public.get_user_branch_id(auth.uid()))
  )
);

-- 4. Order items - update to ensure auth check
DROP POLICY IF EXISTS "Authorized roles can view order items" ON public.order_items;

CREATE POLICY "Authenticated users can view order items based on role"
ON public.order_items
FOR SELECT
USING (
  auth.uid() IS NOT NULL 
  AND (
    public.is_admin(auth.uid()) 
    OR public.has_role(auth.uid(), 'call_center') 
    OR public.has_role(auth.uid(), 'kitchen') 
    OR (public.has_role(auth.uid(), 'branch') AND EXISTS (
      SELECT 1 FROM public.orders 
      WHERE orders.id = order_items.order_id 
      AND orders.branch_id = public.get_user_branch_id(auth.uid())
    ))
  )
);

-- 5. User roles - update to ensure auth check
DROP POLICY IF EXISTS "Users can only view their own roles" ON public.user_roles;

CREATE POLICY "Users can only view their own roles"
ON public.user_roles
FOR SELECT
USING (auth.uid() IS NOT NULL AND user_id = auth.uid());

-- Update admin policy too
DROP POLICY IF EXISTS "Admins can manage user roles" ON public.user_roles;

CREATE POLICY "Admins can manage user roles"
ON public.user_roles
FOR ALL
USING (auth.uid() IS NOT NULL AND public.is_admin(auth.uid()));

-- 6. User branch assignments - update to ensure auth check
DROP POLICY IF EXISTS "Users can view their own branch assignment" ON public.user_branch_assignments;

CREATE POLICY "Users can view their own branch assignment"
ON public.user_branch_assignments
FOR SELECT
USING (auth.uid() IS NOT NULL AND user_id = auth.uid());

-- Update admin policy too
DROP POLICY IF EXISTS "Admins can manage branch assignments" ON public.user_branch_assignments;

CREATE POLICY "Admins can manage branch assignments"
ON public.user_branch_assignments
FOR ALL
USING (auth.uid() IS NOT NULL AND public.is_admin(auth.uid()));

-- 7. Branches - update to ensure auth check
DROP POLICY IF EXISTS "Authenticated users can view branches" ON public.branches;

CREATE POLICY "Authenticated users can view branches"
ON public.branches
FOR SELECT
USING (auth.uid() IS NOT NULL);

-- 8. Order logs - update to ensure auth check
DROP POLICY IF EXISTS "Users can view logs based on order access" ON public.order_logs;

CREATE POLICY "Authenticated users can view logs based on order access"
ON public.order_logs
FOR SELECT
USING (
  auth.uid() IS NOT NULL 
  AND (
    public.is_admin(auth.uid()) 
    OR public.has_role(auth.uid(), 'call_center') 
    OR public.has_role(auth.uid(), 'kitchen') 
    OR (public.has_role(auth.uid(), 'branch') AND EXISTS (
      SELECT 1 FROM public.orders 
      WHERE orders.id = order_logs.order_id 
      AND orders.branch_id = public.get_user_branch_id(auth.uid())
    ))
  )
);

-- Update insert policy too
DROP POLICY IF EXISTS "Authorized roles can create logs via system" ON public.order_logs;

CREATE POLICY "Authorized roles can create logs"
ON public.order_logs
FOR INSERT
WITH CHECK (
  auth.uid() IS NOT NULL 
  AND (
    public.is_admin(auth.uid()) 
    OR public.has_role(auth.uid(), 'call_center') 
    OR public.has_role(auth.uid(), 'kitchen') 
    OR public.has_role(auth.uid(), 'branch')
  )
);

-- 9. Products - update to ensure auth check
DROP POLICY IF EXISTS "Authenticated users can view products" ON public.products;

CREATE POLICY "Authenticated users can view products"
ON public.products
FOR SELECT
USING (auth.uid() IS NOT NULL);