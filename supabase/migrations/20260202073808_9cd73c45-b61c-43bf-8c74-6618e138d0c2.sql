-- =====================================================
-- FIX: Customer Data Exposure Security Vulnerability
-- =====================================================

-- Step 1: Drop the conflicting/overly permissive policies on customers table
DROP POLICY IF EXISTS "Deny anonymous access to customers" ON public.customers;
DROP POLICY IF EXISTS "Deny anonymous delete to customers" ON public.customers;
DROP POLICY IF EXISTS "Deny anonymous insert to customers" ON public.customers;
DROP POLICY IF EXISTS "Deny anonymous update to customers" ON public.customers;

-- Step 2: Consolidate into a single restrictive base policy that blocks all direct access
-- This forces all access through secure RPC functions
CREATE POLICY "Block all direct customer table access"
ON public.customers AS RESTRICTIVE
FOR ALL
USING (
  -- Only allow access through secure functions or for the user's own record
  is_admin(auth.uid()) 
  OR has_role(auth.uid(), 'call_center'::app_role)
  OR (user_id IS NOT NULL AND user_id = auth.uid())
);

-- Step 3: Create masked phone function for non-privileged roles
CREATE OR REPLACE FUNCTION public.mask_phone(phone_number text)
RETURNS text
LANGUAGE plpgsql
IMMUTABLE
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF phone_number IS NULL OR length(phone_number) < 4 THEN
    RETURN '***';
  END IF;
  -- Show first 2 and last 2 characters, mask the rest
  RETURN substring(phone_number, 1, 2) || repeat('*', length(phone_number) - 4) || substring(phone_number, length(phone_number) - 1, 2);
END;
$$;

-- Step 4: Create masked address function
CREATE OR REPLACE FUNCTION public.mask_address(addr text)
RETURNS text
LANGUAGE plpgsql
IMMUTABLE
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF addr IS NULL OR length(addr) < 5 THEN
    RETURN '***';
  END IF;
  -- Show only first few characters
  RETURN substring(addr, 1, 5) || '...';
END;
$$;

-- Step 5: Create secure customer view function with role-based masking
CREATE OR REPLACE FUNCTION public.get_customer_safe_view(_customer_id uuid)
RETURNS TABLE (
  id uuid,
  name text,
  phone text,
  address text,
  created_at timestamptz
)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _is_privileged boolean;
  _is_own_record boolean;
BEGIN
  -- Check if user is admin or call_center (privileged roles)
  _is_privileged := is_admin(auth.uid()) OR has_role(auth.uid(), 'call_center'::app_role);
  
  -- Check if this is the customer's own record
  _is_own_record := EXISTS (
    SELECT 1 FROM public.customers c
    WHERE c.id = _customer_id 
    AND c.user_id IS NOT NULL 
    AND c.user_id = auth.uid()
  );
  
  -- If not privileged and not own record, deny access
  IF NOT _is_privileged AND NOT _is_own_record THEN
    RETURN;
  END IF;
  
  -- Log the access
  PERFORM log_admin_action_safe(
    auth.uid(),
    'VIEW_CUSTOMER',
    'customer',
    _customer_id,
    'Viewed customer data'
  );
  
  -- Return data with appropriate masking
  RETURN QUERY
  SELECT 
    c.id,
    c.name,
    CASE 
      WHEN _is_privileged OR _is_own_record THEN c.phone
      ELSE mask_phone(c.phone)
    END as phone,
    CASE 
      WHEN _is_privileged OR _is_own_record THEN c.address
      ELSE mask_address(c.address)
    END as address,
    c.created_at
  FROM public.customers c
  WHERE c.id = _customer_id;
END;
$$;

-- Step 6: Create secure order customer info function with masking
CREATE OR REPLACE FUNCTION public.get_order_customer_info(_order_id uuid)
RETURNS TABLE (
  customer_id uuid,
  customer_name text,
  customer_phone text,
  customer_address text
)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _is_privileged boolean;
  _cust_id uuid;
BEGIN
  -- Get the customer_id for this order
  SELECT o.customer_id INTO _cust_id
  FROM public.orders o
  WHERE o.id = _order_id;
  
  IF _cust_id IS NULL THEN
    RETURN;
  END IF;
  
  -- Check role-based access
  _is_privileged := is_admin(auth.uid()) OR has_role(auth.uid(), 'call_center'::app_role);
  
  -- Verify the user has order access (admin, call_center, kitchen, or assigned branch)
  IF NOT _is_privileged 
     AND NOT has_role(auth.uid(), 'kitchen'::app_role)
     AND NOT has_role(auth.uid(), 'customer_support'::app_role)
     AND NOT (has_role(auth.uid(), 'branch'::app_role) AND EXISTS (
       SELECT 1 FROM public.orders o 
       WHERE o.id = _order_id AND o.branch_id = get_user_branch_id(auth.uid())
     ))
     AND NOT (is_customer(auth.uid()) AND EXISTS (
       SELECT 1 FROM public.orders o 
       WHERE o.id = _order_id AND o.customer_id = get_my_customer_id()
     ))
  THEN
    RETURN;
  END IF;
  
  -- Log access for non-customers
  IF NOT is_customer(auth.uid()) THEN
    PERFORM log_admin_action_safe(
      auth.uid(),
      'VIEW_ORDER_CUSTOMER',
      'order',
      _order_id,
      'Viewed order customer info'
    );
  END IF;
  
  -- Return masked data for non-privileged roles
  RETURN QUERY
  SELECT 
    c.id as customer_id,
    c.name as customer_name,
    CASE 
      WHEN _is_privileged THEN c.phone
      WHEN is_customer(auth.uid()) AND c.user_id = auth.uid() THEN c.phone
      ELSE mask_phone(c.phone)
    END as customer_phone,
    CASE 
      WHEN _is_privileged THEN c.address
      WHEN is_customer(auth.uid()) AND c.user_id = auth.uid() THEN c.address
      ELSE mask_address(c.address)
    END as customer_address
  FROM public.customers c
  WHERE c.id = _cust_id;
END;
$$;

-- Step 7: Update get_order_details_secure to use masking for non-privileged roles
CREATE OR REPLACE FUNCTION public.get_order_details_secure(_order_id uuid)
RETURNS TABLE (
  id uuid,
  order_number text,
  status order_status,
  total_amount numeric,
  delivery_date date,
  delivery_time time,
  notes text,
  payment_status text,
  payment_link text,
  tracking_code text,
  created_at timestamptz,
  updated_at timestamptz,
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
  _is_privileged boolean;
  _is_own_order boolean;
BEGIN
  -- Check if user is privileged (admin or call_center)
  _is_privileged := is_admin(auth.uid()) OR has_role(auth.uid(), 'call_center'::app_role);
  
  -- Check if this is the customer's own order
  _is_own_order := is_customer(auth.uid()) AND EXISTS (
    SELECT 1 FROM public.orders o
    WHERE o.id = _order_id AND o.customer_id = get_my_customer_id()
  );
  
  -- Verify access
  IF NOT _is_privileged
     AND NOT has_role(auth.uid(), 'kitchen'::app_role)
     AND NOT has_role(auth.uid(), 'customer_support'::app_role)
     AND NOT (has_role(auth.uid(), 'branch'::app_role) AND EXISTS (
       SELECT 1 FROM public.orders o 
       WHERE o.id = _order_id AND o.branch_id = get_user_branch_id(auth.uid())
     ))
     AND NOT _is_own_order
  THEN
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
    CASE WHEN _is_privileged THEN o.payment_link ELSE NULL END as payment_link,
    o.tracking_code,
    o.created_at,
    o.updated_at,
    o.branch_id,
    b.name as branch_name,
    b.address as branch_address,
    c.id as customer_id,
    c.name as customer_name,
    CASE 
      WHEN _is_privileged OR _is_own_order THEN c.phone
      ELSE mask_phone(c.phone)
    END as customer_phone,
    CASE 
      WHEN _is_privileged OR _is_own_order THEN c.address
      ELSE mask_address(c.address)
    END as customer_address,
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
    ) as items
  FROM public.orders o
  LEFT JOIN public.branches b ON b.id = o.branch_id
  LEFT JOIN public.customers c ON c.id = o.customer_id
  WHERE o.id = _order_id;
END;
$$;

-- Step 8: Update get_orders_for_admin to mask data for non-privileged roles
CREATE OR REPLACE FUNCTION public.get_orders_for_admin()
RETURNS TABLE (
  id uuid,
  order_number text,
  status order_status,
  total_amount numeric,
  delivery_date date,
  delivery_time time,
  notes text,
  payment_status text,
  payment_link text,
  tracking_code text,
  created_at timestamptz,
  updated_at timestamptz,
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
  _is_privileged boolean;
BEGIN
  -- Check role access
  IF NOT (is_admin(auth.uid()) 
          OR has_role(auth.uid(), 'call_center'::app_role)
          OR has_role(auth.uid(), 'customer_support'::app_role)) THEN
    RETURN;
  END IF;
  
  _is_privileged := is_admin(auth.uid()) OR has_role(auth.uid(), 'call_center'::app_role);
  
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
    CASE WHEN _is_privileged THEN o.payment_link ELSE NULL END as payment_link,
    o.tracking_code,
    o.created_at,
    o.updated_at,
    o.branch_id,
    b.name as branch_name,
    b.address as branch_address,
    c.id as customer_id,
    c.name as customer_name
  FROM public.orders o
  LEFT JOIN public.branches b ON b.id = o.branch_id
  LEFT JOIN public.customers c ON c.id = o.customer_id
  ORDER BY o.created_at DESC;
END;
$$;

-- Step 9: Tighten contact_submissions RLS - remove conflicting policies
DROP POLICY IF EXISTS "Only service role can insert submissions" ON public.contact_submissions;

-- Allow edge function to insert via service role (this is handled by the edge function)
-- The existing policies are fine, just ensure no direct phone/email exposure

-- Step 10: Create secure function to get contact submission details with masking
CREATE OR REPLACE FUNCTION public.get_contact_submission_details(_submission_id uuid)
RETURNS TABLE (
  id uuid,
  customer_name text,
  phone text,
  email text,
  submission_type text,
  message text,
  status text,
  internal_notes text,
  created_at timestamptz,
  updated_at timestamptz
)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _is_privileged boolean;
BEGIN
  -- Check role access
  IF NOT (is_admin(auth.uid()) 
          OR has_role(auth.uid(), 'call_center'::app_role)
          OR has_role(auth.uid(), 'customer_support'::app_role)) THEN
    -- Check if it's the user's own submission
    IF NOT EXISTS (
      SELECT 1 FROM public.contact_submissions cs
      WHERE cs.id = _submission_id AND cs.user_id = auth.uid()
    ) THEN
      RETURN;
    END IF;
  END IF;
  
  _is_privileged := is_admin(auth.uid()) OR has_role(auth.uid(), 'call_center'::app_role);
  
  -- Log access
  PERFORM log_admin_action_safe(
    auth.uid(),
    'VIEW_CONTACT_SUBMISSION',
    'contact_submission',
    _submission_id,
    'Viewed contact submission'
  );
  
  RETURN QUERY
  SELECT 
    cs.id,
    cs.customer_name,
    CASE 
      WHEN _is_privileged OR cs.user_id = auth.uid() THEN cs.phone
      ELSE mask_phone(cs.phone)
    END as phone,
    CASE 
      WHEN _is_privileged OR cs.user_id = auth.uid() THEN cs.email
      ELSE CASE WHEN cs.email IS NOT NULL THEN '***@***' ELSE NULL END
    END as email,
    cs.submission_type,
    cs.message,
    cs.status,
    cs.internal_notes,
    cs.created_at,
    cs.updated_at
  FROM public.contact_submissions cs
  WHERE cs.id = _submission_id;
END;
$$;