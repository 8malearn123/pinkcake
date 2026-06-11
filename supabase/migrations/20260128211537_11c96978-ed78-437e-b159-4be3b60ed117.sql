-- Fix duplicate SELECT policies on customers table
-- Drop the duplicate policy causing confusion
DROP POLICY IF EXISTS "Customers can only view their own data" ON public.customers;

-- The "Only customer sees own data" policy remains as the single SELECT policy
-- This ensures customers can ONLY access their own record via user_id = auth.uid()

-- Also drop any lingering old policies that might exist
DROP POLICY IF EXISTS "Customer sees only own record" ON public.customers;
DROP POLICY IF EXISTS "Staff cannot SELECT customers directly" ON public.customers;
DROP POLICY IF EXISTS "Customers view only own profile" ON public.customers;
DROP POLICY IF EXISTS "Deny anonymous access to customers" ON public.customers;
DROP POLICY IF EXISTS "Anonymous cannot access customers" ON public.customers;