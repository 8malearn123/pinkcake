-- SECURITY FIX 1: Restrict customers table access
-- call_center should only see customers they're actively serving (via orders)

-- Drop overly permissive policies
DROP POLICY IF EXISTS "Call center view customers" ON public.customers;
DROP POLICY IF EXISTS "Block unauthorized customer access" ON public.customers;

-- Call center can only view customers who have orders (active service relationship)
CREATE POLICY "Call center view customers with orders"
ON public.customers FOR SELECT
TO authenticated
USING (
  has_role(auth.uid(), 'call_center')
  AND EXISTS (
    SELECT 1 FROM orders o 
    WHERE o.customer_id = customers.id
    AND o.created_at > NOW() - INTERVAL '90 days'
  )
);

-- Customer support can only view customers related to contact submissions assigned to them
CREATE POLICY "Customer support view assigned customers"
ON public.customers FOR SELECT
TO authenticated
USING (
  has_role(auth.uid(), 'customer_support')
  AND EXISTS (
    SELECT 1 FROM contact_submissions cs
    WHERE cs.user_id = customers.user_id
    AND (cs.assigned_to = auth.uid() OR cs.assigned_to IS NULL)
  )
);

-- SECURITY FIX 2: Restrict contact_submissions access
-- Drop overly permissive policies
DROP POLICY IF EXISTS "Authorized access to contact submissions" ON public.contact_submissions;

-- Admin has full access (already exists via "Admins can manage all submissions")

-- Call center can only view submissions assigned to them or unassigned
CREATE POLICY "Call center view assigned submissions"
ON public.contact_submissions FOR SELECT
TO authenticated
USING (
  has_role(auth.uid(), 'call_center')
  AND (assigned_to = auth.uid() OR assigned_to IS NULL)
);

-- Customer support can only view submissions assigned to them or unassigned
CREATE POLICY "Customer support view assigned submissions"
ON public.contact_submissions FOR SELECT
TO authenticated
USING (
  has_role(auth.uid(), 'customer_support')
  AND (assigned_to = auth.uid() OR assigned_to IS NULL)
);

-- Update customer support update policy to only allow updating assigned submissions
DROP POLICY IF EXISTS "Customer support can update submissions" ON public.contact_submissions;

CREATE POLICY "Customer support can update assigned submissions"
ON public.contact_submissions FOR UPDATE
TO authenticated
USING (
  has_role(auth.uid(), 'customer_support')
  AND (assigned_to = auth.uid() OR assigned_to IS NULL)
)
WITH CHECK (
  has_role(auth.uid(), 'customer_support')
);

-- Update call center update policy similarly
DROP POLICY IF EXISTS "Call center can update submissions" ON public.contact_submissions;

CREATE POLICY "Call center can update assigned submissions"
ON public.contact_submissions FOR UPDATE
TO authenticated
USING (
  has_role(auth.uid(), 'call_center')
  AND (assigned_to = auth.uid() OR assigned_to IS NULL)
)
WITH CHECK (
  has_role(auth.uid(), 'call_center')
);

-- SECURITY FIX 3: Restrict profiles table access further
-- Customer support should only see customer profiles, not staff
DROP POLICY IF EXISTS "Customer support can view profiles for orders" ON public.profiles;

CREATE POLICY "Customer support view customer profiles only"
ON public.profiles FOR SELECT
TO authenticated
USING (
  has_role(auth.uid(), 'customer_support')
  AND is_customer(profiles.id)
);