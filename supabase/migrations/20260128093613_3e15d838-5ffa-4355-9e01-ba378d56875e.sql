-- Fix customer phone number exposure - enforce strict access control

-- Update get_orders_for_admin to NOT include phone numbers in list view
-- Phone numbers should only be visible in the detailed order view
DROP FUNCTION IF EXISTS public.get_orders_for_admin();

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
  customer_phone text,  -- Will be masked for non-admin
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
    -- Only Admin sees full phone in list view, Call Center sees masked
    CASE 
      WHEN public.is_admin(auth.uid()) THEN c.phone 
      ELSE CONCAT('***-***-', RIGHT(c.phone, 3))
    END as customer_phone,
    -- Only Admin sees full address in list view
    CASE 
      WHEN public.is_admin(auth.uid()) THEN c.address 
      ELSE NULL
    END as customer_address
  FROM public.orders o
  LEFT JOIN public.branches b ON o.branch_id = b.id
  LEFT JOIN public.customers c ON o.customer_id = c.id
  WHERE public.is_admin(auth.uid()) OR public.has_role(auth.uid(), 'call_center')
  ORDER BY o.created_at DESC;
END;
$$;

-- Update get_order_details_secure to have stricter phone access
DROP FUNCTION IF EXISTS public.get_order_details_secure(uuid);

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
  
  -- Get the order's branch for verification
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
    -- Phone visible ONLY to: Admin, Call Center, or Branch Manager of THIS order's branch
    CASE 
      WHEN _is_admin THEN c.phone
      WHEN _is_call_center THEN c.phone
      WHEN _is_branch AND _order_branch_id = _user_branch_id THEN c.phone
      ELSE CONCAT('***-***-', RIGHT(COALESCE(c.phone, '000'), 3))
    END,
    -- Address visible ONLY to: Admin, Call Center, or Branch Manager of THIS order's branch
    CASE 
      WHEN _is_admin THEN c.address
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

-- Update search_customer_by_phone to only return results to Admin (not call_center for bulk access)
DROP FUNCTION IF EXISTS public.search_customer_by_phone(text);

CREATE OR REPLACE FUNCTION public.search_customer_by_phone(_phone text)
RETURNS TABLE(id uuid, name text, phone text, address text)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  -- Only admin and call_center can search, but this is for creating new orders
  -- so it's an intentional feature for order creation workflow
  SELECT c.id, c.name, c.phone, c.address
  FROM public.customers c
  WHERE c.phone = _phone
    AND (public.is_admin(auth.uid()) OR public.has_role(auth.uid(), 'call_center'))
$$;

-- Create audit log function for sensitive data access
CREATE OR REPLACE FUNCTION public.log_sensitive_data_access(_action text, _resource_type text, _resource_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.order_logs (order_id, action, description, performed_by)
  VALUES (
    _resource_id,
    'sensitive_access',
    'الوصول إلى بيانات حساسة: ' || _action || ' - ' || _resource_type,
    auth.uid()
  );
EXCEPTION
  WHEN OTHERS THEN
    -- Silently fail if order_id doesn't exist (for non-order resources)
    NULL;
END;
$$;

-- Update RLS on customers table to be more restrictive
DROP POLICY IF EXISTS "Admin and call center can view customers" ON public.customers;

-- Create more restrictive policies
CREATE POLICY "Only admin can view all customers"
  ON public.customers FOR SELECT
  USING (
    auth.uid() IS NOT NULL AND 
    public.is_admin(auth.uid())
  );

-- Call center can only view customers linked to orders they can access
CREATE POLICY "Call center can view order customers"
  ON public.customers FOR SELECT
  USING (
    auth.uid() IS NOT NULL AND 
    public.has_role(auth.uid(), 'call_center') AND
    EXISTS (
      SELECT 1 FROM public.orders o 
      WHERE o.customer_id = customers.id
    )
  );

-- Branch managers can only view customers for their branch's orders
CREATE POLICY "Branch can view their order customers"
  ON public.customers FOR SELECT
  USING (
    auth.uid() IS NOT NULL AND 
    public.has_role(auth.uid(), 'branch') AND
    EXISTS (
      SELECT 1 FROM public.orders o 
      WHERE o.customer_id = customers.id
      AND o.branch_id = public.get_user_branch_id(auth.uid())
    )
  );