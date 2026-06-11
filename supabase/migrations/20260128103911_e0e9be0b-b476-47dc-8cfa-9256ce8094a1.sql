-- Drop and recreate get_orders_for_admin without phone column
DROP FUNCTION IF EXISTS public.get_orders_for_admin();

CREATE FUNCTION public.get_orders_for_admin()
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
  customer_name text,
  customer_address text
)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
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
    o.payment_link,
    o.tracking_code,
    o.created_at,
    o.updated_at,
    o.branch_id,
    b.name as branch_name,
    b.address as branch_address,
    o.customer_id,
    c.name as customer_name,
    -- Address visible only to Call Center (operational need), Admin must click to reveal
    CASE 
      WHEN public.has_role(auth.uid(), 'call_center') THEN c.address 
      ELSE NULL
    END as customer_address
  FROM public.orders o
  LEFT JOIN public.branches b ON o.branch_id = b.id
  LEFT JOIN public.customers c ON o.customer_id = c.id
  WHERE public.is_admin(auth.uid()) OR public.has_role(auth.uid(), 'call_center')
  ORDER BY o.created_at DESC;
END;
$$;

-- Update get_order_details_secure to NOT auto-load phone for admin
CREATE OR REPLACE FUNCTION public.get_order_details_secure(_order_id uuid)
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
  customer_name text,
  customer_phone text,
  customer_address text,
  items jsonb
)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _is_admin boolean;
  _is_call_center boolean;
  _is_kitchen boolean;
  _is_branch boolean;
  _user_branch_id uuid;
  _order_branch_id uuid;
BEGIN
  _is_admin := public.is_admin(auth.uid());
  _is_call_center := public.has_role(auth.uid(), 'call_center');
  _is_kitchen := public.has_role(auth.uid(), 'kitchen');
  _is_branch := public.has_role(auth.uid(), 'branch');
  _user_branch_id := public.get_user_branch_id(auth.uid());
  
  SELECT o.branch_id INTO _order_branch_id FROM public.orders o WHERE o.id = _order_id;

  RETURN QUERY
  SELECT 
    o.id,
    o.order_number,
    o.status,
    o.total_amount,
    o.delivery_date,
    o.delivery_time,
    o.notes,
    CASE WHEN _is_admin OR _is_call_center THEN o.payment_status ELSE NULL END,
    CASE WHEN _is_admin OR _is_call_center THEN o.payment_link ELSE NULL END,
    o.tracking_code,
    o.created_at,
    o.updated_at,
    o.branch_id,
    b.name,
    b.address,
    o.customer_id,
    c.name,
    -- Phone: Call Center gets it (operational), Branch gets it for their orders, Admin must use audited function
    CASE 
      WHEN _is_call_center THEN c.phone
      WHEN _is_branch AND _order_branch_id = _user_branch_id THEN c.phone
      ELSE NULL  -- Admin must use get_customer_phone_audited()
    END,
    -- Address: Call Center and Branch (for delivery), Admin must click to reveal
    CASE 
      WHEN _is_call_center THEN c.address
      WHEN _is_branch AND _order_branch_id = _user_branch_id THEN c.address
      ELSE NULL
    END,
    (
      SELECT jsonb_agg(jsonb_build_object(
        'id', oi.id,
        'product_name', oi.product_name,
        'quantity', oi.quantity,
        'unit_price', oi.unit_price,
        'total_price', oi.total_price,
        'notes', oi.notes
      ))
      FROM public.order_items oi
      WHERE oi.order_id = o.id
    )
  FROM public.orders o
  LEFT JOIN public.branches b ON o.branch_id = b.id
  LEFT JOIN public.customers c ON o.customer_id = c.id
  WHERE o.id = _order_id
    AND (
      _is_admin 
      OR _is_call_center 
      OR _is_kitchen
      OR (_is_branch AND _order_branch_id = _user_branch_id)
    );
END;
$$;