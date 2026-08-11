-- Customer lookup by mobile number, used by the order forms' first step
-- ("هل العميل مسجّل؟"). Two changes to search_customer_by_phone:
--
--   1. customer_support may search. It already creates custom orders through
--      create_custom_order (which upserts the customer by phone), so it needs
--      the same "does this customer exist?" check admin/call_center have —
--      otherwise the lookup step is unusable on /custom-orders.
--
--   2. Match on the national significant number (the last 9 digits) instead of
--      the raw string, so 05XXXXXXXX, 5XXXXXXXX, +9665XXXXXXXX and
--      009665XXXXXXXX all find the same record. Rows were stored as typed, so
--      an exact-string match silently reported existing customers as new and
--      duplicated them.
--
-- Authorization, the audit-log entry and the return shape are unchanged.
CREATE OR REPLACE FUNCTION public.search_customer_by_phone(_phone text)
RETURNS TABLE(id uuid, name text, phone text, address text)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _user_id uuid;
  _user_name text;
  _digits text;
BEGIN
  _user_id := auth.uid();

  IF NOT (
    public.is_admin(_user_id)
    OR public.has_role(_user_id, 'call_center')
    OR public.has_role(_user_id, 'customer_support')
  ) THEN
    RAISE EXCEPTION 'غير مصرح لك بالبحث عن العملاء';
  END IF;

  _digits := right(regexp_replace(COALESCE(_phone, ''), '\D', '', 'g'), 9);

  -- Partial number: nothing to match, and nothing worth logging as an access.
  IF length(_digits) < 9 THEN
    RETURN;
  END IF;

  -- Log this sensitive access
  SELECT full_name INTO _user_name FROM public.profiles WHERE id = _user_id;

  INSERT INTO public.admin_data_access_logs (
    admin_id, admin_name, admin_role, action_type, resource_type, resource_id, justification
  ) VALUES (
    _user_id,
    _user_name,
    CASE
      WHEN public.is_admin(_user_id) THEN 'admin'
      WHEN public.has_role(_user_id, 'call_center') THEN 'call_center'
      ELSE 'customer_support'
    END,
    'searched_customer',
    'customer',
    NULL,  -- No specific ID since this is a search
    'Phone search: ' || LEFT(_phone, 3) || '***'
  );

  RETURN QUERY
  SELECT c.id, c.name, c.phone, c.address
  FROM public.customers c
  WHERE right(regexp_replace(c.phone, '\D', '', 'g'), 9) = _digits
  LIMIT 1;
END;
$$;
