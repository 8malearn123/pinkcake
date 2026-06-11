-- Add explicit anonymous access denial for customers table
-- This prevents unauthenticated users from accessing any customer data

CREATE POLICY "Deny anonymous access to customers"
ON public.customers
FOR SELECT
TO anon
USING (false);

-- Also add denial policies for other operations
CREATE POLICY "Deny anonymous insert to customers"
ON public.customers
FOR INSERT
TO anon
WITH CHECK (false);

CREATE POLICY "Deny anonymous update to customers"
ON public.customers
FOR UPDATE
TO anon
USING (false);

CREATE POLICY "Deny anonymous delete to customers"
ON public.customers
FOR DELETE
TO anon
USING (false);