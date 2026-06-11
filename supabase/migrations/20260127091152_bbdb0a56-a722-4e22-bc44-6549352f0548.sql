-- 1. Tighten customers access - Kitchen doesn't need customer contact info, only order details
-- Branch staff only need customer name for pickup verification, not phone
DROP POLICY IF EXISTS "Users can view customers based on order access" ON public.customers;

CREATE POLICY "Only admin and call center can view customers"
  ON public.customers FOR SELECT
  TO authenticated
  USING (
    public.is_admin(auth.uid()) OR
    public.has_role(auth.uid(), 'call_center'::app_role)
  );

-- 2. Create a secure view for order tracking that hides sensitive fields
-- This view will be used by branch/kitchen staff instead of direct table access
CREATE OR REPLACE VIEW public.orders_operational
WITH (security_invoker = on)
AS SELECT 
  o.id,
  o.order_number,
  o.status,
  o.branch_id,
  o.delivery_date,
  o.delivery_time,
  o.total_amount,
  o.notes,
  o.created_at,
  o.updated_at,
  -- Hide payment_link from this view - only admin/call_center see it
  NULL::text as payment_link_masked,
  o.tracking_code
FROM public.orders o;

-- 3. Create a function to get customer name only (not phone) for branch staff
CREATE OR REPLACE FUNCTION public.get_customer_name_for_order(_order_id uuid)
RETURNS text
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT c.name
  FROM public.customers c
  JOIN public.orders o ON o.customer_id = c.id
  WHERE o.id = _order_id
  LIMIT 1
$$;

-- 4. Create a secure function to get order summary for kitchen (no customer contact info)
CREATE OR REPLACE FUNCTION public.get_order_for_kitchen(_order_id uuid)
RETURNS TABLE (
  id uuid,
  order_number text,
  status public.order_status,
  branch_name text,
  delivery_date date,
  delivery_time time,
  total_amount numeric,
  notes text,
  items jsonb
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT 
    o.id,
    o.order_number,
    o.status,
    b.name as branch_name,
    o.delivery_date,
    o.delivery_time,
    o.total_amount,
    o.notes,
    (
      SELECT jsonb_agg(jsonb_build_object(
        'product_name', oi.product_name,
        'quantity', oi.quantity,
        'notes', oi.notes
      ))
      FROM public.order_items oi
      WHERE oi.order_id = o.id
    ) as items
  FROM public.orders o
  LEFT JOIN public.branches b ON o.branch_id = b.id
  WHERE o.id = _order_id
    AND o.status IN ('paid', 'preparing', 'ready_to_ship', 'in_transit', 'ready_for_pickup')
$$;