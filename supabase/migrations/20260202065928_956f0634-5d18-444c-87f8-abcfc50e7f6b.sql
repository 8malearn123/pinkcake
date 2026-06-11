-- Drop old policies and ensure proper restrictive policies are in place
DROP POLICY IF EXISTS "Block unauthorized contact submission access" ON public.contact_submissions;
DROP POLICY IF EXISTS "Authorized access to contact submissions" ON public.contact_submissions;

-- Create new restrictive policy that includes customer access to own submissions
CREATE POLICY "Authorized access to contact submissions"
  ON public.contact_submissions AS RESTRICTIVE FOR SELECT
  USING (
    is_admin(auth.uid()) 
    OR has_role(auth.uid(), 'call_center'::app_role) 
    OR has_role(auth.uid(), 'customer_support'::app_role)
    OR (user_id IS NOT NULL AND user_id = auth.uid())
  );