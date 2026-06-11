-- Fix the policy structure: Remove conflicting policies and create proper restrictive-then-permissive structure
-- The restrictive policies act as a mandatory filter, permissive policies grant access if restrictive allows

-- Drop the problematic Deny anonymous policy that blocks everything
DROP POLICY IF EXISTS "Deny anonymous SELECT on contact submissions" ON public.contact_submissions;

-- Drop redundant permissive SELECT policies (already covered by restrictive policy)
DROP POLICY IF EXISTS "Call center can view submissions" ON public.contact_submissions;
DROP POLICY IF EXISTS "Customer support can view submissions" ON public.contact_submissions;

-- The "Authorized access to contact submissions" RESTRICTIVE policy is correct and handles all access control