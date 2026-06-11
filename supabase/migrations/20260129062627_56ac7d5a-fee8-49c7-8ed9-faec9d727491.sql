-- Make products publicly readable (no auth required for browsing)
DROP POLICY IF EXISTS "Authenticated users can view active products" ON public.products;

CREATE POLICY "Anyone can view active products"
ON public.products
FOR SELECT
USING (is_active = true);

-- Allow public access to branches for store (only id, name, address via RPC)
CREATE OR REPLACE FUNCTION public.get_products_for_public_store()
RETURNS TABLE(id uuid, name text, description text, price numeric, category text, image_url text)
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
  ORDER BY display_order ASC, name ASC;
$$;

-- Public branches function (no phone exposed)
CREATE OR REPLACE FUNCTION public.get_branches_for_public_store()
RETURNS TABLE(id uuid, name text, address text)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT id, name, address
  FROM public.branches;
$$;