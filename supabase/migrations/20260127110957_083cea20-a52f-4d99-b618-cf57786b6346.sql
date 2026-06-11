-- =====================================================
-- SECURITY FIX: Protect sensitive data (phones, payment links, customer info)
-- =====================================================

-- 1. Create helper function to check if user can access customer data for an order
CREATE OR REPLACE FUNCTION public.can_access_order_customer(_user_id uuid, _order_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.orders o
    WHERE o.id = _order_id
      AND (
        public.is_admin(_user_id)
        OR public.has_role(_user_id, 'call_center')
        OR (public.has_role(_user_id, 'branch') AND o.branch_id = public.get_user_branch_id(_user_id))
      )
  )
$$;

-- 2. Create secure function to get orders for admin/call_center with full details
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
  customer_name text,
  customer_phone text,
  customer_address text
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
    c.phone as customer_phone,
    c.address as customer_address
  FROM public.orders o
  LEFT JOIN public.branches b ON o.branch_id = b.id
  LEFT JOIN public.customers c ON o.customer_id = c.id
  WHERE public.is_admin(auth.uid()) OR public.has_role(auth.uid(), 'call_center')
  ORDER BY o.created_at DESC
$$;

-- 3. Create secure function to get single order details based on role
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
BEGIN
  _is_admin := public.is_admin(auth.uid());
  _is_call_center := public.has_role(auth.uid(), 'call_center');
  _is_kitchen := public.has_role(auth.uid(), 'kitchen');
  _is_branch := public.has_role(auth.uid(), 'branch');
  _user_branch_id := public.get_user_branch_id(auth.uid());

  RETURN QUERY
  SELECT 
    o.id,
    o.order_number,
    o.status,
    o.total_amount,
    o.delivery_date,
    o.delivery_time,
    o.notes,
    -- Only show payment_status/payment_link to admin and call_center
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
    -- Only show customer phone/address to admin, call_center, or branch staff assigned to this order
    CASE WHEN _is_admin OR _is_call_center OR (_is_branch AND o.branch_id = _user_branch_id) THEN c.phone ELSE NULL END,
    CASE WHEN _is_admin OR _is_call_center OR (_is_branch AND o.branch_id = _user_branch_id) THEN c.address ELSE NULL END,
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
      OR (_is_branch AND o.branch_id = _user_branch_id)
    );
END;
$$;

-- 4. Update profiles RLS policies - make more restrictive
-- Drop existing policies first
DROP POLICY IF EXISTS "Users can view their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Admins can view all profiles" ON public.profiles;

-- Create new, more restrictive policies
CREATE POLICY "Users can view own profile only"
ON public.profiles
FOR SELECT
USING (id = auth.uid());

CREATE POLICY "Admins and call_center can view all profiles"
ON public.profiles
FOR SELECT
USING (
  auth.uid() IS NOT NULL 
  AND (public.is_admin(auth.uid()) OR public.has_role(auth.uid(), 'call_center'))
);

-- 5. Update customers RLS - ensure branch staff can only access via secure functions
DROP POLICY IF EXISTS "Only admin and call center can view customers" ON public.customers;

-- More restrictive: Only admin and call_center can directly query customers
-- Branch staff must use secure functions
CREATE POLICY "Admin and call center can view customers"
ON public.customers
FOR SELECT
USING (
  auth.uid() IS NOT NULL 
  AND (public.is_admin(auth.uid()) OR public.has_role(auth.uid(), 'call_center'))
);

-- 6. Create secure function for realtime orders (admin dashboard) that hides sensitive data for non-admin
CREATE OR REPLACE FUNCTION public.get_orders_for_realtime()
RETURNS TABLE(
  id uuid,
  order_number text,
  status order_status,
  total_amount numeric,
  delivery_date date,
  delivery_time time without time zone,
  created_at timestamp with time zone,
  branch_id uuid,
  branch_name text,
  customer_name text
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
    o.total_amount,
    o.delivery_date,
    o.delivery_time,
    o.created_at,
    o.branch_id,
    b.name as branch_name,
    c.name as customer_name
  FROM public.orders o
  LEFT JOIN public.branches b ON o.branch_id = b.id
  LEFT JOIN public.customers c ON o.customer_id = c.id
  WHERE public.is_admin(auth.uid()) 
    OR public.has_role(auth.uid(), 'call_center')
    OR public.has_role(auth.uid(), 'kitchen')
  ORDER BY o.created_at DESC
$$;

-- 7. Update get_orders_for_branch to ensure it doesn't expose customer phone
CREATE OR REPLACE FUNCTION public.get_orders_for_branch(_user_id uuid)
RETURNS TABLE(
  id uuid,
  order_number text,
  status order_status,
  customer_name text,
  delivery_date date,
  delivery_time time without time zone,
  total_amount numeric,
  notes text,
  created_at timestamp with time zone,
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
    c.name as customer_name,  -- Only name, no phone
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

-- 8. Update get_branch_orders_secure similarly
CREATE OR REPLACE FUNCTION public.get_branch_orders_secure(_user_id uuid)
RETURNS TABLE(
  id uuid,
  order_number text,
  status order_status,
  customer_name text,
  delivery_date date,
  delivery_time time without time zone,
  notes text,
  created_at timestamp with time zone,
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
    c.name as customer_name,  -- Only name, no phone or address
    o.delivery_date,
    o.delivery_time,
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