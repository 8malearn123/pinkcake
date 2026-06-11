-- Fix the duplicate/conflicting policies on customers table

-- Drop all existing SELECT policies on customers
DROP POLICY IF EXISTS "Customer sees only own record" ON public.customers;
DROP POLICY IF EXISTS "Staff cannot SELECT customers directly" ON public.customers;
DROP POLICY IF EXISTS "Customers view only own profile" ON public.customers;
DROP POLICY IF EXISTS "Deny anonymous access to customers" ON public.customers;
DROP POLICY IF EXISTS "Anonymous cannot access customers" ON public.customers;

-- Create a single, clear policy for SELECT
CREATE POLICY "Only customer sees own data"
ON public.customers
FOR SELECT
TO authenticated
USING (user_id = auth.uid());