-- Drop the existing function first, then recreate without customer_address
DROP FUNCTION IF EXISTS public.get_orders_for_admin();

-- Recreate get_orders_for_admin WITHOUT customer_address
-- Sensitive data (phone, address) should ONLY be accessed via audited reveal functions
CREATE OR REPLACE FUNCTION public.get_orders_for_admin()
RETURNS TABLE(
  id uuid, 
  order_number text, 
  status order_status, 
  total_amount numeric, 
  delivery_date date, 
  delivery_time time without time zone, 
  notes text, 
  payment_status text, 
  payment_link text, 
  tracking_code text, 
  created_at timestamp with time zone, 
  updated_at timestamp with time zone, 
  branch_id uuid, 
  branch_name text, 
  branch_address text, 
  customer_id uuid, 
  customer_name text
)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _is_admin boolean;
  _is_call_center boolean;
BEGIN
  _is_admin := public.is_admin(auth.uid());
  _is_call_center := public.has_role(auth.uid(), 'call_center');
  
  -- Only admin and call_center can use this function
  IF NOT (_is_admin OR _is_call_center) THEN
    RETURN;
  END IF;
  
  RETURN QUERY
  SELECT 
    o.id,
    o.order_number,
    o.status,
    o.total_amount,
    o.delivery_date,
    o.delivery_time,
    o.notes,
    o.payment_status,
    CASE WHEN _is_admin OR _is_call_center THEN o.payment_link ELSE NULL END,
    o.tracking_code,
    o.created_at,
    o.updated_at,
    o.branch_id,
    b.name,
    b.address,
    o.customer_id,
    c.name
  FROM public.orders o
  LEFT JOIN public.branches b ON o.branch_id = b.id
  LEFT JOIN public.customers c ON o.customer_id = c.id
  ORDER BY o.created_at DESC;
END;
$$;