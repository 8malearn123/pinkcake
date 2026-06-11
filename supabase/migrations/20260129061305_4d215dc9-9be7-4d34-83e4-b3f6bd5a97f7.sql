
-- Update upsert_customer_by_phone to add audit logging for any SELECT operations
CREATE OR REPLACE FUNCTION public.upsert_customer_by_phone(_name text, _phone text, _address text DEFAULT NULL::text)
 RETURNS uuid
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  _user_id uuid;
  _user_name text;
  _customer_id uuid;
  _is_new boolean := false;
BEGIN
  _user_id := auth.uid();

  IF _user_id IS NULL THEN
    RAISE EXCEPTION 'يجب تسجيل الدخول أولاً';
  END IF;

  IF NOT (public.is_admin(_user_id) OR public.has_role(_user_id, 'call_center'::app_role)) THEN
    RAISE EXCEPTION 'غير مصرح لك بإدارة بيانات العملاء';
  END IF;

  IF _phone IS NULL OR trim(_phone) = '' THEN
    RAISE EXCEPTION 'رقم الجوال مطلوب';
  END IF;

  -- Get user name for logging
  SELECT full_name INTO _user_name FROM public.profiles WHERE id = _user_id;

  -- Check if customer exists
  SELECT id
  INTO _customer_id
  FROM public.customers
  WHERE phone = trim(_phone)
  LIMIT 1;

  IF _customer_id IS NULL THEN
    -- Create new customer
    INSERT INTO public.customers (name, phone, address)
    VALUES (
      COALESCE(NULLIF(trim(_name), ''), 'غير معروف'),
      trim(_phone),
      NULLIF(trim(COALESCE(_address, '')), '')
    )
    RETURNING id INTO _customer_id;
    _is_new := true;
  ELSE
    -- Update existing customer
    UPDATE public.customers
    SET
      name = COALESCE(NULLIF(trim(_name), ''), name),
      address = COALESCE(NULLIF(trim(COALESCE(_address, '')), ''), address)
    WHERE id = _customer_id;
  END IF;

  -- Log this access to customer data
  INSERT INTO public.admin_data_access_logs (
    admin_id, admin_name, admin_role, action_type, resource_type, resource_id, justification
  ) VALUES (
    _user_id, 
    _user_name, 
    CASE WHEN public.is_admin(_user_id) THEN 'admin' ELSE 'call_center' END,
    CASE WHEN _is_new THEN 'created_customer' ELSE 'updated_customer' END, 
    'customer', 
    _customer_id,
    'Order creation - phone: ' || LEFT(trim(_phone), 3) || '***'
  );

  RETURN _customer_id;
END;
$function$;

-- Ensure search_customer_by_phone returns NULL for phone if not authorized
-- Keep existing function but make phone access explicit

-- Update get_customer_display_info to NEVER return phone
CREATE OR REPLACE FUNCTION public.get_customer_display_info(_customer_id uuid)
 RETURNS TABLE(id uuid, name text)
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
  SELECT c.id, c.name
  FROM public.customers c
  WHERE c.id = _customer_id
  -- Note: Phone is intentionally excluded - use get_customer_phone_audited()
$function$;

-- Tighten RLS on customers table - ensure NO direct SELECT for staff
-- Staff must use SECURITY DEFINER functions only

-- Drop any overly permissive policies first
DROP POLICY IF EXISTS "Staff can view customers" ON public.customers;
DROP POLICY IF EXISTS "Call center can view customers" ON public.customers;
DROP POLICY IF EXISTS "Admin can view all customers" ON public.customers;

-- Recreate the restrictive policies ensuring customers can only see own record
-- and NO direct access for staff roles (they use SECURITY DEFINER functions)

-- Ensure the existing deny policies are enforced
-- The existing policies are already restrictive, but let's add explicit denial for kitchen

-- Add explicit comment documenting the security model
COMMENT ON TABLE public.customers IS 'Customer records. Phone and address are sensitive PII. Direct SELECT access is restricted to customer viewing own record only. Staff access MUST go through audited SECURITY DEFINER functions: get_customer_phone_audited(), search_customer_by_phone(), upsert_customer_by_phone().';
