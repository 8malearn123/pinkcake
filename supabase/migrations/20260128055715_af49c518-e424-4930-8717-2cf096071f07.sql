-- Create product_reviews table
CREATE TABLE public.product_reviews (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  customer_id UUID NOT NULL REFERENCES public.customers(id) ON DELETE CASCADE,
  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  review_text TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(product_id, customer_id) -- One review per customer per product
);

-- Enable RLS
ALTER TABLE public.product_reviews ENABLE ROW LEVEL SECURITY;

-- Everyone can view reviews
CREATE POLICY "Anyone can view reviews"
ON public.product_reviews
FOR SELECT
USING (auth.uid() IS NOT NULL);

-- Customers can create their own reviews
CREATE POLICY "Customers can create reviews"
ON public.product_reviews
FOR INSERT
WITH CHECK (
  public.is_customer(auth.uid()) 
  AND customer_id = public.get_my_customer_id()
);

-- Customers can update their own reviews
CREATE POLICY "Customers can update own reviews"
ON public.product_reviews
FOR UPDATE
USING (
  public.is_customer(auth.uid()) 
  AND customer_id = public.get_my_customer_id()
);

-- Customers can delete their own reviews
CREATE POLICY "Customers can delete own reviews"
ON public.product_reviews
FOR DELETE
USING (
  public.is_customer(auth.uid()) 
  AND customer_id = public.get_my_customer_id()
);

-- Function to get product reviews with customer names
CREATE OR REPLACE FUNCTION public.get_product_reviews(_product_id uuid)
RETURNS TABLE(
  id uuid,
  rating integer,
  review_text text,
  created_at timestamp with time zone,
  customer_name text
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT 
    pr.id,
    pr.rating,
    pr.review_text,
    pr.created_at,
    c.name as customer_name
  FROM public.product_reviews pr
  JOIN public.customers c ON c.id = pr.customer_id
  WHERE pr.product_id = _product_id
  ORDER BY pr.created_at DESC
$$;

-- Function to get average rating for a product
CREATE OR REPLACE FUNCTION public.get_product_rating(_product_id uuid)
RETURNS TABLE(
  average_rating numeric,
  review_count bigint
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT 
    COALESCE(ROUND(AVG(rating)::numeric, 1), 0) as average_rating,
    COUNT(*) as review_count
  FROM public.product_reviews
  WHERE product_id = _product_id
$$;

-- Function to create a review
CREATE OR REPLACE FUNCTION public.create_product_review(
  _product_id uuid,
  _rating integer,
  _review_text text DEFAULT NULL
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _customer_id uuid;
  _review_id uuid;
BEGIN
  _customer_id := public.get_my_customer_id();
  
  IF _customer_id IS NULL THEN
    RAISE EXCEPTION 'Customer account not found';
  END IF;
  
  IF _rating < 1 OR _rating > 5 THEN
    RAISE EXCEPTION 'Rating must be between 1 and 5';
  END IF;
  
  INSERT INTO public.product_reviews (product_id, customer_id, rating, review_text)
  VALUES (_product_id, _customer_id, _rating, _review_text)
  ON CONFLICT (product_id, customer_id) 
  DO UPDATE SET rating = _rating, review_text = _review_text
  RETURNING id INTO _review_id;
  
  RETURN _review_id;
END;
$$;

-- Function to check if customer has reviewed a product
CREATE OR REPLACE FUNCTION public.get_my_product_review(_product_id uuid)
RETURNS TABLE(
  id uuid,
  rating integer,
  review_text text
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT id, rating, review_text
  FROM public.product_reviews
  WHERE product_id = _product_id
    AND customer_id = public.get_my_customer_id()
$$;