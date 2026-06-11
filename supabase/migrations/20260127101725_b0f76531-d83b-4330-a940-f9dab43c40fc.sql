
-- =====================================================
-- SECURITY HARDENING: Protect Customer & Employee Data
-- =====================================================

-- 1. Create security definer functions to access data safely
-- These functions mask sensitive fields and enforce role-based access

-- Function to get customer display name only (no contact info)
CREATE OR REPLACE FUNCTION public.get_customer_display_info(_customer_id uuid)
RETURNS TABLE(id uuid, name text)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT c.id, c.name
  FROM public.customers c
  WHERE c.id = _customer_id
$$;

-- Function to get orders with masked customer data for kitchen
CREATE OR REPLACE FUNCTION public.get_kitchen_orders_secure()
RETURNS TABLE(
  id uuid,
  order_number text,
  status order_status,
  branch_id uuid,
  branch_name text,
  delivery_date date,
  delivery_time time,
  notes text,
  created_at timestamptz,
  items jsonb
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT 
    o.id,
    o.order_number,
    o.status,
    o.branch_id,
    b.name as branch_name,
    o.delivery_date,
    o.delivery_time,
    o.notes,
    o.created_at,
    (
      SELECT jsonb_agg(jsonb_build_object(
        'product_name', oi.product_name,
        'quantity', oi.quantity,
        'notes', oi.notes
      ))
      FROM public.order_items oi
      WHERE oi.order_id = o.id
    ) as items
  FROM public.orders o
  LEFT JOIN public.branches b ON o.branch_id = b.id
  WHERE o.status IN ('paid', 'preparing', 'ready_to_ship')
  ORDER BY o.created_at DESC
$$;

-- Function to get orders for branch staff (no payment links, masked customer data)
CREATE OR REPLACE FUNCTION public.get_branch_orders_secure(_user_id uuid)
RETURNS TABLE(
  id uuid,
  order_number text,
  status order_status,
  customer_name text,
  delivery_date date,
  delivery_time time,
  notes text,
  created_at timestamptz,
  tracking_code text,
  items jsonb
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT 
    o.id,
    o.order_number,
    o.status,
    c.name as customer_name,
    o.delivery_date,
    o.delivery_time,
    o.notes,
    o.created_at,
    o.tracking_code,
    (
      SELECT jsonb_agg(jsonb_build_object(
        'product_name', oi.product_name,
        'quantity', oi.quantity
      ))
      FROM public.order_items oi
      WHERE oi.order_id = o.id
    ) as items
  FROM public.orders o
  LEFT JOIN public.customers c ON o.customer_id = c.id
  WHERE o.branch_id = public.get_user_branch_id(_user_id)
    AND o.status IN ('in_transit', 'ready_for_pickup', 'completed')
  ORDER BY o.created_at DESC
$$;

-- 2. Create a secure view for branches (hide phone for non-admins)
CREATE OR REPLACE FUNCTION public.get_branches_public()
RETURNS TABLE(id uuid, name text, address text)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT id, name, address FROM public.branches
$$;

-- Function to get branch with full details (admin/call center only)
CREATE OR REPLACE FUNCTION public.get_branches_full()
RETURNS TABLE(id uuid, name text, address text, phone text)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT id, name, address, phone 
  FROM public.branches
  WHERE public.is_admin(auth.uid()) OR public.has_role(auth.uid(), 'call_center')
$$;

-- 3. Restrict user_roles visibility - users should only see their own roles
-- Drop and recreate the SELECT policy
DROP POLICY IF EXISTS "Users can view roles based on access" ON public.user_roles;
CREATE POLICY "Users can only view their own roles"
ON public.user_roles
FOR SELECT
TO authenticated
USING (user_id = auth.uid());

-- Keep admin management policy
-- (Already exists: Admins can manage user roles)

-- 4. Restrict profiles visibility further - remove phone exposure
DROP POLICY IF EXISTS "Users can view their own profile or admin sees all" ON public.profiles;
CREATE POLICY "Users can view their own profile"
ON public.profiles
FOR SELECT
TO authenticated
USING (id = auth.uid());

-- Admin needs a separate policy to see profiles for user management
CREATE POLICY "Admins can view all profiles"
ON public.profiles
FOR SELECT
TO authenticated
USING (public.is_admin(auth.uid()));

-- 5. Create a secure function to get employee list for admin (without exposing sensitive data)
CREATE OR REPLACE FUNCTION public.get_employees_for_admin()
RETURNS TABLE(
  id uuid,
  full_name text,
  created_at timestamptz,
  roles text[]
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT 
    p.id,
    p.full_name,
    p.created_at,
    ARRAY(
      SELECT r.role::text 
      FROM public.user_roles r 
      WHERE r.user_id = p.id
    ) as roles
  FROM public.profiles p
  WHERE public.is_admin(auth.uid())
$$;

-- 6. Restrict branch_assignments visibility
DROP POLICY IF EXISTS "Users can view branch assignments based on access" ON public.user_branch_assignments;
CREATE POLICY "Users can view their own branch assignment"
ON public.user_branch_assignments
FOR SELECT
TO authenticated
USING (user_id = auth.uid());

-- Admin policy already exists for management

-- 7. Add function to check if current user has any role (for frontend auth checks)
CREATE OR REPLACE FUNCTION public.get_my_roles()
RETURNS text[]
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT ARRAY(
    SELECT role::text 
    FROM public.user_roles 
    WHERE user_id = auth.uid()
  )
$$;

-- 8. Add function to get my branch (for branch staff)
CREATE OR REPLACE FUNCTION public.get_my_branch()
RETURNS TABLE(id uuid, name text)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT b.id, b.name
  FROM public.user_branch_assignments uba
  JOIN public.branches b ON b.id = uba.branch_id
  WHERE uba.user_id = auth.uid()
  LIMIT 1
$$;
