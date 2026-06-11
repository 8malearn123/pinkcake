-- Add rich_description column to products table if it doesn't exist
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS rich_description text;

-- Create product_options table if not exists
CREATE TABLE IF NOT EXISTS public.product_options (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id uuid NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  option_name text NOT NULL,
  option_type text NOT NULL DEFAULT 'single',
  is_required boolean NOT NULL DEFAULT false,
  display_order integer DEFAULT 0,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Create product_option_values table if not exists
CREATE TABLE IF NOT EXISTS public.product_option_values (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  option_id uuid NOT NULL REFERENCES public.product_options(id) ON DELETE CASCADE,
  value_name text NOT NULL,
  price_adjustment numeric NOT NULL DEFAULT 0,
  is_available boolean NOT NULL DEFAULT true,
  display_order integer DEFAULT 0,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Create product_images table if not exists
CREATE TABLE IF NOT EXISTS public.product_images (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id uuid NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  image_url text NOT NULL,
  is_primary boolean NOT NULL DEFAULT false,
  display_order integer DEFAULT 0,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Create contact_submissions table if not exists
CREATE TABLE IF NOT EXISTS public.contact_submissions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  submission_type text NOT NULL CHECK (submission_type IN ('contact', 'custom_order', 'complaint')),
  customer_name text NOT NULL,
  phone text NOT NULL,
  email text,
  message text NOT NULL,
  status text NOT NULL DEFAULT 'new' CHECK (status IN ('new', 'in_progress', 'closed')),
  internal_notes text,
  assigned_to uuid,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.product_options ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.product_option_values ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.product_images ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.contact_submissions ENABLE ROW LEVEL SECURITY;

-- Product options policies
DROP POLICY IF EXISTS "Anyone can view product options" ON public.product_options;
CREATE POLICY "Anyone can view product options"
  ON public.product_options FOR SELECT
  USING (true);

DROP POLICY IF EXISTS "Admins can manage product options" ON public.product_options;
CREATE POLICY "Admins can manage product options"
  ON public.product_options FOR ALL
  USING (public.is_admin(auth.uid()))
  WITH CHECK (public.is_admin(auth.uid()));

-- Product option values policies
DROP POLICY IF EXISTS "Anyone can view option values" ON public.product_option_values;
CREATE POLICY "Anyone can view option values"
  ON public.product_option_values FOR SELECT
  USING (true);

DROP POLICY IF EXISTS "Admins can manage option values" ON public.product_option_values;
CREATE POLICY "Admins can manage option values"
  ON public.product_option_values FOR ALL
  USING (public.is_admin(auth.uid()))
  WITH CHECK (public.is_admin(auth.uid()));

-- Product images policies
DROP POLICY IF EXISTS "Anyone can view product images" ON public.product_images;
CREATE POLICY "Anyone can view product images"
  ON public.product_images FOR SELECT
  USING (true);

DROP POLICY IF EXISTS "Admins can manage product images" ON public.product_images;
CREATE POLICY "Admins can manage product images"
  ON public.product_images FOR ALL
  USING (public.is_admin(auth.uid()))
  WITH CHECK (public.is_admin(auth.uid()));

-- Contact submissions policies
DROP POLICY IF EXISTS "Admins can manage all submissions" ON public.contact_submissions;
CREATE POLICY "Admins can manage all submissions"
  ON public.contact_submissions FOR ALL
  USING (public.is_admin(auth.uid()))
  WITH CHECK (public.is_admin(auth.uid()));

DROP POLICY IF EXISTS "Customer support can view submissions" ON public.contact_submissions;
CREATE POLICY "Customer support can view submissions"
  ON public.contact_submissions FOR SELECT
  USING (public.has_role(auth.uid(), 'customer_support'));

DROP POLICY IF EXISTS "Customer support can update submissions" ON public.contact_submissions;
CREATE POLICY "Customer support can update submissions"
  ON public.contact_submissions FOR UPDATE
  USING (public.has_role(auth.uid(), 'customer_support'))
  WITH CHECK (public.has_role(auth.uid(), 'customer_support'));

DROP POLICY IF EXISTS "Call center can view submissions" ON public.contact_submissions;
CREATE POLICY "Call center can view submissions"
  ON public.contact_submissions FOR SELECT
  USING (public.has_role(auth.uid(), 'call_center'));

DROP POLICY IF EXISTS "Call center can update submissions" ON public.contact_submissions;
CREATE POLICY "Call center can update submissions"
  ON public.contact_submissions FOR UPDATE
  USING (public.has_role(auth.uid(), 'call_center'))
  WITH CHECK (public.has_role(auth.uid(), 'call_center'));

DROP POLICY IF EXISTS "Anyone can submit contact forms" ON public.contact_submissions;
CREATE POLICY "Anyone can submit contact forms"
  ON public.contact_submissions FOR INSERT
  WITH CHECK (true);

-- Trigger to update updated_at on contact_submissions
DROP TRIGGER IF EXISTS update_contact_submissions_updated_at ON public.contact_submissions;
CREATE TRIGGER update_contact_submissions_updated_at
  BEFORE UPDATE ON public.contact_submissions
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();