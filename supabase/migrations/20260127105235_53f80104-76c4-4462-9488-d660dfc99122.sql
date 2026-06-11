-- Add display_order column to products table for custom sorting
ALTER TABLE public.products 
ADD COLUMN display_order integer DEFAULT 0;

-- Update existing products with their current order based on created_at
WITH ordered AS (
  SELECT id, ROW_NUMBER() OVER (ORDER BY created_at ASC) as rn
  FROM public.products
)
UPDATE public.products p
SET display_order = o.rn
FROM ordered o
WHERE p.id = o.id;