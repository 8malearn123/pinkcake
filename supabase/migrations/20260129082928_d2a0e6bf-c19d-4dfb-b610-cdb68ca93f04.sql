-- Add explicit deny policies for anonymous access to profiles
CREATE POLICY "Deny anonymous access to profiles"
ON public.profiles
AS RESTRICTIVE
FOR SELECT
TO anon
USING (false);

-- Ensure contact_submissions cannot be accessed by non-authorized roles
CREATE POLICY "Deny unauthorized SELECT on contact submissions"
ON public.contact_submissions
AS RESTRICTIVE
FOR SELECT
TO authenticated
USING (
  is_admin(auth.uid()) OR 
  has_role(auth.uid(), 'call_center') OR 
  has_role(auth.uid(), 'customer_support')
);

-- Explicitly block anonymous access to contact_submissions
CREATE POLICY "Deny anonymous SELECT on contact submissions"
ON public.contact_submissions
AS RESTRICTIVE
FOR SELECT
TO anon
USING (false);

-- Restrict order_items access more explicitly
CREATE POLICY "Restrict order_items to authorized roles only"
ON public.order_items
AS RESTRICTIVE
FOR SELECT
TO authenticated
USING (
  is_admin(auth.uid()) OR
  has_role(auth.uid(), 'call_center') OR
  has_role(auth.uid(), 'kitchen') OR
  has_role(auth.uid(), 'customer_support') OR
  (has_role(auth.uid(), 'branch') AND EXISTS (
    SELECT 1 FROM orders WHERE orders.id = order_items.order_id 
    AND orders.branch_id = get_user_branch_id(auth.uid())
  )) OR
  (is_customer(auth.uid()) AND EXISTS (
    SELECT 1 FROM orders o WHERE o.id = order_items.order_id 
    AND o.customer_id = get_my_customer_id()
  ))
);

-- Add restrictive policy to orders table
CREATE POLICY "Restrict orders to authorized access only"
ON public.orders
AS RESTRICTIVE
FOR SELECT
TO authenticated
USING (
  is_admin(auth.uid()) OR
  has_role(auth.uid(), 'call_center') OR
  has_role(auth.uid(), 'kitchen') OR
  has_role(auth.uid(), 'customer_support') OR
  (has_role(auth.uid(), 'branch') AND branch_id = get_user_branch_id(auth.uid())) OR
  (is_customer(auth.uid()) AND customer_id = get_my_customer_id())
);