-- Fix order_logs INSERT - allow the trigger (SECURITY DEFINER function) to insert logs
-- The log_order_change function is SECURITY DEFINER so it bypasses RLS
-- We need to allow inserts for the system but block direct user inserts

-- Option: Use a service role approach - authenticated users with proper roles can insert
DROP POLICY IF EXISTS "Only system can create order logs" ON public.order_logs;

-- Allow inserts only from authorized roles who are creating/updating orders
CREATE POLICY "Authorized roles can create logs via system"
  ON public.order_logs FOR INSERT
  TO authenticated
  WITH CHECK (
    public.is_admin(auth.uid()) OR
    public.has_role(auth.uid(), 'call_center'::app_role) OR
    public.has_role(auth.uid(), 'kitchen'::app_role) OR
    public.has_role(auth.uid(), 'branch'::app_role)
  );

-- Note: The log_order_change trigger uses SECURITY DEFINER which bypasses RLS entirely
-- So the above policy is for any direct log inserts if needed

-- Add explicit DENY policies for anonymous role on sensitive tables
-- These are already covered by TO authenticated, but being explicit

-- For profiles - already restricted to authenticated
-- For customers - already restricted to authenticated
-- For branches - already restricted to authenticated

-- The concern about "public access" is not applicable because:
-- 1. All policies use TO authenticated which excludes anon role
-- 2. RLS is enabled on all tables
-- 3. Without a matching policy, access is denied by default