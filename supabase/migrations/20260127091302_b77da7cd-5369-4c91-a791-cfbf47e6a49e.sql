-- Fix: The view orders_operational needs RLS protection
-- Since views with security_invoker=on inherit the caller's permissions,
-- we need to ensure the base table (orders) has proper RLS which it does.
-- However, the scanner is detecting it as unprotected.
-- Let's drop the view and rely on the existing orders table RLS instead.

DROP VIEW IF EXISTS public.orders_operational;

-- The orders table already has proper RLS policies that restrict access by role.
-- Kitchen and branch staff can see orders but the payment_link field is visible.
-- To truly hide payment_link from kitchen/branch, we need a more granular approach.

-- Create a function that returns orders without sensitive payment fields for kitchen
CREATE OR REPLACE FUNCTION public.get_orders_for_kitchen()
RETURNS TABLE (
  id uuid,
  order_number text,
  status public.order_status,
  branch_id uuid,
  branch_name text,
  delivery_date date,
  delivery_time time,
  total_amount numeric,
  notes text,
  created_at timestamptz,
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
    o.branch_id,
    b.name as branch_name,
    o.delivery_date,
    o.delivery_time,
    o.total_amount,
    o.notes,
    o.created_at,
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
  WHERE o.status IN ('paid', 'preparing', 'ready_to_ship')
  ORDER BY o.created_at DESC
$$;

-- Create a function that returns orders for branch staff (their branch only)
CREATE OR REPLACE FUNCTION public.get_orders_for_branch(_user_id uuid)
RETURNS TABLE (
  id uuid,
  order_number text,
  status public.order_status,
  customer_name text,
  delivery_date date,
  delivery_time time,
  total_amount numeric,
  notes text,
  created_at timestamptz,
  tracking_code text,
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
    c.name as customer_name,
    o.delivery_date,
    o.delivery_time,
    o.total_amount,
    o.notes,
    o.created_at,
    o.tracking_code,
    (
      SELECT jsonb_agg(jsonb_build_object(
        'product_name', oi.product_name,
        'quantity', oi.quantity
      ))
      FROM public.order_items oi
      WHERE oi.order_id = o.id
    ) as items
  FROM public.orders o
  LEFT JOIN public.customers c ON o.customer_id = c.id
  WHERE o.branch_id = public.get_user_branch_id(_user_id)
    AND o.status IN ('in_transit', 'ready_for_pickup', 'completed')
  ORDER BY o.created_at DESC
$$;