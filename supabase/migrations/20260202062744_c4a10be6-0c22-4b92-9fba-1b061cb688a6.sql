-- Admin Impersonation Logging Table
-- Stores all impersonation attempts for audit purposes

CREATE TABLE public.admin_impersonation_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_id UUID NOT NULL,
  admin_name TEXT,
  target_user_id UUID NOT NULL,
  target_user_name TEXT,
  action_type TEXT NOT NULL CHECK (action_type IN ('start', 'end', 'failed_code', 'failed_auth')),
  success BOOLEAN NOT NULL DEFAULT false,
  failure_reason TEXT,
  ip_address TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.admin_impersonation_logs ENABLE ROW LEVEL SECURITY;

-- Restrictive: Block all anonymous access
CREATE POLICY "Deny anonymous access to impersonation_logs"
ON public.admin_impersonation_logs
AS RESTRICTIVE
FOR SELECT
TO public
USING (false);

-- Only admins can view impersonation logs
CREATE POLICY "Admins can view impersonation logs"
ON public.admin_impersonation_logs
FOR SELECT
TO authenticated
USING (is_admin(auth.uid()));

-- Logs can only be inserted via secure function
CREATE POLICY "Logs inserted via function only"
ON public.admin_impersonation_logs
AS RESTRICTIVE
FOR INSERT
TO public
WITH CHECK (false);

-- Logs cannot be updated
CREATE POLICY "Logs cannot be updated"
ON public.admin_impersonation_logs
AS RESTRICTIVE
FOR UPDATE
TO public
USING (false);

-- Logs cannot be deleted
CREATE POLICY "Logs cannot be deleted"
ON public.admin_impersonation_logs
AS RESTRICTIVE
FOR DELETE
TO public
USING (false);

-- Create a secure function to log impersonation attempts
-- This runs with elevated privileges to bypass RLS
CREATE OR REPLACE FUNCTION public.log_impersonation_attempt(
  _admin_id UUID,
  _target_user_id UUID,
  _action_type TEXT,
  _success BOOLEAN,
  _failure_reason TEXT DEFAULT NULL
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _log_id UUID;
  _admin_name TEXT;
  _target_name TEXT;
BEGIN
  -- Get admin name
  SELECT full_name INTO _admin_name FROM profiles WHERE id = _admin_id;
  
  -- Get target user name
  SELECT full_name INTO _target_name FROM profiles WHERE id = _target_user_id;
  
  -- Insert log entry
  INSERT INTO admin_impersonation_logs (
    admin_id,
    admin_name,
    target_user_id,
    target_user_name,
    action_type,
    success,
    failure_reason
  ) VALUES (
    _admin_id,
    _admin_name,
    _target_user_id,
    _target_name,
    _action_type,
    _success,
    _failure_reason
  )
  RETURNING id INTO _log_id;
  
  RETURN _log_id;
END;
$$;

-- Create a function to get target user data for impersonation
-- This is called after code validation in edge function
CREATE OR REPLACE FUNCTION public.get_user_for_impersonation(_user_id UUID)
RETURNS TABLE (
  id UUID,
  full_name TEXT,
  roles TEXT[]
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Only admins can call this
  IF NOT is_admin(auth.uid()) THEN
    RAISE EXCEPTION 'Access denied: Admin privileges required';
  END IF;

  RETURN QUERY
  SELECT 
    p.id,
    p.full_name,
    ARRAY_AGG(ur.role::text) as roles
  FROM profiles p
  LEFT JOIN user_roles ur ON ur.user_id = p.id
  WHERE p.id = _user_id
  GROUP BY p.id, p.full_name;
END;
$$;

-- Grant execute permission on the logging function to authenticated users
GRANT EXECUTE ON FUNCTION public.log_impersonation_attempt TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_user_for_impersonation TO authenticated;