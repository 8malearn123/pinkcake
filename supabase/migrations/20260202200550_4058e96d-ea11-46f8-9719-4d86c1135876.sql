-- =============================================
-- CUSTOM ORDER PRICING WORKFLOW - DATABASE MIGRATION
-- =============================================

-- 1. Add new order status values for the pricing workflow
-- Note: We're adding to the existing order_status enum
ALTER TYPE public.order_status ADD VALUE IF NOT EXISTS 'sent_to_chef';
ALTER TYPE public.order_status ADD VALUE IF NOT EXISTS 'chef_priced';
ALTER TYPE public.order_status ADD VALUE IF NOT EXISTS 'pricing_sent_to_customer';
ALTER TYPE public.order_status ADD VALUE IF NOT EXISTS 'customer_accepted';
ALTER TYPE public.order_status ADD VALUE IF NOT EXISTS 'customer_rejected';

-- 2. Create order_images storage bucket for custom order reference images
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'order-images',
  'order-images',
  false, -- Private bucket
  10485760, -- 10MB limit
  ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif']
) ON CONFLICT (id) DO NOTHING;

-- 3. Storage policies for order-images bucket
-- Allow customer_support to upload images
CREATE POLICY "Customer support can upload order images"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'order-images' AND
  has_role(auth.uid(), 'customer_support')
);

-- Allow admin and kitchen to view order images
CREATE POLICY "Admin and chef can view order images"
ON storage.objects FOR SELECT
TO authenticated
USING (
  bucket_id = 'order-images' AND
  (is_admin(auth.uid()) OR has_role(auth.uid(), 'kitchen'))
);

-- Allow admin to delete order images
CREATE POLICY "Admin can delete order images"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'order-images' AND
  is_admin(auth.uid())
);

-- 4. Add customer_visible_notes column to custom_order_details
-- Chef notes for customer are separate from internal chef notes
ALTER TABLE public.custom_order_details 
ADD COLUMN IF NOT EXISTS customer_visible_notes TEXT,
ADD COLUMN IF NOT EXISTS customer_response TEXT,
ADD COLUMN IF NOT EXISTS customer_response_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS pricing_sent_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS pricing_sent_by UUID;

-- 5. Create RPC function to send custom order to chef
CREATE OR REPLACE FUNCTION public.send_custom_order_to_chef(_order_id UUID)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_order_status order_status;
  v_user_id UUID := auth.uid();
  v_user_role TEXT;
BEGIN
  -- Check permissions
  IF NOT (is_admin(v_user_id) OR has_role(v_user_id, 'customer_support') OR has_role(v_user_id, 'call_center')) THEN
    RAISE EXCEPTION 'غير مصرح لك بتنفيذ هذا الإجراء';
  END IF;

  -- Get current order status
  SELECT status INTO v_order_status FROM orders WHERE id = _order_id;
  
  IF v_order_status IS NULL THEN
    RAISE EXCEPTION 'الطلب غير موجود';
  END IF;

  -- Only allow sending if status is custom_pending_review
  IF v_order_status != 'custom_pending_review' THEN
    RAISE EXCEPTION 'لا يمكن إرسال الطلب للشيف في هذه الحالة';
  END IF;

  -- Determine role for logging
  IF is_admin(v_user_id) THEN
    v_user_role := 'admin';
  ELSIF has_role(v_user_id, 'customer_support') THEN
    v_user_role := 'customer_support';
  ELSE
    v_user_role := 'call_center';
  END IF;

  -- Update order status
  UPDATE orders SET
    status = 'sent_to_chef',
    status_changed_at = NOW(),
    status_changed_by = v_user_id,
    status_changed_role = v_user_role,
    updated_at = NOW()
  WHERE id = _order_id;

  -- Log the action
  INSERT INTO order_logs (order_id, action, description, performed_by)
  VALUES (_order_id, 'send_to_chef', 'تم إرسال الطلب المخصص للشيف للتسعير', v_user_id);

  RETURN json_build_object(
    'success', true,
    'new_status', 'sent_to_chef'
  );
END;
$$;

-- 6. Update chef_review_custom_order to use new workflow
CREATE OR REPLACE FUNCTION public.chef_review_custom_order(
  _order_id UUID,
  _feasibility TEXT,
  _preparation_time TEXT,
  _proposed_price NUMERIC,
  _notes TEXT DEFAULT NULL,
  _rejection_reason TEXT DEFAULT NULL,
  _customer_notes TEXT DEFAULT NULL
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_order_status order_status;
  v_new_status order_status;
  v_user_id UUID := auth.uid();
BEGIN
  -- Check permissions - only kitchen/chef can do this
  IF NOT (is_admin(v_user_id) OR has_role(v_user_id, 'kitchen')) THEN
    RAISE EXCEPTION 'فقط الشيف يمكنه تسعير الطلبات المخصصة';
  END IF;

  -- Get current order status
  SELECT status INTO v_order_status FROM orders WHERE id = _order_id;
  
  IF v_order_status IS NULL THEN
    RAISE EXCEPTION 'الطلب غير موجود';
  END IF;

  -- Only allow review if status is sent_to_chef or custom_pending_review
  IF v_order_status NOT IN ('sent_to_chef', 'custom_pending_review') THEN
    RAISE EXCEPTION 'الطلب ليس في حالة انتظار تسعير الشيف';
  END IF;

  -- Determine new status based on feasibility
  IF _feasibility = 'not_feasible' THEN
    v_new_status := 'custom_rejected';
  ELSE
    v_new_status := 'chef_priced';
  END IF;

  -- Update custom order details
  UPDATE custom_order_details SET
    chef_feasibility = _feasibility,
    chef_preparation_time = _preparation_time,
    chef_proposed_price = _proposed_price,
    chef_notes = _notes,
    chef_rejection_reason = _rejection_reason,
    customer_visible_notes = _customer_notes,
    chef_reviewed_at = NOW(),
    chef_reviewed_by = v_user_id,
    updated_at = NOW()
  WHERE order_id = _order_id;

  -- Update order status
  UPDATE orders SET
    status = v_new_status,
    total_amount = CASE WHEN _feasibility != 'not_feasible' THEN _proposed_price ELSE total_amount END,
    status_changed_at = NOW(),
    status_changed_by = v_user_id,
    status_changed_role = 'kitchen',
    updated_at = NOW()
  WHERE id = _order_id;

  -- Log the action
  INSERT INTO order_logs (order_id, action, description, performed_by)
  VALUES (
    _order_id,
    CASE WHEN _feasibility = 'not_feasible' THEN 'chef_rejected' ELSE 'chef_priced' END,
    CASE 
      WHEN _feasibility = 'not_feasible' THEN 'رفض الشيف الطلب: ' || COALESCE(_rejection_reason, 'غير محدد')
      ELSE 'تم تسعير الطلب: ' || _proposed_price || ' ر.س'
    END,
    v_user_id
  );

  RETURN json_build_object(
    'success', true,
    'new_status', v_new_status,
    'price', _proposed_price
  );
END;
$$;

-- 7. Create function to send pricing to customer
CREATE OR REPLACE FUNCTION public.send_pricing_to_customer(_order_id UUID)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_order_status order_status;
  v_user_id UUID := auth.uid();
  v_user_role TEXT;
BEGIN
  -- Check permissions
  IF NOT (is_admin(v_user_id) OR has_role(v_user_id, 'customer_support') OR has_role(v_user_id, 'call_center')) THEN
    RAISE EXCEPTION 'غير مصرح لك بتنفيذ هذا الإجراء';
  END IF;

  -- Get current order status
  SELECT status INTO v_order_status FROM orders WHERE id = _order_id;
  
  IF v_order_status IS NULL THEN
    RAISE EXCEPTION 'الطلب غير موجود';
  END IF;

  -- Only allow if status is chef_priced
  IF v_order_status != 'chef_priced' THEN
    RAISE EXCEPTION 'يجب أن يكون الطلب مسعّراً من الشيف أولاً';
  END IF;

  -- Determine role
  IF is_admin(v_user_id) THEN
    v_user_role := 'admin';
  ELSIF has_role(v_user_id, 'customer_support') THEN
    v_user_role := 'customer_support';
  ELSE
    v_user_role := 'call_center';
  END IF;

  -- Update custom order details
  UPDATE custom_order_details SET
    pricing_sent_at = NOW(),
    pricing_sent_by = v_user_id,
    updated_at = NOW()
  WHERE order_id = _order_id;

  -- Update order status
  UPDATE orders SET
    status = 'pricing_sent_to_customer',
    status_changed_at = NOW(),
    status_changed_by = v_user_id,
    status_changed_role = v_user_role,
    updated_at = NOW()
  WHERE id = _order_id;

  -- Log the action
  INSERT INTO order_logs (order_id, action, description, performed_by)
  VALUES (_order_id, 'pricing_sent', 'تم إرسال عرض السعر للعميل', v_user_id);

  RETURN json_build_object(
    'success', true,
    'new_status', 'pricing_sent_to_customer'
  );
END;
$$;

-- 8. Create function for customer to respond to pricing
CREATE OR REPLACE FUNCTION public.customer_respond_to_pricing(
  _order_id UUID,
  _accepted BOOLEAN,
  _rejection_reason TEXT DEFAULT NULL
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_order_status order_status;
  v_customer_id UUID;
  v_my_customer_id UUID;
  v_new_status order_status;
  v_user_id UUID := auth.uid();
BEGIN
  -- Get my customer ID
  SELECT get_my_customer_id() INTO v_my_customer_id;
  
  -- Get order details
  SELECT o.status, o.customer_id 
  INTO v_order_status, v_customer_id
  FROM orders o WHERE o.id = _order_id;
  
  IF v_order_status IS NULL THEN
    RAISE EXCEPTION 'الطلب غير موجود';
  END IF;

  -- Check this is the customer's order
  IF v_customer_id != v_my_customer_id THEN
    RAISE EXCEPTION 'هذا الطلب ليس لك';
  END IF;

  -- Only allow if status is pricing_sent_to_customer
  IF v_order_status != 'pricing_sent_to_customer' THEN
    RAISE EXCEPTION 'لا يمكن الرد على السعر في هذه الحالة';
  END IF;

  -- Determine new status
  IF _accepted THEN
    v_new_status := 'awaiting_payment';
  ELSE
    v_new_status := 'customer_rejected';
  END IF;

  -- Update custom order details
  UPDATE custom_order_details SET
    customer_confirmed_price = _accepted,
    customer_confirmed_at = NOW(),
    customer_response = CASE WHEN _accepted THEN 'accepted' ELSE _rejection_reason END,
    customer_response_at = NOW(),
    updated_at = NOW()
  WHERE order_id = _order_id;

  -- Update order status
  UPDATE orders SET
    status = v_new_status,
    status_changed_at = NOW(),
    status_changed_by = v_user_id,
    status_changed_role = 'customer',
    updated_at = NOW()
  WHERE id = _order_id;

  -- Log the action
  INSERT INTO order_logs (order_id, action, description, performed_by)
  VALUES (
    _order_id,
    CASE WHEN _accepted THEN 'customer_accepted' ELSE 'customer_rejected' END,
    CASE 
      WHEN _accepted THEN 'قبل العميل عرض السعر'
      ELSE 'رفض العميل عرض السعر: ' || COALESCE(_rejection_reason, 'غير محدد')
    END,
    v_user_id
  );

  RETURN json_build_object(
    'success', true,
    'new_status', v_new_status
  );
END;
$$;

-- 9. Update get_custom_orders_for_review to include new statuses
CREATE OR REPLACE FUNCTION public.get_custom_orders_for_review()
RETURNS TABLE (
  id UUID,
  order_number TEXT,
  customer_name TEXT,
  branch_name TEXT,
  pickup_date DATE,
  pickup_time TIME,
  product_type TEXT,
  occasion TEXT,
  number_of_people INT,
  flavor TEXT,
  filling TEXT,
  sugar_level TEXT,
  design_description TEXT,
  writing_text TEXT,
  reference_image_url TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ,
  status order_status
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Only kitchen and admin can see custom orders for review
  IF NOT (is_admin(auth.uid()) OR has_role(auth.uid(), 'kitchen')) THEN
    RAISE EXCEPTION 'غير مصرح لك بعرض هذه البيانات';
  END IF;

  RETURN QUERY
  SELECT 
    o.id,
    o.order_number,
    get_customer_name_only(o.customer_id) AS customer_name,
    b.name AS branch_name,
    o.delivery_date AS pickup_date,
    o.delivery_time AS pickup_time,
    cod.product_type,
    cod.occasion,
    cod.number_of_people,
    cod.flavor,
    cod.filling,
    cod.sugar_level,
    cod.design_description,
    cod.writing_text,
    cod.reference_image_url,
    o.notes,
    o.created_at,
    o.status
  FROM orders o
  JOIN custom_order_details cod ON cod.order_id = o.id
  LEFT JOIN branches b ON b.id = o.branch_id
  WHERE o.status IN ('custom_pending_review', 'sent_to_chef')
  ORDER BY o.created_at ASC;
END;
$$;

-- 10. Create function to get pending pricing orders for customer support
CREATE OR REPLACE FUNCTION public.get_priced_orders_for_support()
RETURNS TABLE (
  id UUID,
  order_number TEXT,
  customer_name TEXT,
  branch_name TEXT,
  pickup_date DATE,
  pickup_time TIME,
  product_type TEXT,
  chef_proposed_price NUMERIC,
  chef_preparation_time TEXT,
  customer_visible_notes TEXT,
  created_at TIMESTAMPTZ,
  chef_reviewed_at TIMESTAMPTZ,
  status order_status
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Only support, call center and admin can see
  IF NOT (is_admin(auth.uid()) OR has_role(auth.uid(), 'customer_support') OR has_role(auth.uid(), 'call_center')) THEN
    RAISE EXCEPTION 'غير مصرح لك بعرض هذه البيانات';
  END IF;

  RETURN QUERY
  SELECT 
    o.id,
    o.order_number,
    get_customer_name_only(o.customer_id) AS customer_name,
    b.name AS branch_name,
    o.delivery_date AS pickup_date,
    o.delivery_time AS pickup_time,
    cod.product_type,
    cod.chef_proposed_price,
    cod.chef_preparation_time,
    cod.customer_visible_notes,
    o.created_at,
    cod.chef_reviewed_at,
    o.status
  FROM orders o
  JOIN custom_order_details cod ON cod.order_id = o.id
  LEFT JOIN branches b ON b.id = o.branch_id
  WHERE o.status = 'chef_priced'
  ORDER BY cod.chef_reviewed_at ASC;
END;
$$;

-- 11. Create function for customers to view their pending pricing
CREATE OR REPLACE FUNCTION public.get_my_pricing_requests()
RETURNS TABLE (
  id UUID,
  order_number TEXT,
  branch_name TEXT,
  pickup_date DATE,
  pickup_time TIME,
  product_type TEXT,
  occasion TEXT,
  proposed_price NUMERIC,
  preparation_time TEXT,
  chef_notes TEXT,
  pricing_sent_at TIMESTAMPTZ,
  status order_status
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_customer_id UUID;
BEGIN
  SELECT get_my_customer_id() INTO v_customer_id;
  
  IF v_customer_id IS NULL THEN
    RETURN;
  END IF;

  RETURN QUERY
  SELECT 
    o.id,
    o.order_number,
    b.name AS branch_name,
    o.delivery_date AS pickup_date,
    o.delivery_time AS pickup_time,
    cod.product_type,
    cod.occasion,
    cod.chef_proposed_price AS proposed_price,
    cod.chef_preparation_time AS preparation_time,
    cod.customer_visible_notes AS chef_notes,
    cod.pricing_sent_at,
    o.status
  FROM orders o
  JOIN custom_order_details cod ON cod.order_id = o.id
  LEFT JOIN branches b ON b.id = o.branch_id
  WHERE o.customer_id = v_customer_id
    AND o.status = 'pricing_sent_to_customer'
  ORDER BY cod.pricing_sent_at DESC;
END;
$$;

-- 12. Grant execute permissions
GRANT EXECUTE ON FUNCTION public.send_custom_order_to_chef(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.chef_review_custom_order(UUID, TEXT, TEXT, NUMERIC, TEXT, TEXT, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.send_pricing_to_customer(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.customer_respond_to_pricing(UUID, BOOLEAN, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_custom_orders_for_review() TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_priced_orders_for_support() TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_my_pricing_requests() TO authenticated;