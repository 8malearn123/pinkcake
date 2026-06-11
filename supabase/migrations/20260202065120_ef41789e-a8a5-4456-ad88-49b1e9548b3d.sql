-- Drop existing function first to allow recreating with new signature
DROP FUNCTION IF EXISTS public.get_contact_submissions_secure();

-- Secure function to log access and return submissions with data masking
CREATE OR REPLACE FUNCTION public.get_contact_submissions_secure()
RETURNS TABLE (
  id uuid,
  submission_type text,
  customer_name text,
  phone text,
  email text,
  message text,
  status text,
  internal_notes text,
  assigned_to uuid,
  created_at timestamptz,
  updated_at timestamptz
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _user_id uuid := auth.uid();
  _is_admin boolean;
  _is_support boolean;
  _is_call_center boolean;
  _is_customer boolean;
BEGIN
  _is_admin := is_admin(_user_id);
  _is_support := has_role(_user_id, 'customer_support'::app_role);
  _is_call_center := has_role(_user_id, 'call_center'::app_role);
  _is_customer := is_customer(_user_id);
  
  IF NOT (_is_admin OR _is_support OR _is_call_center OR _is_customer) THEN
    RETURN;
  END IF;
  
  INSERT INTO contact_submission_access_logs (user_id, user_role, submission_id, action_type)
  SELECT 
    _user_id,
    CASE 
      WHEN _is_admin THEN 'admin'
      WHEN _is_call_center THEN 'call_center'
      WHEN _is_support THEN 'customer_support'
      ELSE 'customer'
    END,
    cs.id,
    'view'
  FROM contact_submissions cs
  WHERE 
    (_is_admin OR _is_support OR _is_call_center)
    OR (cs.user_id = _user_id);
  
  IF _is_admin OR _is_call_center THEN
    RETURN QUERY
    SELECT 
      cs.id,
      cs.submission_type,
      cs.customer_name,
      cs.phone,
      cs.email,
      cs.message,
      cs.status,
      cs.internal_notes,
      cs.assigned_to,
      cs.created_at,
      cs.updated_at
    FROM contact_submissions cs
    ORDER BY cs.created_at DESC;
  ELSIF _is_support THEN
    RETURN QUERY
    SELECT 
      cs.id,
      cs.submission_type,
      cs.customer_name,
      CASE 
        WHEN length(cs.phone) > 5 THEN 
          substring(cs.phone from 1 for 3) || '***' || substring(cs.phone from length(cs.phone)-1)
        ELSE '***'
      END as phone,
      CASE 
        WHEN cs.email IS NOT NULL AND position('@' in cs.email) > 2 THEN
          substring(cs.email from 1 for 2) || '***@' || split_part(cs.email, '@', 2)
        ELSE cs.email
      END as email,
      cs.message,
      cs.status,
      cs.internal_notes,
      cs.assigned_to,
      cs.created_at,
      cs.updated_at
    FROM contact_submissions cs
    ORDER BY cs.created_at DESC;
  ELSE
    RETURN QUERY
    SELECT 
      cs.id,
      cs.submission_type,
      cs.customer_name,
      cs.phone,
      cs.email,
      cs.message,
      cs.status,
      NULL::text as internal_notes,
      NULL::uuid as assigned_to,
      cs.created_at,
      cs.updated_at
    FROM contact_submissions cs
    WHERE cs.user_id = _user_id
    ORDER BY cs.created_at DESC;
  END IF;
END;
$$;

-- Function to update submission with audit logging
CREATE OR REPLACE FUNCTION public.update_contact_submission_secure(
  _submission_id uuid,
  _status text DEFAULT NULL,
  _internal_notes text DEFAULT NULL
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _user_id uuid := auth.uid();
  _is_authorized boolean;
  _user_role text;
BEGIN
  _is_authorized := is_admin(_user_id) 
    OR has_role(_user_id, 'call_center'::app_role) 
    OR has_role(_user_id, 'customer_support'::app_role);
  
  IF NOT _is_authorized THEN
    RAISE EXCEPTION 'Unauthorized access';
  END IF;
  
  IF is_admin(_user_id) THEN
    _user_role := 'admin';
  ELSIF has_role(_user_id, 'call_center'::app_role) THEN
    _user_role := 'call_center';
  ELSE
    _user_role := 'customer_support';
  END IF;
  
  INSERT INTO contact_submission_access_logs (user_id, user_role, submission_id, action_type)
  VALUES (_user_id, _user_role, _submission_id, 
    CASE 
      WHEN _status IS NOT NULL AND _internal_notes IS NOT NULL THEN 'update_status_and_note'
      WHEN _status IS NOT NULL THEN 'update_status'
      ELSE 'add_note'
    END
  );
  
  UPDATE contact_submissions
  SET 
    status = COALESCE(_status, status),
    internal_notes = COALESCE(_internal_notes, internal_notes),
    updated_at = now()
  WHERE id = _submission_id;
  
  RETURN true;
END;
$$;

GRANT EXECUTE ON FUNCTION public.get_contact_submissions_secure() TO authenticated;
GRANT EXECUTE ON FUNCTION public.update_contact_submission_secure(uuid, text, text) TO authenticated;