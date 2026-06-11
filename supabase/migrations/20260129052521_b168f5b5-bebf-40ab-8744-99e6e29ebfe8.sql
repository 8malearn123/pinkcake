-- Fix customer phone access security
-- Problem: Customers created by staff (without user_id) could potentially be accessed incorrectly
-- Solution: Ensure staff-created customers (user_id IS NULL) are NEVER accessible via direct table SELECT

-- Drop and recreate the SELECT policy to be more restrictive
DROP POLICY IF EXISTS "Only customer sees own data" ON public.customers;

-- New policy: Only customers with matching user_id can see their own record
-- Staff-created customers (user_id IS NULL) are NOT accessible via direct SELECT
-- They must be accessed via SECURITY DEFINER functions only
CREATE POLICY "Customers can only see own record"
ON public.customers
FOR SELECT
TO authenticated
USING (
  user_id IS NOT NULL 
  AND user_id = auth.uid()
);

-- Ensure profiles phone access is also properly restricted
-- Drop any overly permissive policies
DROP POLICY IF EXISTS "Profiles are viewable by everyone" ON public.profiles;
DROP POLICY IF EXISTS "Public profiles are viewable by everyone" ON public.profiles;

-- Verify the strict profile access policy exists
-- This should already exist but let's ensure it
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'profiles' 
    AND policyname = 'Strict profile access - own only'
  ) THEN
    CREATE POLICY "Strict profile access - own only"
    ON public.profiles
    FOR SELECT
    TO authenticated
    USING (id = auth.uid());
  END IF;
END $$;

-- Add comment to document security model
COMMENT ON TABLE public.customers IS 'Customer data with strict RLS. user_id-linked customers accessible to owner only. Staff-created customers (user_id IS NULL) accessible only via SECURITY DEFINER functions.';

COMMENT ON TABLE public.profiles IS 'User profiles with strict RLS. Each user can only access their own profile. Phone numbers require audited access via get_profile_phone_audited().';
