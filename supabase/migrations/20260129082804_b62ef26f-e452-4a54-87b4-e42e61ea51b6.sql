-- Remove public INSERT policy since we now use secure edge function
DROP POLICY IF EXISTS "Anyone can submit contact forms" ON public.contact_submissions;

-- Create a policy that only allows inserts from service role (edge function)
-- This blocks any direct client-side inserts
CREATE POLICY "Only service role can insert submissions"
ON public.contact_submissions
FOR INSERT
TO authenticated, anon
WITH CHECK (false);

-- Note: The edge function uses service_role key which bypasses RLS