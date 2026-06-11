-- Function to get customer profile
CREATE OR REPLACE FUNCTION public.get_my_customer_profile()
RETURNS TABLE(
  id uuid,
  name text,
  phone text,
  address text
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT id, name, phone, address
  FROM public.customers
  WHERE user_id = auth.uid()
  LIMIT 1
$$;

-- Function to update customer profile
CREATE OR REPLACE FUNCTION public.update_my_customer_profile(
  _name text,
  _phone text,
  _address text DEFAULT NULL
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _customer_id uuid;
BEGIN
  _customer_id := public.get_my_customer_id();
  
  IF _customer_id IS NULL THEN
    RAISE EXCEPTION 'Customer account not found';
  END IF;
  
  -- Validate inputs
  IF _name IS NULL OR trim(_name) = '' THEN
    RAISE EXCEPTION 'Name is required';
  END IF;
  
  IF _phone IS NULL OR trim(_phone) = '' THEN
    RAISE EXCEPTION 'Phone is required';
  END IF;
  
  UPDATE public.customers
  SET 
    name = trim(_name),
    phone = trim(_phone),
    address = NULLIF(trim(_address), '')
  WHERE id = _customer_id;
  
  RETURN true;
END;
$$;