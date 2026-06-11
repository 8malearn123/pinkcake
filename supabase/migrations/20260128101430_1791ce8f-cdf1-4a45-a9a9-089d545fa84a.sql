-- Fix remaining security issues

-- 1. Remove the branch phone exposure to customers - restrict to staff only
DROP POLICY IF EXISTS "Authenticated users can view branches" ON public.branches;

-- Allow only staff roles to view branches directly
CREATE POLICY "Staff can view branches"
  ON public.branches FOR SELECT
  USING (
    auth.uid() IS NOT NULL AND (
      public.is_admin(auth.uid()) OR
      public.has_role(auth.uid(), 'call_center') OR
      public.has_role(auth.uid(), 'kitchen') OR
      public.has_role(auth.uid(), 'branch')
    )
  );

-- Customers access branches through secure function only (no phone)
-- This is already handled by get_branches_public()

-- 2. Restrict order_items insert to validate order ownership
DROP POLICY IF EXISTS "Call center can insert order items" ON public.order_items;

CREATE POLICY "Call center can insert order items for valid orders"
  ON public.order_items FOR INSERT
  WITH CHECK (
    public.has_role(auth.uid(), 'call_center') AND
    EXISTS (
      SELECT 1 FROM public.orders o 
      WHERE o.id = order_items.order_id
      AND o.status IN ('pending_approval', 'awaiting_payment')
    )
  );

-- 3. Fix order_logs to enforce performed_by = auth.uid()
DROP POLICY IF EXISTS "Authorized roles can create logs" ON public.order_logs;

CREATE POLICY "Authorized roles can create logs for themselves only"
  ON public.order_logs FOR INSERT
  WITH CHECK (
    auth.uid() IS NOT NULL AND
    (performed_by IS NULL OR performed_by = auth.uid()) AND
    (
      public.is_admin(auth.uid()) OR
      public.has_role(auth.uid(), 'call_center') OR
      public.has_role(auth.uid(), 'kitchen') OR
      public.has_role(auth.uid(), 'branch')
    )
  );