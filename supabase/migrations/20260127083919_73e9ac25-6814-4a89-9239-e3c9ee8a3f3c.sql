-- Fix 1: Restrict order_logs SELECT to match order access (instead of all authenticated users)
DROP POLICY IF EXISTS "Authenticated users can view order logs" ON public.order_logs;

CREATE POLICY "Users can view logs based on order access"
  ON public.order_logs FOR SELECT
  TO authenticated USING (
    public.is_admin(auth.uid()) OR
    public.has_role(auth.uid(), 'call_center'::app_role) OR
    public.has_role(auth.uid(), 'kitchen'::app_role) OR
    (public.has_role(auth.uid(), 'branch'::app_role) AND EXISTS (
      SELECT 1 FROM public.orders
      WHERE orders.id = order_logs.order_id
      AND orders.branch_id = public.get_user_branch_id(auth.uid())
    ))
  );

-- Fix 2: Restrict customers SELECT to authorized roles only (not all authenticated users)
DROP POLICY IF EXISTS "Authenticated users can view customers" ON public.customers;

CREATE POLICY "Authorized roles can view customers"
  ON public.customers FOR SELECT
  TO authenticated USING (
    public.is_admin(auth.uid()) OR
    public.has_role(auth.uid(), 'call_center'::app_role) OR
    (public.has_role(auth.uid(), 'branch'::app_role) AND EXISTS (
      SELECT 1 FROM public.orders
      WHERE orders.customer_id = customers.id
      AND orders.branch_id = public.get_user_branch_id(auth.uid())
    ))
  );

-- Fix 3: Restrict profiles SELECT to authorized roles (employees shouldn't be visible to everyone)
DROP POLICY IF EXISTS "Users can view all profiles" ON public.profiles;

CREATE POLICY "Users can view profiles based on role"
  ON public.profiles FOR SELECT
  TO authenticated USING (
    id = auth.uid() OR  -- Users can always see their own profile
    public.is_admin(auth.uid()) OR
    public.has_role(auth.uid(), 'call_center'::app_role) OR
    public.has_role(auth.uid(), 'kitchen'::app_role) OR
    public.has_role(auth.uid(), 'branch'::app_role)
  );

-- Fix 4: Allow public tracking by tracking_code only (create a security definer function)
CREATE OR REPLACE FUNCTION public.get_order_by_tracking_code(_tracking_code text)
RETURNS TABLE (
  order_number text,
  status public.order_status,
  branch_name text,
  delivery_date date,
  delivery_time time,
  total_amount numeric,
  items jsonb
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT 
    o.order_number,
    o.status,
    b.name as branch_name,
    o.delivery_date,
    o.delivery_time,
    o.total_amount,
    (
      SELECT jsonb_agg(jsonb_build_object(
        'product_name', oi.product_name,
        'quantity', oi.quantity,
        'unit_price', oi.unit_price,
        'total_price', oi.total_price
      ))
      FROM public.order_items oi
      WHERE oi.order_id = o.id
    ) as items
  FROM public.orders o
  LEFT JOIN public.branches b ON o.branch_id = b.id
  WHERE o.tracking_code = _tracking_code
  LIMIT 1
$$;