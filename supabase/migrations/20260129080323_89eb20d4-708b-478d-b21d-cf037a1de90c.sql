-- Add pickup-related columns to orders table
ALTER TABLE public.orders 
ADD COLUMN IF NOT EXISTS pickup_code text UNIQUE,
ADD COLUMN IF NOT EXISTS pickup_at timestamp with time zone,
ADD COLUMN IF NOT EXISTS picked_up_by uuid;

-- Create index for pickup_code lookups
CREATE INDEX IF NOT EXISTS idx_orders_pickup_code ON public.orders(pickup_code) WHERE pickup_code IS NOT NULL;

-- Function to generate secure pickup code when order becomes ready_for_pickup
CREATE OR REPLACE FUNCTION public.generate_pickup_code()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Only generate when status changes TO ready_for_pickup
  IF NEW.status = 'ready_for_pickup' AND (OLD.status IS NULL OR OLD.status != 'ready_for_pickup') THEN
    -- Generate a secure, non-guessable code: prefix + random hex + order partial
    NEW.pickup_code := 'PU-' || encode(gen_random_bytes(8), 'hex') || '-' || SUBSTRING(NEW.id::text, 1, 4);
    
    -- Log the generation
    INSERT INTO public.order_logs (order_id, action, description, performed_by)
    VALUES (NEW.id, 'pickup_code_generated', 'تم إنشاء كود الاستلام', auth.uid());
  END IF;
  
  -- Clear pickup code if status changes away from ready_for_pickup/completed
  IF NEW.status NOT IN ('ready_for_pickup', 'completed') AND OLD.pickup_code IS NOT NULL THEN
    NEW.pickup_code := NULL;
  END IF;
  
  RETURN NEW;
END;
$$;

-- Create trigger for pickup code generation
DROP TRIGGER IF EXISTS generate_pickup_code_trigger ON public.orders;
CREATE TRIGGER generate_pickup_code_trigger
BEFORE UPDATE ON public.orders
FOR EACH ROW
EXECUTE FUNCTION public.generate_pickup_code();

-- Function to get pickup code for customer (only their own orders, only when ready)
CREATE OR REPLACE FUNCTION public.get_my_pickup_code(_order_id uuid)
RETURNS text
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _code text;
  _customer_id uuid;
BEGIN
  _customer_id := public.get_my_customer_id();
  
  IF _customer_id IS NULL THEN
    RETURN NULL;
  END IF;
  
  SELECT pickup_code INTO _code
  FROM public.orders
  WHERE id = _order_id
    AND customer_id = _customer_id
    AND status = 'ready_for_pickup'
    AND pickup_code IS NOT NULL;
  
  -- Log the view (only if code exists)
  IF _code IS NOT NULL THEN
    INSERT INTO public.order_logs (order_id, action, description, performed_by)
    VALUES (_order_id, 'pickup_code_viewed', 'تم عرض كود الاستلام للعميل', auth.uid());
  END IF;
  
  RETURN _code;
END;
$$;

-- Function for branch manager to validate and process pickup
CREATE OR REPLACE FUNCTION public.process_pickup_by_code(_pickup_code text)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _user_id uuid;
  _user_branch_id uuid;
  _order_record record;
  _user_name text;
  _result jsonb;
BEGIN
  _user_id := auth.uid();
  
  -- Verify user is a branch manager
  IF NOT public.has_role(_user_id, 'branch') THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'غير مصرح لك بتأكيد الاستلام',
      'error_code', 'UNAUTHORIZED'
    );
  END IF;
  
  -- Get user's branch
  _user_branch_id := public.get_user_branch_id(_user_id);
  
  IF _user_branch_id IS NULL THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'لم يتم تعيين فرع لحسابك',
      'error_code', 'NO_BRANCH_ASSIGNED'
    );
  END IF;
  
  -- Find the order
  SELECT o.id, o.order_number, o.status, o.branch_id, o.pickup_code, o.pickup_at, b.name as branch_name
  INTO _order_record
  FROM public.orders o
  LEFT JOIN public.branches b ON b.id = o.branch_id
  WHERE o.pickup_code = _pickup_code;
  
  -- Check if order exists
  IF _order_record.id IS NULL THEN
    -- Log failed attempt
    INSERT INTO public.order_logs (order_id, action, description, performed_by)
    SELECT id, 'pickup_scan_failed', 'محاولة مسح كود غير صالح: ' || _pickup_code, _user_id
    FROM public.orders LIMIT 1; -- Log to any order as reference
    
    RETURN jsonb_build_object(
      'success', false,
      'error', 'كود الاستلام غير صالح',
      'error_code', 'INVALID_CODE'
    );
  END IF;
  
  -- Check if already picked up
  IF _order_record.status = 'completed' THEN
    INSERT INTO public.order_logs (order_id, action, description, performed_by)
    VALUES (_order_record.id, 'pickup_scan_failed', 'محاولة مسح طلب مستلم مسبقاً', _user_id);
    
    RETURN jsonb_build_object(
      'success', false,
      'error', 'تم استلام هذا الطلب مسبقاً',
      'error_code', 'ALREADY_PICKED_UP',
      'order_number', _order_record.order_number
    );
  END IF;
  
  -- Check order status
  IF _order_record.status != 'ready_for_pickup' THEN
    INSERT INTO public.order_logs (order_id, action, description, performed_by)
    VALUES (_order_record.id, 'pickup_scan_failed', 'محاولة مسح طلب غير جاهز للاستلام - الحالة: ' || _order_record.status::text, _user_id);
    
    RETURN jsonb_build_object(
      'success', false,
      'error', 'الطلب غير جاهز للاستلام بعد',
      'error_code', 'NOT_READY',
      'order_number', _order_record.order_number,
      'current_status', _order_record.status
    );
  END IF;
  
  -- Check branch match
  IF _order_record.branch_id != _user_branch_id THEN
    INSERT INTO public.order_logs (order_id, action, description, performed_by)
    VALUES (_order_record.id, 'pickup_scan_failed', 'محاولة مسح من فرع آخر', _user_id);
    
    RETURN jsonb_build_object(
      'success', false,
      'error', 'هذا الطلب مخصص لفرع آخر: ' || _order_record.branch_name,
      'error_code', 'WRONG_BRANCH',
      'order_number', _order_record.order_number
    );
  END IF;
  
  -- Get user name for logging
  SELECT full_name INTO _user_name FROM public.profiles WHERE id = _user_id;
  
  -- All checks passed - complete the pickup
  UPDATE public.orders
  SET 
    status = 'completed',
    pickup_at = NOW(),
    picked_up_by = _user_id
  WHERE id = _order_record.id;
  
  -- Log successful pickup
  INSERT INTO public.order_logs (order_id, action, description, performed_by)
  VALUES (
    _order_record.id, 
    'pickup_completed', 
    'تم تأكيد الاستلام بواسطة: ' || COALESCE(_user_name, 'غير معروف'),
    _user_id
  );
  
  RETURN jsonb_build_object(
    'success', true,
    'order_id', _order_record.id,
    'order_number', _order_record.order_number,
    'pickup_at', NOW(),
    'confirmed_by', _user_name
  );
END;
$$;

-- Function for branch to get order details by pickup code (for preview before confirming)
CREATE OR REPLACE FUNCTION public.get_order_by_pickup_code(_pickup_code text)
RETURNS TABLE(
  id uuid,
  order_number text,
  status order_status,
  customer_name text,
  total_amount numeric,
  items jsonb,
  branch_id uuid,
  branch_name text,
  can_process boolean,
  error_message text
)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _user_id uuid;
  _user_branch_id uuid;
BEGIN
  _user_id := auth.uid();
  
  -- Verify user is a branch manager
  IF NOT public.has_role(_user_id, 'branch') THEN
    RETURN QUERY SELECT 
      NULL::uuid, NULL::text, NULL::order_status, NULL::text, 
      NULL::numeric, NULL::jsonb, NULL::uuid, NULL::text, 
      false, 'غير مصرح لك بهذه العملية'::text;
    RETURN;
  END IF;
  
  _user_branch_id := public.get_user_branch_id(_user_id);
  
  RETURN QUERY
  SELECT 
    o.id,
    o.order_number,
    o.status,
    c.name as customer_name,
    o.total_amount,
    (
      SELECT jsonb_agg(jsonb_build_object(
        'product_name', oi.product_name,
        'quantity', oi.quantity,
        'total_price', oi.total_price
      ))
      FROM public.order_items oi
      WHERE oi.order_id = o.id
    ) as items,
    o.branch_id,
    b.name as branch_name,
    CASE 
      WHEN o.status = 'ready_for_pickup' AND o.branch_id = _user_branch_id THEN true
      ELSE false
    END as can_process,
    CASE
      WHEN o.id IS NULL THEN 'كود غير صالح'
      WHEN o.status = 'completed' THEN 'تم الاستلام مسبقاً'
      WHEN o.status != 'ready_for_pickup' THEN 'الطلب غير جاهز للاستلام'
      WHEN o.branch_id != _user_branch_id THEN 'هذا الطلب لفرع آخر'
      ELSE NULL
    END as error_message
  FROM public.orders o
  LEFT JOIN public.customers c ON c.id = o.customer_id
  LEFT JOIN public.branches b ON b.id = o.branch_id
  WHERE o.pickup_code = _pickup_code;
END;
$$;