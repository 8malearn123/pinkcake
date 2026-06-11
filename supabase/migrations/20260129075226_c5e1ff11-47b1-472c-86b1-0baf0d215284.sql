-- Function to get products with options for store
CREATE OR REPLACE FUNCTION public.get_product_with_options(_product_id uuid)
RETURNS TABLE(
  id uuid,
  name text,
  description text,
  rich_description text,
  price numeric,
  category text,
  image_url text,
  images jsonb,
  options jsonb
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT 
    p.id,
    p.name,
    p.description,
    p.rich_description,
    p.price,
    p.category,
    p.image_url,
    COALESCE(
      (SELECT jsonb_agg(jsonb_build_object(
        'id', pi.id,
        'image_url', pi.image_url,
        'is_primary', pi.is_primary,
        'display_order', pi.display_order
      ) ORDER BY pi.display_order)
      FROM public.product_images pi
      WHERE pi.product_id = p.id),
      '[]'::jsonb
    ) as images,
    COALESCE(
      (SELECT jsonb_agg(jsonb_build_object(
        'id', po.id,
        'option_name', po.option_name,
        'option_type', po.option_type,
        'is_required', po.is_required,
        'display_order', po.display_order,
        'values', (
          SELECT jsonb_agg(jsonb_build_object(
            'id', pov.id,
            'value_name', pov.value_name,
            'price_adjustment', pov.price_adjustment,
            'is_available', pov.is_available
          ) ORDER BY pov.display_order)
          FROM public.product_option_values pov
          WHERE pov.option_id = po.id AND pov.is_available = true
        )
      ) ORDER BY po.display_order)
      FROM public.product_options po
      WHERE po.product_id = p.id),
      '[]'::jsonb
    ) as options
  FROM public.products p
  WHERE p.id = _product_id AND p.is_active = true;
$$;

-- Function for customer support to access orders (view only)
CREATE OR REPLACE FUNCTION public.get_orders_for_support()
RETURNS TABLE(
  id uuid,
  order_number text,
  status order_status,
  total_amount numeric,
  delivery_date date,
  delivery_time time without time zone,
  created_at timestamp with time zone,
  branch_name text,
  customer_name text
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
    c.name as customer_name
  FROM public.orders o
  LEFT JOIN public.branches b ON o.branch_id = b.id
  LEFT JOIN public.customers c ON o.customer_id = c.id
  WHERE public.has_role(auth.uid(), 'customer_support')
  ORDER BY o.created_at DESC;
$$;

-- Customer support order viewing policy
DROP POLICY IF EXISTS "Customer support can view orders" ON public.orders;
CREATE POLICY "Customer support can view orders"
  ON public.orders FOR SELECT
  USING (public.has_role(auth.uid(), 'customer_support'));

-- Customer support order items viewing policy
DROP POLICY IF EXISTS "Customer support can view order items" ON public.order_items;
CREATE POLICY "Customer support can view order items"
  ON public.order_items FOR SELECT
  USING (public.has_role(auth.uid(), 'customer_support'));

-- Function to check if user has support access
CREATE OR REPLACE FUNCTION public.has_support_access(_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT public.is_admin(_user_id) 
    OR public.has_role(_user_id, 'call_center') 
    OR public.has_role(_user_id, 'customer_support')
$$;