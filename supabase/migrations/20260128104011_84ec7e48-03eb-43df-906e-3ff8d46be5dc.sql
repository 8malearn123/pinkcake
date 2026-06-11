-- Fix the security definer view - recreate with security_invoker
DROP VIEW IF EXISTS public.profiles_admin_safe;

-- Create view with security_invoker = on (this makes it use caller's permissions)
CREATE VIEW public.profiles_admin_safe
WITH (security_invoker = true) AS
SELECT 
  id,
  full_name,
  avatar_url,
  created_at,
  updated_at
FROM public.profiles;