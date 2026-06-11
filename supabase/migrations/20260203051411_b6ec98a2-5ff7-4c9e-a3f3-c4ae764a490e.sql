-- CRITICAL FIX: Remove the overly permissive blocking policy that still grants access
DROP POLICY IF EXISTS "Block all direct customer table access" ON public.customers;

-- CRITICAL FIX: Restrict contact_submissions - NO access to unassigned submissions
-- Only assigned submissions can be viewed
DROP POLICY IF EXISTS "Call center view assigned submissions" ON public.contact_submissions;
DROP POLICY IF EXISTS "Customer support view assigned submissions" ON public.contact_submissions;

-- Call center can ONLY view submissions specifically assigned to them
CREATE POLICY "Call center view only assigned submissions"
ON public.contact_submissions FOR SELECT
TO authenticated
USING (
  has_role(auth.uid(), 'call_center')
  AND assigned_to = auth.uid()
);

-- Customer support can ONLY view submissions specifically assigned to them
CREATE POLICY "Customer support view only assigned submissions"
ON public.contact_submissions FOR SELECT
TO authenticated
USING (
  has_role(auth.uid(), 'customer_support')
  AND assigned_to = auth.uid()
);

-- Update policies - only for assigned submissions
DROP POLICY IF EXISTS "Call center can update assigned submissions" ON public.contact_submissions;
DROP POLICY IF EXISTS "Customer support can update assigned submissions" ON public.contact_submissions;

CREATE POLICY "Call center update only assigned submissions"
ON public.contact_submissions FOR UPDATE
TO authenticated
USING (
  has_role(auth.uid(), 'call_center')
  AND assigned_to = auth.uid()
)
WITH CHECK (
  has_role(auth.uid(), 'call_center')
);

CREATE POLICY "Customer support update only assigned submissions"
ON public.contact_submissions FOR UPDATE
TO authenticated
USING (
  has_role(auth.uid(), 'customer_support')
  AND assigned_to = auth.uid()
)
WITH CHECK (
  has_role(auth.uid(), 'customer_support')
);

-- Fix customer support assigned customers policy - only via assigned submissions
DROP POLICY IF EXISTS "Customer support view assigned customers" ON public.customers;

CREATE POLICY "Customer support view only assigned customers"
ON public.customers FOR SELECT
TO authenticated
USING (
  has_role(auth.uid(), 'customer_support')
  AND EXISTS (
    SELECT 1 FROM contact_submissions cs
    WHERE cs.user_id = customers.user_id
    AND cs.assigned_to = auth.uid()
  )
);

-- CRITICAL: Restrict profiles access - call center only sees profiles of customers they serve
DROP POLICY IF EXISTS "Call center can view profiles" ON public.profiles;

CREATE POLICY "Call center view customer profiles with orders only"
ON public.profiles FOR SELECT
TO authenticated
USING (
  has_role(auth.uid(), 'call_center')
  AND is_customer(profiles.id)
  AND EXISTS (
    SELECT 1 FROM customers c
    JOIN orders o ON o.customer_id = c.id
    WHERE c.user_id = profiles.id
    AND o.created_at > NOW() - INTERVAL '90 days'
  )
);