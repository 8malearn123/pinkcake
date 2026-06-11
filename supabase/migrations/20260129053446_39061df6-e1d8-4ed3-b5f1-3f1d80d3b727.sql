-- Create function to register a new customer (called after auth signup)
-- This creates the customer record and assigns the customer role
CREATE OR REPLACE FUNCTION public.register_customer_after_signup(
  _name text,
  _phone text,
  _address text DEFAULT NULL
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _user_id uuid;
  _customer_id uuid;
BEGIN
  _user_id := auth.uid();
  
  IF _user_id IS NULL THEN
    RAISE EXCEPTION 'يجب تسجيل الدخول أولاً';
  END IF;
  
  -- Check if user already has customer role
  IF EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = 'customer') THEN
    -- Get existing customer ID
    SELECT id INTO _customer_id FROM public.customers WHERE user_id = _user_id;
    RETURN _customer_id;
  END IF;
  
  -- Validate inputs
  IF _name IS NULL OR trim(_name) = '' THEN
    RAISE EXCEPTION 'الاسم مطلوب';
  END IF;
  
  IF _phone IS NULL OR trim(_phone) = '' THEN
    RAISE EXCEPTION 'رقم الجوال مطلوب';
  END IF;
  
  -- Create customer record
  INSERT INTO public.customers (user_id, name, phone, address)
  VALUES (_user_id, trim(_name), trim(_phone), NULLIF(trim(COALESCE(_address, '')), ''))
  RETURNING id INTO _customer_id;
  
  -- Assign customer role
  INSERT INTO public.user_roles (user_id, role)
  VALUES (_user_id, 'customer')
  ON CONFLICT (user_id, role) DO NOTHING;
  
  RETURN _customer_id;
END;
$$;

-- Allow products to be viewed by anyone (including anonymous for store browsing)
DROP POLICY IF EXISTS "Deny anonymous access to products" ON public.products;
DROP POLICY IF EXISTS "Authenticated users can view products" ON public.products;
DROP POLICY IF EXISTS "Anyone can view active products" ON public.products;

CREATE POLICY "Anyone can view active products"
ON public.products
FOR SELECT
USING (is_active = true);

-- Allow branches to be viewed for store selection (public data only)
DROP POLICY IF EXISTS "Anyone can view branch basics" ON public.branches;

CREATE POLICY "Anyone can view branch basics"
ON public.branches
FOR SELECT
USING (true);