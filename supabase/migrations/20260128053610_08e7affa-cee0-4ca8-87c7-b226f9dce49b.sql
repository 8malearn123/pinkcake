-- Migration 2: Create secure functions and RLS policies for customers

-- Function to check if user is a customer
CREATE OR REPLACE FUNCTION public.is_customer(_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT public.has_role(_user_id, 'customer')
$$;

-- Function to get customer ID for authenticated user
CREATE OR REPLACE FUNCTION public.get_my_customer_id()
RETURNS uuid
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT id FROM public.customers WHERE user_id = auth.uid() LIMIT 1
$$;

-- Secure function for customers to get their own orders (no sensitive data)
CREATE OR REPLACE FUNCTION public.get_my_orders()
RETURNS TABLE(
  id uuid,
  order_number text,
  status order_status,
  total_amount numeric,
  delivery_date date,
  delivery_time time,
  created_at timestamptz,
  branch_name text,
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
    o.total_amount,
    o.delivery_date,
    o.delivery_time,
    o.created_at,
    b.name as branch_name,
    (
      SELECT jsonb_agg(jsonb_build_object(
        'product_name', oi.product_name,
        'quantity', oi.quantity,
        'unit_price', oi.unit_price,
        'total_price', oi.total_price
      ))
      FROM public.order_items oi
      WHERE oi.order_id = o.id
    ) as items
  FROM public.orders o
  LEFT JOIN public.branches b ON o.branch_id = b.id
  WHERE o.customer_id = public.get_my_customer_id()
  ORDER BY o.created_at DESC
$$;

-- Secure function for customers to get single order details (no sensitive data)
CREATE OR REPLACE FUNCTION public.get_my_order_details(_order_id uuid)
RETURNS TABLE(
  id uuid,
  order_number text,
  status order_status,
  total_amount numeric,
  delivery_date date,
  delivery_time time,
  created_at timestamptz,
  updated_at timestamptz,
  branch_name text,
  branch_address text,
  payment_status text,
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
    o.total_amount,
    o.delivery_date,
    o.delivery_time,
    o.created_at,
    o.updated_at,
    b.name as branch_name,
    b.address as branch_address,
    -- Only show payment status, NOT payment link
    CASE 
      WHEN o.payment_status = 'paid' THEN 'paid'
      ELSE 'pending'
    END as payment_status,
    (
      SELECT jsonb_agg(jsonb_build_object(
        'id', oi.id,
        'product_name', oi.product_name,
        'quantity', oi.quantity,
        'unit_price', oi.unit_price,
        'total_price', oi.total_price
      ))
      FROM public.order_items oi
      WHERE oi.order_id = o.id
    ) as items
  FROM public.orders o
  LEFT JOIN public.branches b ON o.branch_id = b.id
  WHERE o.id = _order_id
    AND o.customer_id = public.get_my_customer_id()
$$;

-- Secure function for customers to get products (only active ones)
CREATE OR REPLACE FUNCTION public.get_products_for_store()
RETURNS TABLE(
  id uuid,
  name text,
  description text,
  price numeric,
  category text,
  image_url text
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT 
    id,
    name,
    description,
    price,
    category,
    image_url
  FROM public.products
  WHERE is_active = true
  ORDER BY display_order ASC, name ASC
$$;

-- Secure function for customers to create orders
CREATE OR REPLACE FUNCTION public.create_customer_order(
  _branch_id uuid,
  _delivery_date date,
  _delivery_time time,
  _items jsonb
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _customer_id uuid;
  _order_id uuid;
  _order_number text;
  _total_amount numeric := 0;
  _item jsonb;
BEGIN
  -- Get customer ID for authenticated user
  _customer_id := public.get_my_customer_id();
  
  IF _customer_id IS NULL THEN
    RAISE EXCEPTION 'Customer account not found';
  END IF;
  
  -- Generate order number
  _order_number := 'ORD-' || TO_CHAR(NOW(), 'YYYYMMDD') || '-' || LPAD(FLOOR(RANDOM() * 10000)::TEXT, 4, '0');
  
  -- Calculate total amount
  FOR _item IN SELECT * FROM jsonb_array_elements(_items)
  LOOP
    _total_amount := _total_amount + ((_item->>'quantity')::int * (_item->>'unit_price')::numeric);
  END LOOP;
  
  -- Create the order
  INSERT INTO public.orders (
    order_number,
    customer_id,
    branch_id,
    delivery_date,
    delivery_time,
    total_amount,
    status,
    payment_status
  ) VALUES (
    _order_number,
    _customer_id,
    _branch_id,
    _delivery_date,
    _delivery_time,
    _total_amount,
    'pending_approval',
    'unpaid'
  ) RETURNING id INTO _order_id;
  
  -- Create order items
  FOR _item IN SELECT * FROM jsonb_array_elements(_items)
  LOOP
    INSERT INTO public.order_items (
      order_id,
      product_id,
      product_name,
      quantity,
      unit_price,
      total_price
    ) VALUES (
      _order_id,
      (_item->>'product_id')::uuid,
      _item->>'product_name',
      (_item->>'quantity')::int,
      (_item->>'unit_price')::numeric,
      (_item->>'quantity')::int * (_item->>'unit_price')::numeric
    );
  END LOOP;
  
  RETURN _order_id;
END;
$$;

-- RLS policies for customers to view their own orders
CREATE POLICY "Customers can view their own orders"
ON public.orders
FOR SELECT
TO authenticated
USING (
  public.is_customer(auth.uid()) 
  AND customer_id = public.get_my_customer_id()
);

-- RLS policies for customers to view their own order items
CREATE POLICY "Customers can view their own order items"
ON public.order_items
FOR SELECT
TO authenticated
USING (
  public.is_customer(auth.uid()) 
  AND EXISTS (
    SELECT 1 FROM public.orders o 
    WHERE o.id = order_items.order_id 
    AND o.customer_id = public.get_my_customer_id()
  )
);

-- Customers can view their own profile in customers table
CREATE POLICY "Customers can view their own customer profile"
ON public.customers
FOR SELECT
TO authenticated
USING (
  user_id = auth.uid()
);

-- Customers can update their own customer profile
CREATE POLICY "Customers can update their own customer profile"
ON public.customers
FOR UPDATE
TO authenticated
USING (user_id = auth.uid());

-- Enable realtime for orders (for customer order tracking)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime' AND tablename = 'orders'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.orders;
  END IF;
END $$;