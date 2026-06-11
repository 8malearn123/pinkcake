-- Comprehensive fix for phone number exposure issues

-- 1. Fix customers table - remove direct SELECT for call center, force use of secure functions
-- First, drop existing problematic policies
DROP POLICY IF EXISTS "Admin direct customer access" ON public.customers;
DROP POLICY IF EXISTS "Call center and admins can create customers" ON public.customers;

-- Recreate with stricter access - direct SELECT only for own profile
-- All other access must go through secure RPCs
CREATE POLICY "Only own customer profile or secure function"
ON public.customers
FOR SELECT
TO authenticated
USING (
  -- Customers can see their own profile
  user_id = auth.uid()
  -- All other access MUST go through security definer functions
);

-- Keep create policy for call_center/admin
CREATE POLICY "Call center and admins can create customers"
ON public.customers
FOR INSERT
TO authenticated
WITH CHECK (
  public.is_admin(auth.uid()) OR public.has_role(auth.uid(), 'call_center')
);

-- 2. Create a secure function for searching customers that logs access
CREATE OR REPLACE FUNCTION public.search_customer_by_phone(_phone text)
RETURNS TABLE(id uuid, name text, phone text, address text)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _user_id uuid;
  _user_name text;
BEGIN
  _user_id := auth.uid();
  
  -- Only admin and call_center can search
  IF NOT (public.is_admin(_user_id) OR public.has_role(_user_id, 'call_center')) THEN
    RAISE EXCEPTION 'غير مصرح لك بالبحث عن العملاء';
  END IF;
  
  -- Log this sensitive access
  SELECT full_name INTO _user_name FROM public.profiles WHERE id = _user_id;
  
  INSERT INTO public.admin_data_access_logs (
    admin_id, admin_name, admin_role, action_type, resource_type, resource_id, justification
  ) VALUES (
    _user_id, 
    _user_name, 
    CASE WHEN public.is_admin(_user_id) THEN 'admin' ELSE 'call_center' END,
    'searched_customer', 
    'customer', 
    NULL,  -- No specific ID since this is a search
    'Phone search: ' || LEFT(_phone, 3) || '***'
  );
  
  RETURN QUERY
  SELECT c.id, c.name, c.phone, c.address
  FROM public.customers c
  WHERE c.phone = _phone;
END;
$$;

-- 3. Update get_orders_for_admin to mask customer address for kitchen 
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
  customer_address text
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
    -- Payment link only for admin/call_center (operational need)
    CASE WHEN _is_admin OR _is_call_center THEN o.payment_link ELSE NULL END,
    o.tracking_code,
    o.created_at,
    o.updated_at,
    o.branch_id,
    b.name,
    b.address,
    o.customer_id,
    c.name,
    -- Address: Call center gets it, Admin must reveal
    CASE WHEN _is_call_center THEN c.address ELSE NULL END
  FROM public.orders o
  LEFT JOIN public.branches b ON o.branch_id = b.id
  LEFT JOIN public.customers c ON o.customer_id = c.id
  ORDER BY o.created_at DESC;
END;
$$;

-- 4. Fix kitchen orders - ensure NO customer data is exposed
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
    -- Items only - no customer info
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
  -- NO JOIN to customers - kitchen doesn't need customer data
  WHERE o.status IN ('paid', 'preparing', 'ready_to_ship')
    AND public.has_role(auth.uid(), 'kitchen')
  ORDER BY o.created_at DESC
$$;

-- 5. Secure the profiles RLS - ensure only own profile or view access
-- Drop any remaining problematic policies
DROP POLICY IF EXISTS "Admins use view for profiles" ON public.profiles;

-- Create a single restrictive policy
CREATE POLICY "Users see only own profile"
ON public.profiles
FOR SELECT
TO authenticated
USING (id = auth.uid());

-- 6. Create secure function for getting employee phone (audited)
-- Already exists as get_profile_phone_audited but let's verify it's properly secured
CREATE OR REPLACE FUNCTION public.get_profile_phone_audited(_profile_id uuid, _justification text DEFAULT NULL)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _admin_id uuid;
  _admin_name text;
  _phone text;
BEGIN
  _admin_id := auth.uid();
  
  -- Only admins can access this function
  IF NOT public.is_admin(_admin_id) THEN
    RAISE EXCEPTION 'غير مصرح لك بالوصول إلى هذه البيانات';
  END IF;
  
  -- Get admin name for logging
  SELECT full_name INTO _admin_name FROM public.profiles WHERE id = _admin_id;
  
  -- Log the access FIRST (before returning data)
  INSERT INTO public.admin_data_access_logs (
    admin_id, admin_name, admin_role, action_type, resource_type, resource_id, justification
  ) VALUES (
    _admin_id, _admin_name, 'admin', 'viewed_phone', 'profile', _profile_id, _justification
  );
  
  -- Now get and return the phone
  SELECT phone INTO _phone FROM public.profiles WHERE id = _profile_id;
  
  RETURN _phone;
END;
$$;

-- 7. Ensure audit logs are properly protected with trigger-based enforcement
CREATE OR REPLACE FUNCTION public.enforce_audit_log_integrity()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Only allow inserts from authenticated sessions
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Audit logs require authenticated session';
  END IF;
  
  -- Verify the admin_id matches the current user (prevent impersonation)
  IF NEW.admin_id != auth.uid() THEN
    RAISE EXCEPTION 'Cannot log actions for other users';
  END IF;
  
  RETURN NEW;
END;
$$;

-- Create the trigger if it doesn't exist
DROP TRIGGER IF EXISTS enforce_audit_log_integrity_trigger ON public.admin_data_access_logs;
CREATE TRIGGER enforce_audit_log_integrity_trigger
  BEFORE INSERT ON public.admin_data_access_logs
  FOR EACH ROW
  EXECUTE FUNCTION public.enforce_audit_log_integrity();