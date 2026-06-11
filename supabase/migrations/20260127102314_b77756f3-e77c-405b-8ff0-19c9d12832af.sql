
-- =====================================================
-- FINAL SECURITY HARDENING: Audit Log Immutability
-- =====================================================

-- 1. Add explicit DENY policies for order_logs to ensure immutability
-- Even though no UPDATE/DELETE policies exist, add explicit denials for defense in depth

-- Note: Cannot create DENY policies in PostgreSQL RLS, but we can ensure
-- no UPDATE/DELETE policies exist (they already don't)
-- The current state is correct - no policies = no access

-- 2. Add DELETE policy for customers - only admins
CREATE POLICY "Only admins can delete customers"
ON public.customers
FOR DELETE
TO authenticated
USING (auth.uid() IS NOT NULL AND public.is_admin(auth.uid()));

-- 3. Grant explicit protection for admin management policies
-- (Already exists but let's verify)
