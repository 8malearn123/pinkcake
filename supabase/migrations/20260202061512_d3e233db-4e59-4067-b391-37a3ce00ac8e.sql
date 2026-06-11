
-- Fix the RESTRICTIVE policy that's blocking admin access to all profiles
-- The issue: "Block unauthorized profile access" is RESTRICTIVE with (id = auth.uid() OR is_admin())
-- But it's combined with other RESTRICTIVE policies incorrectly

-- Drop the problematic policy
DROP POLICY IF EXISTS "Block unauthorized profile access" ON public.profiles;

-- Create a proper PERMISSIVE policy for admin to view all profiles
CREATE POLICY "Admins can view all profiles"
ON public.profiles
FOR SELECT
TO authenticated
USING (is_admin(auth.uid()));

-- The existing "Users view own profile" policy handles self-view
-- The "Deny anonymous access" RESTRICTIVE policy correctly blocks anon

-- Create a secure function for admin to get all profiles for user management
CREATE OR REPLACE FUNCTION public.get_all_profiles_for_admin()
RETURNS TABLE(
  id uuid,
  full_name text,
  avatar_url text,
  created_at timestamptz,
  updated_at timestamptz
)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Only admin can use this function
  IF NOT public.is_admin(auth.uid()) THEN
    RAISE EXCEPTION 'غير مصرح لك بعرض قائمة المستخدمين';
  END IF;
  
  RETURN QUERY
  SELECT 
    p.id,
    p.full_name,
    p.avatar_url,
    p.created_at,
    p.updated_at
  FROM public.profiles p
  ORDER BY p.created_at DESC;
END;
$$;

-- Ensure phone access requires the audited function (already in place)
-- This function does NOT return phone - must use get_profile_phone_audited

-- Create a helper function to sync any missing profiles (one-time fix + future protection)
CREATE OR REPLACE FUNCTION public.sync_missing_profiles()
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _count integer := 0;
BEGIN
  -- Only admin can run this
  IF NOT public.is_admin(auth.uid()) THEN
    RAISE EXCEPTION 'Only admins can sync profiles';
  END IF;
  
  -- Insert missing profiles
  INSERT INTO public.profiles (id, full_name, created_at, updated_at)
  SELECT 
    au.id,
    COALESCE(au.raw_user_meta_data->>'full_name', au.email),
    au.created_at,
    NOW()
  FROM auth.users au
  WHERE NOT EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = au.id)
  ON CONFLICT (id) DO NOTHING;
  
  GET DIAGNOSTICS _count = ROW_COUNT;
  
  RETURN _count;
END;
$$;
