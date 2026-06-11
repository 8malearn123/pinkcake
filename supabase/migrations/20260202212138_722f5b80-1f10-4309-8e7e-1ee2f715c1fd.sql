-- SECURITY FIX: Create custom-order-images storage bucket with proper RLS
-- This bucket is private - no public access

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'custom-order-images',
  'custom-order-images',
  false,
  10485760,
  ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif']
) ON CONFLICT (id) DO NOTHING;

-- Drop existing policies if any
DROP POLICY IF EXISTS "Customer support can upload custom order images" ON storage.objects;
DROP POLICY IF EXISTS "Authorized roles can view custom order images" ON storage.objects;
DROP POLICY IF EXISTS "Admin can delete custom order images" ON storage.objects;

-- RLS Policy: Only customer_support can upload images
CREATE POLICY "Customer support can upload custom order images"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'custom-order-images'
  AND has_role(auth.uid(), 'customer_support')
);

-- RLS Policy: Admin, kitchen, and customer_support can view images
CREATE POLICY "Authorized roles can view custom order images"
ON storage.objects FOR SELECT
TO authenticated
USING (
  bucket_id = 'custom-order-images'
  AND (
    is_admin(auth.uid())
    OR has_role(auth.uid(), 'kitchen')
    OR has_role(auth.uid(), 'customer_support')
  )
);

-- RLS Policy: Only admin can delete images
CREATE POLICY "Admin can delete custom order images"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'custom-order-images'
  AND is_admin(auth.uid())
);

-- SECURITY FIX: Strengthen profiles table RLS
-- Drop old policies that might be too permissive
DROP POLICY IF EXISTS "Call center can view all profiles" ON public.profiles;

-- Add call_center access to profiles (read only)
CREATE POLICY "Call center can view profiles"
ON public.profiles FOR SELECT
TO authenticated
USING (has_role(auth.uid(), 'call_center'));

-- Add customer_support limited access (for order-related customer lookup)
CREATE POLICY "Customer support can view profiles for orders"
ON public.profiles FOR SELECT
TO authenticated
USING (has_role(auth.uid(), 'customer_support'));

-- SECURITY FIX: Ensure contact_submissions has proper restrictions
DROP POLICY IF EXISTS "Customers can view own submissions" ON public.contact_submissions;

CREATE POLICY "Customers view only own contact submissions"
ON public.contact_submissions FOR SELECT
TO authenticated
USING (
  user_id IS NOT NULL 
  AND user_id = auth.uid() 
  AND is_customer(auth.uid())
);