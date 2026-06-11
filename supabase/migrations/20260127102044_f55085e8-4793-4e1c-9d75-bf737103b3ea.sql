
-- =====================================================
-- ADDITIONAL SECURITY HARDENING: Explicit auth checks
-- =====================================================

-- These updates ensure explicit authentication checks in all policies
-- Even though policies are already TO authenticated, we add explicit auth.uid() checks

-- 1. Update branches policy to explicitly require auth.uid()
DROP POLICY IF EXISTS "Authenticated users can view branches" ON public.branches;
CREATE POLICY "Authenticated users can view branches"
ON public.branches
FOR SELECT
TO authenticated
USING (auth.uid() IS NOT NULL);

-- 2. Update products policy to explicitly require auth.uid()
DROP POLICY IF EXISTS "Authenticated users can view products" ON public.products;
CREATE POLICY "Authenticated users can view products"
ON public.products
FOR SELECT
TO authenticated
USING (auth.uid() IS NOT NULL);

-- 3. Update profiles policies with explicit auth checks
DROP POLICY IF EXISTS "Users can view their own profile" ON public.profiles;
CREATE POLICY "Users can view their own profile"
ON public.profiles
FOR SELECT
TO authenticated
USING (auth.uid() IS NOT NULL AND id = auth.uid());

DROP POLICY IF EXISTS "Admins can view all profiles" ON public.profiles;
CREATE POLICY "Admins can view all profiles"
ON public.profiles
FOR SELECT
TO authenticated
USING (auth.uid() IS NOT NULL AND public.is_admin(auth.uid()));

-- 4. Ensure customers policy has explicit auth check
DROP POLICY IF EXISTS "Only admin and call center can view customers" ON public.customers;
CREATE POLICY "Only admin and call center can view customers"
ON public.customers
FOR SELECT
TO authenticated
USING (auth.uid() IS NOT NULL AND (public.is_admin(auth.uid()) OR public.has_role(auth.uid(), 'call_center')));

-- 5. Update orders policy with explicit auth check
DROP POLICY IF EXISTS "Users can view orders based on role" ON public.orders;
CREATE POLICY "Users can view orders based on role"
ON public.orders
FOR SELECT
TO authenticated
USING (
  auth.uid() IS NOT NULL AND (
    public.is_admin(auth.uid()) 
    OR public.has_role(auth.uid(), 'call_center') 
    OR public.has_role(auth.uid(), 'kitchen') 
    OR (public.has_role(auth.uid(), 'branch') AND branch_id = public.get_user_branch_id(auth.uid()))
  )
);

-- 6. Update order_items policy with explicit auth check
DROP POLICY IF EXISTS "Authorized roles can view order items" ON public.order_items;
CREATE POLICY "Authorized roles can view order items"
ON public.order_items
FOR SELECT
TO authenticated
USING (
  auth.uid() IS NOT NULL AND (
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

-- 7. Update order_logs policy with explicit auth check
DROP POLICY IF EXISTS "Users can view logs based on order access" ON public.order_logs;
CREATE POLICY "Users can view logs based on order access"
ON public.order_logs
FOR SELECT
TO authenticated
USING (
  auth.uid() IS NOT NULL AND (
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

-- 8. Update user_roles policy with explicit auth check
DROP POLICY IF EXISTS "Users can only view their own roles" ON public.user_roles;
CREATE POLICY "Users can only view their own roles"
ON public.user_roles
FOR SELECT
TO authenticated
USING (auth.uid() IS NOT NULL AND user_id = auth.uid());

-- 9. Update user_branch_assignments policy with explicit auth check
DROP POLICY IF EXISTS "Users can view their own branch assignment" ON public.user_branch_assignments;
CREATE POLICY "Users can view their own branch assignment"
ON public.user_branch_assignments
FOR SELECT
TO authenticated
USING (auth.uid() IS NOT NULL AND user_id = auth.uid());
