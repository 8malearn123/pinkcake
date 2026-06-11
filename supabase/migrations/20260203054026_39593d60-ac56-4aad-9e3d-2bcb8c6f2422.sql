-- FINAL SECURITY HARDENING

-- 1. Remove customer_support profile access entirely (they don't need it)
DROP POLICY IF EXISTS "Customer support view customer profiles only" ON public.profiles;

-- 2. Restrict customer_support orders access to only orders from assigned submissions
DROP POLICY IF EXISTS "Customer support can view orders" ON public.orders;

CREATE POLICY "Customer support view assigned customer orders"
ON public.orders FOR SELECT
TO authenticated
USING (
  has_role(auth.uid(), 'customer_support')
  AND EXISTS (
    SELECT 1 FROM contact_submissions cs
    JOIN customers c ON c.user_id = cs.user_id
    WHERE cs.assigned_to = auth.uid()
    AND orders.customer_id = c.id
  )
);

-- 3. Restrict customer_support order_items access similarly
DROP POLICY IF EXISTS "Customer support can view order items" ON public.order_items;

CREATE POLICY "Customer support view assigned order items"
ON public.order_items FOR SELECT
TO authenticated
USING (
  has_role(auth.uid(), 'customer_support')
  AND EXISTS (
    SELECT 1 FROM orders o
    JOIN customers c ON c.id = o.customer_id
    JOIN contact_submissions cs ON cs.user_id = c.user_id
    WHERE o.id = order_items.order_id
    AND cs.assigned_to = auth.uid()
  )
);

-- 4. Restrict custom_order_details access for customer_support
DROP POLICY IF EXISTS "Customer support can view custom orders" ON public.custom_order_details;

CREATE POLICY "Customer support view assigned custom orders"
ON public.custom_order_details FOR SELECT
TO authenticated
USING (
  has_role(auth.uid(), 'customer_support')
  AND EXISTS (
    SELECT 1 FROM orders o
    JOIN customers c ON c.id = o.customer_id
    JOIN contact_submissions cs ON cs.user_id = c.user_id
    WHERE o.id = custom_order_details.order_id
    AND cs.assigned_to = auth.uid()
  )
);

-- 5. Tighten call center customer access to require active order relationship
DROP POLICY IF EXISTS "Call center view customers with orders" ON public.customers;

CREATE POLICY "Call center view customers for active orders"
ON public.customers FOR SELECT
TO authenticated
USING (
  has_role(auth.uid(), 'call_center')
  AND EXISTS (
    SELECT 1 FROM orders o 
    WHERE o.customer_id = customers.id
    AND o.status NOT IN ('completed', 'customer_rejected', 'custom_rejected')
  )
);