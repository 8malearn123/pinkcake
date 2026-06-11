-- CRITICAL: Block direct access to customers table - force all access through secure RPCs
-- This prevents any role from directly querying customer phone numbers

-- Remove all existing SELECT policies on customers that could expose phone numbers
DROP POLICY IF EXISTS "Only admin can view all customers" ON public.customers;
DROP POLICY IF EXISTS "Call center can view order customers" ON public.customers;
DROP POLICY IF EXISTS "Branch can view their order customers" ON public.customers;
DROP POLICY IF EXISTS "Customers can view their own customer profile" ON public.customers;

-- Create a single restrictive SELECT policy - only customers can view their own record
-- All staff must use secure RPC functions that mask/control phone access
CREATE POLICY "Customers can only view own profile"
  ON public.customers FOR SELECT
  USING (
    auth.uid() IS NOT NULL AND 
    user_id = auth.uid()
  );

-- Admin needs direct access for management purposes only
CREATE POLICY "Admin direct customer access"
  ON public.customers FOR SELECT
  USING (
    auth.uid() IS NOT NULL AND 
    public.is_admin(auth.uid())
  );

-- Ensure update policies are also restricted
DROP POLICY IF EXISTS "Customers can update their own customer profile" ON public.customers;
DROP POLICY IF EXISTS "Admins can update customers" ON public.customers;

CREATE POLICY "Customers can update own profile"
  ON public.customers FOR UPDATE
  USING (user_id = auth.uid());

CREATE POLICY "Admin can update any customer"
  ON public.customers FOR UPDATE
  USING (public.is_admin(auth.uid()));

-- Update get_orders_for_realtime to NOT expose customer phone (used by live dashboard)
DROP FUNCTION IF EXISTS public.get_orders_for_realtime();

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
    c.name as customer_name  -- Only name, never phone
  FROM public.orders o
  LEFT JOIN public.branches b ON o.branch_id = b.id
  LEFT JOIN public.customers c ON o.customer_id = c.id
  WHERE public.is_admin(auth.uid()) 
    OR public.has_role(auth.uid(), 'call_center')
    OR public.has_role(auth.uid(), 'kitchen')
  ORDER BY o.created_at DESC
$$;

-- Update get_kitchen_orders_secure to never include customer data
DROP FUNCTION IF EXISTS public.get_kitchen_orders_secure();

CREATE OR REPLACE FUNCTION public.get_kitchen_orders_secure()
RETURNS TABLE(
  id uuid,
  order_number text,
  status order_status,
  branch_id uuid,
  branch_name text,
  delivery_date date,
  delivery_time time without time zone,
  notes text,
  created_at timestamp with time zone,
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
    AND public.has_role(auth.uid(), 'kitchen')
  ORDER BY o.created_at DESC
$$;

-- Update get_orders_for_kitchen to never include customer data
DROP FUNCTION IF EXISTS public.get_orders_for_kitchen();

CREATE OR REPLACE FUNCTION public.get_orders_for_kitchen()
RETURNS TABLE(
  id uuid,
  order_number text,
  status order_status,
  branch_id uuid,
  branch_name text,
  delivery_date date,
  delivery_time time without time zone,
  total_amount numeric,
  notes text,
  created_at timestamp with time zone,
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
    AND public.has_role(auth.uid(), 'kitchen')
  ORDER BY o.created_at DESC
$$;

-- Update get_order_for_kitchen to never include customer phone
DROP FUNCTION IF EXISTS public.get_order_for_kitchen(uuid);

CREATE OR REPLACE FUNCTION public.get_order_for_kitchen(_order_id uuid)
RETURNS TABLE(
  id uuid,
  order_number text,
  status order_status,
  branch_name text,
  delivery_date date,
  delivery_time time without time zone,
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
    AND public.has_role(auth.uid(), 'kitchen')
$$;