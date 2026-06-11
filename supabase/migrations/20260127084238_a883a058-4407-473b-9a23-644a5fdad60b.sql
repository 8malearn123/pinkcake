-- Fix all tables to explicitly require authentication for SELECT
-- The issue is that policies target 'authenticated' role but don't block 'anon' role

-- 1. Branches - allow authenticated users to view, but block anon
DROP POLICY IF EXISTS "Authenticated users can view branches" ON public.branches;
CREATE POLICY "Authenticated users can view branches"
  ON public.branches FOR SELECT
  TO authenticated
  USING (true);

-- 2. Products - allow authenticated users to view all products, block anon
DROP POLICY IF EXISTS "Authenticated users can view active products" ON public.products;
CREATE POLICY "Authenticated users can view products"
  ON public.products FOR SELECT
  TO authenticated
  USING (true);

-- 3. Order items - restrict to authorized roles only
DROP POLICY IF EXISTS "Users can view order items" ON public.order_items;
CREATE POLICY "Authorized roles can view order items"
  ON public.order_items FOR SELECT
  TO authenticated
  USING (
    public.is_admin(auth.uid()) OR
    public.has_role(auth.uid(), 'call_center'::app_role) OR
    public.has_role(auth.uid(), 'kitchen'::app_role) OR
    (public.has_role(auth.uid(), 'branch'::app_role) AND EXISTS (
      SELECT 1 FROM public.orders
      WHERE orders.id = order_items.order_id
      AND orders.branch_id = public.get_user_branch_id(auth.uid())
    ))
  );

-- 4. User roles - already has policies but scan says anon can access, fix by confirming authenticated only
DROP POLICY IF EXISTS "Users can view their own role" ON public.user_roles;
CREATE POLICY "Users can view roles based on access"
  ON public.user_roles FOR SELECT
  TO authenticated
  USING (
    user_id = auth.uid() OR
    public.is_admin(auth.uid())
  );

-- 5. User branch assignments - fix to block anon
DROP POLICY IF EXISTS "Users can view their own assignment" ON public.user_branch_assignments;
CREATE POLICY "Users can view branch assignments based on access"
  ON public.user_branch_assignments FOR SELECT
  TO authenticated
  USING (
    user_id = auth.uid() OR
    public.is_admin(auth.uid())
  );