
-- =====================================================
-- COMPREHENSIVE SECURITY FIX FOR CUSTOMERS TABLE
-- =====================================================

-- Drop existing permissive policies that may allow unintended access
DROP POLICY IF EXISTS "Customers can only see own record" ON public.customers;
DROP POLICY IF EXISTS "Admin can update any customer" ON public.customers;
DROP POLICY IF EXISTS "Customers can update own profile" ON public.customers;
DROP POLICY IF EXISTS "Only admins can delete customers" ON public.customers;
DROP POLICY IF EXISTS "Staff can create customers for new users" ON public.customers;

-- Create a RESTRICTIVE policy that blocks ALL authenticated users by default
-- This ensures that even if other permissive policies exist, they must ALSO satisfy this
CREATE POLICY "Block unauthorized customer access"
ON public.customers AS RESTRICTIVE
FOR SELECT
TO authenticated
USING (
  -- Only allow if user is admin, call_center, or viewing their own record
  public.is_admin(auth.uid()) 
  OR public.has_role(auth.uid(), 'call_center'::app_role)
  OR (user_id IS NOT NULL AND user_id = auth.uid())
);

-- Customers can only see their own record (via user_id match)
CREATE POLICY "Customers view own record only"
ON public.customers
FOR SELECT
TO authenticated
USING (user_id IS NOT NULL AND user_id = auth.uid());

-- Admin full access
CREATE POLICY "Admin full customer access"
ON public.customers
FOR ALL
TO authenticated
USING (public.is_admin(auth.uid()))
WITH CHECK (public.is_admin(auth.uid()));

-- Call center can view and update customers (for order creation)
CREATE POLICY "Call center view customers"
ON public.customers
FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'call_center'::app_role));

CREATE POLICY "Call center update customers"
ON public.customers
FOR UPDATE
TO authenticated
USING (public.has_role(auth.uid(), 'call_center'::app_role))
WITH CHECK (public.has_role(auth.uid(), 'call_center'::app_role));

-- Customers can update their own profile
CREATE POLICY "Customer update own profile"
ON public.customers
FOR UPDATE
TO authenticated
USING (user_id IS NOT NULL AND user_id = auth.uid())
WITH CHECK (user_id IS NOT NULL AND user_id = auth.uid());

-- Staff can create customers for order creation
CREATE POLICY "Staff create customers"
ON public.customers
FOR INSERT
TO authenticated
WITH CHECK (
  public.is_admin(auth.uid()) 
  OR public.has_role(auth.uid(), 'call_center'::app_role) 
  OR (user_id = auth.uid() AND public.has_role(auth.uid(), 'customer'::app_role))
);

-- =====================================================
-- CONTACT SUBMISSIONS SECURITY FIX
-- =====================================================

-- Drop and recreate restrictive policy for contact_submissions
DROP POLICY IF EXISTS "Deny unauthorized SELECT on contact submissions" ON public.contact_submissions;

-- Create RESTRICTIVE policy that blocks all authenticated users except authorized roles
CREATE POLICY "Block unauthorized contact submission access"
ON public.contact_submissions AS RESTRICTIVE
FOR SELECT
TO authenticated
USING (
  public.is_admin(auth.uid()) 
  OR public.has_role(auth.uid(), 'call_center'::app_role) 
  OR public.has_role(auth.uid(), 'customer_support'::app_role)
);

-- =====================================================
-- PROFILES TABLE SECURITY ENHANCEMENT
-- =====================================================

-- Add RESTRICTIVE policy to profiles to ensure only own profile is accessible
DROP POLICY IF EXISTS "Strict profile access - own only" ON public.profiles;

CREATE POLICY "Block unauthorized profile access"
ON public.profiles AS RESTRICTIVE
FOR SELECT
TO authenticated
USING (
  id = auth.uid() 
  OR public.is_admin(auth.uid())
);

-- Users can only view their own profile
CREATE POLICY "Users view own profile"
ON public.profiles
FOR SELECT
TO authenticated
USING (id = auth.uid());

-- =====================================================
-- CREATE MASKED PHONE ACCESS FUNCTION
-- =====================================================

-- Function to get masked phone number (for employees who need partial visibility)
CREATE OR REPLACE FUNCTION public.get_masked_customer_phone(_customer_id uuid)
RETURNS text
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _phone text;
  _user_id uuid;
  _can_access boolean := false;
BEGIN
  _user_id := auth.uid();
  
  IF _user_id IS NULL THEN
    RETURN NULL;
  END IF;
  
  -- Check if user has permission to see masked phone
  IF public.is_admin(_user_id) 
     OR public.has_role(_user_id, 'call_center') 
     OR public.has_role(_user_id, 'customer_support') THEN
    _can_access := true;
  END IF;
  
  -- Branch managers can see masked phone for their branch orders only
  IF public.has_role(_user_id, 'branch') THEN
    IF EXISTS (
      SELECT 1 FROM public.orders o
      WHERE o.customer_id = _customer_id
      AND o.branch_id = public.get_user_branch_id(_user_id)
    ) THEN
      _can_access := true;
    END IF;
  END IF;
  
  IF NOT _can_access THEN
    RETURN NULL;
  END IF;
  
  SELECT phone INTO _phone FROM public.customers WHERE id = _customer_id;
  
  IF _phone IS NULL OR LENGTH(_phone) < 4 THEN
    RETURN NULL;
  END IF;
  
  -- Return masked phone: first 2 chars + *** + last 3 chars
  RETURN SUBSTRING(_phone, 1, 2) || '***' || SUBSTRING(_phone, LENGTH(_phone) - 2);
END;
$$;

-- =====================================================
-- SECURE CONTACT SUBMISSION ACCESS FUNCTION
-- =====================================================

-- Function to get contact submissions with proper role check
CREATE OR REPLACE FUNCTION public.get_contact_submissions_secure()
RETURNS TABLE(
  id uuid,
  customer_name text,
  phone text,
  email text,
  message text,
  submission_type text,
  status text,
  internal_notes text,
  assigned_to uuid,
  created_at timestamptz,
  updated_at timestamptz
)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Only allow admin, call_center, customer_support
  IF NOT (
    public.is_admin(auth.uid()) 
    OR public.has_role(auth.uid(), 'call_center') 
    OR public.has_role(auth.uid(), 'customer_support')
  ) THEN
    RETURN;
  END IF;
  
  RETURN QUERY
  SELECT 
    cs.id,
    cs.customer_name,
    -- Mask phone for customer_support, full access for admin/call_center
    CASE 
      WHEN public.is_admin(auth.uid()) OR public.has_role(auth.uid(), 'call_center')
      THEN cs.phone
      ELSE SUBSTRING(cs.phone, 1, 2) || '***' || SUBSTRING(cs.phone, LENGTH(cs.phone) - 2)
    END as phone,
    -- Mask email for customer_support
    CASE 
      WHEN public.is_admin(auth.uid()) OR public.has_role(auth.uid(), 'call_center')
      THEN cs.email
      ELSE SUBSTRING(cs.email, 1, 3) || '***@***'
    END as email,
    cs.message,
    cs.submission_type,
    cs.status,
    cs.internal_notes,
    cs.assigned_to,
    cs.created_at,
    cs.updated_at
  FROM public.contact_submissions cs
  ORDER BY cs.created_at DESC;
END;
$$;
