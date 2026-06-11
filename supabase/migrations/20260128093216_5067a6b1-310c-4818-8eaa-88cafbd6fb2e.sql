-- Fix RLS policies for profiles table - remove overly permissive access
-- Drop the policy that allows call_center to view all profiles
DROP POLICY IF EXISTS "Admins and call_center can view all profiles" ON public.profiles;

-- Create a more restrictive policy - admins only can view all profiles
CREATE POLICY "Admins can view all profiles"
  ON public.profiles FOR SELECT
  USING (auth.uid() IS NOT NULL AND public.is_admin(auth.uid()));

-- Restrict order_items modification after certain statuses
DROP POLICY IF EXISTS "Call center can update order items" ON public.order_items;

CREATE POLICY "Call center can update order items before processing"
  ON public.order_items FOR UPDATE
  USING (
    public.has_role(auth.uid(), 'call_center') AND
    EXISTS (
      SELECT 1 FROM public.orders o 
      WHERE o.id = order_items.order_id 
      AND o.status IN ('pending_approval', 'awaiting_payment')
    )
  );