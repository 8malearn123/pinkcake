-- Fix critical security issue: Phone numbers in profiles table are accessible to admins
-- The policy "Admins can view profiles without phone" is misleading - it actually grants full access

-- Step 1: Drop the problematic policy that gives admins access to phone column
DROP POLICY IF EXISTS "Admins can view profiles without phone" ON public.profiles;

-- Step 2: Create a truly secure policy for admins that uses the safe view
-- Admins should use get_profile_phone_audited() to access phone numbers (already implemented)
-- This policy allows admins to view profile data but phone column is handled separately

-- Create a function to check if user can view profiles (without phone)
CREATE OR REPLACE FUNCTION public.can_view_profiles_basic()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT 
    auth.uid() IS NOT NULL AND (
      public.is_admin(auth.uid()) OR 
      public.has_role(auth.uid(), 'call_center')
    )
$$;

-- Step 3: Create a secure view for admin/staff profile access that excludes phone
DROP VIEW IF EXISTS public.profiles_staff_view;
CREATE VIEW public.profiles_staff_view
WITH (security_invoker = true)
AS SELECT 
  id,
  full_name,
  avatar_url,
  created_at,
  updated_at
  -- Explicitly excludes phone column
FROM public.profiles
WHERE public.can_view_profiles_basic();

-- Step 4: Grant access to the view
GRANT SELECT ON public.profiles_staff_view TO authenticated;

-- Step 5: Update the admin policy to be truly restrictive
-- Admins can view profiles but WITHOUT phone - phone must be accessed via audited function
CREATE POLICY "Staff can view profiles without phone"
ON public.profiles
FOR SELECT
TO authenticated
USING (
  -- Users can always see their own profile (including phone)
  id = auth.uid()
  OR
  -- Staff can see profiles but phone column will be NULL via RLS
  -- Actually we need to block direct access and force use of the view
  false  -- Block all direct admin access - must use view or audited function
);

-- Wait, the above would break things. Let me reconsider.
-- The issue is that RLS cannot hide specific columns - it's row-level, not column-level.
-- The solution is to ensure the phone column is only accessible through:
-- 1. User's own profile (already allowed)
-- 2. Audited function get_profile_phone_audited (already exists)

-- Let's fix by:
-- 1. Removing the admin SELECT policy entirely 
-- 2. Keeping only the "Users can view own profile only" policy
-- 3. Admins must use profiles_admin_safe view (excludes phone) or the audited function

-- First, drop the policy we just created
DROP POLICY IF EXISTS "Staff can view profiles without phone" ON public.profiles;

-- Now create a proper restrictive policy
-- Users can only view their own profile
-- All other access must go through views or secure functions
CREATE POLICY "Admins use view for profiles"
ON public.profiles
FOR SELECT
TO authenticated
USING (
  -- Only allow direct access to own profile
  id = auth.uid()
);

-- The profiles_admin_safe view already exists and excludes phone
-- Make sure it's properly secured
DROP VIEW IF EXISTS public.profiles_admin_safe;
CREATE VIEW public.profiles_admin_safe
WITH (security_invoker = true)
AS SELECT 
  id,
  full_name,
  avatar_url,
  created_at,
  updated_at
  -- phone is intentionally excluded
FROM public.profiles;

GRANT SELECT ON public.profiles_admin_safe TO authenticated;

-- Update the get_employees_secure function to ensure it uses audited access pattern
CREATE OR REPLACE FUNCTION public.get_employees_secure()
RETURNS TABLE(
  id uuid, 
  full_name text, 
  avatar_url text, 
  phone text,  -- Will be NULL unless accessed via audited reveal
  created_at timestamp with time zone, 
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
    p.avatar_url,
    -- Phone is ALWAYS null here - must use get_profile_phone_audited to reveal
    NULL::text as phone,
    p.created_at,
    ARRAY(
      SELECT r.role::text 
      FROM public.user_roles r 
      WHERE r.user_id = p.id
    ) as roles
  FROM public.profiles p
  WHERE public.is_admin(auth.uid()) OR public.has_role(auth.uid(), 'call_center')
$$;

-- Ensure get_order_details_secure also masks customer phone properly
-- Already done in previous migration but let's verify the function is correct
CREATE OR REPLACE FUNCTION public.get_order_details_secure(_order_id uuid)
RETURNS TABLE(
  id uuid, 
  order_number text, 
  status order_status, 
  total_amount numeric, 
  delivery_date date, 
  delivery_time time without time zone, 
  notes text, 
  payment_status text, 
  payment_link text, 
  tracking_code text, 
  created_at timestamp with time zone, 
  updated_at timestamp with time zone, 
  branch_id uuid, 
  branch_name text, 
  branch_address text, 
  customer_id uuid, 
  customer_name text, 
  customer_phone text, 
  customer_address text, 
  items jsonb
)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _is_admin boolean;
  _is_call_center boolean;
  _is_kitchen boolean;
  _is_branch boolean;
  _user_branch_id uuid;
  _order_branch_id uuid;
BEGIN
  _is_admin := public.is_admin(auth.uid());
  _is_call_center := public.has_role(auth.uid(), 'call_center');
  _is_kitchen := public.has_role(auth.uid(), 'kitchen');
  _is_branch := public.has_role(auth.uid(), 'branch');
  _user_branch_id := public.get_user_branch_id(auth.uid());
  
  SELECT o.branch_id INTO _order_branch_id FROM public.orders o WHERE o.id = _order_id;

  RETURN QUERY
  SELECT 
    o.id,
    o.order_number,
    o.status,
    o.total_amount,
    o.delivery_date,
    o.delivery_time,
    o.notes,
    -- Payment info only for admin and call_center
    CASE WHEN _is_admin OR _is_call_center THEN o.payment_status ELSE NULL END,
    CASE WHEN _is_admin OR _is_call_center THEN o.payment_link ELSE NULL END,
    o.tracking_code,
    o.created_at,
    o.updated_at,
    o.branch_id,
    b.name,
    b.address,
    o.customer_id,
    c.name,
    -- Phone: ONLY Call Center and assigned Branch get it directly
    -- Admin must use get_customer_phone_audited() - forces audit trail
    -- Kitchen NEVER gets phone
    CASE 
      WHEN _is_call_center THEN c.phone
      WHEN _is_branch AND _order_branch_id = _user_branch_id THEN c.phone
      ELSE NULL  -- Admin and Kitchen must use audited function or don't get access
    END,
    -- Address: Call Center and assigned Branch (for delivery)
    CASE 
      WHEN _is_call_center THEN c.address
      WHEN _is_branch AND _order_branch_id = _user_branch_id THEN c.address
      ELSE NULL
    END,
    (
      SELECT jsonb_agg(jsonb_build_object(
        'id', oi.id,
        'product_name', oi.product_name,
        'quantity', oi.quantity,
        'unit_price', oi.unit_price,
        'total_price', oi.total_price,
        'notes', oi.notes
      ))
      FROM public.order_items oi
      WHERE oi.order_id = o.id
    )
  FROM public.orders o
  LEFT JOIN public.branches b ON o.branch_id = b.id
  LEFT JOIN public.customers c ON o.customer_id = c.id
  WHERE o.id = _order_id
    AND (
      _is_admin 
      OR _is_call_center 
      OR _is_kitchen
      OR (_is_branch AND _order_branch_id = _user_branch_id)
    );
END;
$$;