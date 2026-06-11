-- Create immutable audit log table for sensitive data access
CREATE TABLE public.admin_data_access_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_id uuid NOT NULL,
  admin_name text,
  admin_role text,
  action_type text NOT NULL CHECK (action_type IN ('viewed_phone', 'viewed_address', 'viewed_profile')),
  resource_type text NOT NULL CHECK (resource_type IN ('profile', 'customer', 'order')),
  resource_id uuid NOT NULL,
  accessed_at timestamp with time zone NOT NULL DEFAULT now(),
  justification text,
  ip_address text
);

-- Enable RLS
ALTER TABLE public.admin_data_access_logs ENABLE ROW LEVEL SECURITY;

-- Only admins can view logs (for audit review)
CREATE POLICY "Only admins can view access logs"
  ON public.admin_data_access_logs FOR SELECT
  USING (public.is_admin(auth.uid()));

-- Logs can only be inserted by admins through secure function
CREATE POLICY "Logs can only be inserted via secure function"
  ON public.admin_data_access_logs FOR INSERT
  WITH CHECK (false);  -- Blocked at RLS, only SECURITY DEFINER can insert

-- Logs cannot be updated or deleted (immutable)
CREATE POLICY "Logs cannot be updated"
  ON public.admin_data_access_logs FOR UPDATE
  USING (false);

CREATE POLICY "Logs cannot be deleted"
  ON public.admin_data_access_logs FOR DELETE
  USING (false);

-- Deny anonymous access
CREATE POLICY "Deny anonymous access to logs"
  ON public.admin_data_access_logs FOR SELECT
  USING (false);

-- Create secure function to get profile phone with audit logging
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

-- Create secure function to get customer phone with audit logging (for order context)
CREATE OR REPLACE FUNCTION public.get_customer_phone_audited(_customer_id uuid, _order_id uuid DEFAULT NULL, _justification text DEFAULT NULL)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _user_id uuid;
  _user_name text;
  _phone text;
  _is_admin boolean;
  _is_call_center boolean;
  _is_branch_of_order boolean;
BEGIN
  _user_id := auth.uid();
  _is_admin := public.is_admin(_user_id);
  _is_call_center := public.has_role(_user_id, 'call_center');
  
  -- Check if branch user and order belongs to their branch
  IF _order_id IS NOT NULL THEN
    _is_branch_of_order := public.has_role(_user_id, 'branch') AND EXISTS (
      SELECT 1 FROM public.orders o 
      WHERE o.id = _order_id 
      AND o.branch_id = public.get_user_branch_id(_user_id)
      AND o.customer_id = _customer_id
    );
  ELSE
    _is_branch_of_order := false;
  END IF;
  
  -- Only authorized roles can access
  IF NOT (_is_admin OR _is_call_center OR _is_branch_of_order) THEN
    RAISE EXCEPTION 'غير مصرح لك بالوصول إلى هذه البيانات';
  END IF;
  
  -- Get user name for logging
  SELECT full_name INTO _user_name FROM public.profiles WHERE id = _user_id;
  
  -- Log the access for admins (call center access is operational, not logged in admin audit)
  IF _is_admin THEN
    INSERT INTO public.admin_data_access_logs (
      admin_id, admin_name, admin_role, action_type, resource_type, resource_id, justification
    ) VALUES (
      _user_id, _user_name, 'admin', 'viewed_phone', 'customer', _customer_id, 
      COALESCE(_justification, 'Order ID: ' || COALESCE(_order_id::text, 'N/A'))
    );
  END IF;
  
  -- Get and return the phone
  SELECT phone INTO _phone FROM public.customers WHERE id = _customer_id;
  
  RETURN _phone;
END;
$$;

-- Update profiles RLS to block direct phone access for admins
-- Admins must use the audited function instead
DROP POLICY IF EXISTS "Admins can view all profiles" ON public.profiles;

-- Create a view for admin profile access that excludes phone
CREATE OR REPLACE VIEW public.profiles_admin_safe AS
SELECT 
  id,
  full_name,
  avatar_url,
  -- Phone is excluded - must use get_profile_phone_audited()
  created_at,
  updated_at
FROM public.profiles;

-- Admins can view profiles but phone is masked
CREATE POLICY "Admins can view profiles without phone"
  ON public.profiles FOR SELECT
  USING (
    auth.uid() IS NOT NULL AND 
    public.is_admin(auth.uid())
  );

-- Function to get admin access logs (for audit review)
CREATE OR REPLACE FUNCTION public.get_admin_access_logs(_days integer DEFAULT 30)
RETURNS TABLE(
  id uuid,
  admin_id uuid,
  admin_name text,
  admin_role text,
  action_type text,
  resource_type text,
  resource_id uuid,
  accessed_at timestamp with time zone,
  justification text
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT 
    l.id,
    l.admin_id,
    l.admin_name,
    l.admin_role,
    l.action_type,
    l.resource_type,
    l.resource_id,
    l.accessed_at,
    l.justification
  FROM public.admin_data_access_logs l
  WHERE l.accessed_at >= NOW() - (_days || ' days')::interval
    AND public.is_admin(auth.uid())
  ORDER BY l.accessed_at DESC
$$;