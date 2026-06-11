-- Fix 1: Restrict profiles SELECT - users can only see their own profile, admins see all
DROP POLICY IF EXISTS "Users can view profiles based on role" ON public.profiles;
CREATE POLICY "Users can view their own profile or admin sees all"
  ON public.profiles FOR SELECT
  TO authenticated
  USING (
    id = auth.uid() OR
    public.is_admin(auth.uid())
  );

-- Fix 2: Restrict order_logs INSERT - only allow through triggers (service role) not direct inserts
DROP POLICY IF EXISTS "System creates order logs" ON public.order_logs;
CREATE POLICY "Only system can create order logs"
  ON public.order_logs FOR INSERT
  TO authenticated
  WITH CHECK (false);  -- Block all direct inserts, triggers use SECURITY DEFINER

-- Fix 3: Tighten customers policy - only show customers for orders the user is directly involved with
DROP POLICY IF EXISTS "Authorized roles can view customers" ON public.customers;
CREATE POLICY "Users can view customers based on order access"
  ON public.customers FOR SELECT
  TO authenticated
  USING (
    public.is_admin(auth.uid()) OR
    public.has_role(auth.uid(), 'call_center'::app_role) OR
    (public.has_role(auth.uid(), 'kitchen'::app_role) AND EXISTS (
      SELECT 1 FROM public.orders
      WHERE orders.customer_id = customers.id
      AND orders.status IN ('paid', 'preparing', 'ready_to_ship')
    )) OR
    (public.has_role(auth.uid(), 'branch'::app_role) AND EXISTS (
      SELECT 1 FROM public.orders
      WHERE orders.customer_id = customers.id
      AND orders.branch_id = public.get_user_branch_id(auth.uid())
      AND orders.status IN ('in_transit', 'ready_for_pickup')
    ))
  );