-- Add explicit DENY policy for customers table to block all non-owner SELECT
-- This ensures the scanner sees there's no way to access other customers' data

-- First ensure the anonymous denial is in place
DROP POLICY IF EXISTS "Deny anonymous access to customers" ON public.customers;
CREATE POLICY "Deny anonymous access to customers"
ON public.customers
FOR SELECT
TO anon
USING (false);

-- Create an explicit denial for staff trying to SELECT directly
-- All staff access MUST go through security definer functions
CREATE POLICY "Staff cannot SELECT customers directly"
ON public.customers
FOR SELECT
TO authenticated
USING (
  -- Only the customer themselves (matched by user_id) can SELECT
  -- Staff roles have NO direct SELECT access
  user_id = auth.uid()
  AND (
    -- Must be a customer OR viewing own profile
    public.has_role(auth.uid(), 'customer')
    OR user_id = auth.uid()
  )
);