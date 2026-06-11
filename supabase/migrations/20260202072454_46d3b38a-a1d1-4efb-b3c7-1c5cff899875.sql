-- Drop the existing overloaded function first
DROP FUNCTION IF EXISTS public.log_sensitive_data_access(text, uuid, text);

-- Create a safe logging function that never fails
CREATE OR REPLACE FUNCTION public.log_admin_action_safe(
  _admin_id uuid,
  _action_type text,
  _resource_type text,
  _resource_id uuid,
  _justification text DEFAULT NULL
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _admin_name text;
  _admin_role text;
  _safe_action_type text;
BEGIN
  -- Normalize action type - default to UNKNOWN_ACTION if null/empty
  _safe_action_type := COALESCE(NULLIF(TRIM(_action_type), ''), 'UNKNOWN_ACTION');
  
  -- Get admin info (non-blocking)
  BEGIN
    SELECT p.full_name INTO _admin_name
    FROM profiles p WHERE p.id = _admin_id;
    
    SELECT ur.role::text INTO _admin_role
    FROM user_roles ur WHERE ur.user_id = _admin_id
    ORDER BY 
      CASE ur.role 
        WHEN 'admin' THEN 1 
        WHEN 'call_center' THEN 2 
        ELSE 3 
      END
    LIMIT 1;
  EXCEPTION WHEN OTHERS THEN
    _admin_name := NULL;
    _admin_role := NULL;
  END;
  
  -- Insert log - wrapped in exception handler to never fail
  BEGIN
    INSERT INTO admin_data_access_logs (
      admin_id,
      admin_name,
      admin_role,
      action_type,
      resource_type,
      resource_id,
      justification
    ) VALUES (
      _admin_id,
      _admin_name,
      _admin_role,
      _safe_action_type,
      _resource_type,
      _resource_id,
      _justification
    );
  EXCEPTION WHEN OTHERS THEN
    -- Log failure silently - never block the main operation
    RAISE WARNING 'Failed to log admin action: %', SQLERRM;
  END;
END;
$$;

-- Update the original log_sensitive_data_access function signature to use the safe function
CREATE OR REPLACE FUNCTION public.log_sensitive_data_access(
  _action text,
  _resource_id uuid,
  _resource_type text
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  PERFORM log_admin_action_safe(
    auth.uid(),
    COALESCE(_action, 'VIEW_SENSITIVE_DATA'),
    _resource_type,
    _resource_id,
    NULL
  );
END;
$$;

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION public.log_admin_action_safe TO authenticated;
GRANT EXECUTE ON FUNCTION public.log_sensitive_data_access(text, uuid, text) TO authenticated;