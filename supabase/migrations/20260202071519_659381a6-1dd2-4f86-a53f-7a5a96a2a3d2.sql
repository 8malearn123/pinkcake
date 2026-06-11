-- Create a secure function that enforces barcode workflow before advancing order status
-- Kitchen CANNOT mark order as in_transit without barcode being scanned

-- Function to advance order from preparing -> ready_to_ship (no barcode needed, barcode is generated here)
CREATE OR REPLACE FUNCTION public.kitchen_mark_order_ready(_order_id uuid)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _order RECORD;
  _barcode_code text;
BEGIN
  -- Get the order
  SELECT * INTO _order FROM orders WHERE id = _order_id;
  
  IF NOT FOUND THEN
    RETURN json_build_object('success', false, 'error', 'الطلب غير موجود');
  END IF;
  
  -- Check if user has kitchen or admin role
  IF NOT (is_admin(auth.uid()) OR has_role(auth.uid(), 'kitchen')) THEN
    RETURN json_build_object('success', false, 'error', 'غير مصرح لك بهذا الإجراء');
  END IF;
  
  -- Check order is in preparing status
  IF _order.status != 'preparing' THEN
    RETURN json_build_object('success', false, 'error', 'حالة الطلب يجب أن تكون "قيد التجهيز"');
  END IF;
  
  -- Update order status to ready_to_ship
  UPDATE orders 
  SET status = 'ready_to_ship',
      status_changed_at = now(),
      status_changed_by = auth.uid(),
      status_changed_role = 'kitchen'
  WHERE id = _order_id;
  
  -- Generate kitchen handover barcode automatically
  _barcode_code := 'KH-' || substring(gen_random_uuid()::text, 1, 8) || '-' || 
                   to_char(now(), 'YYMMDD');
  
  INSERT INTO handover_barcodes (order_id, barcode_code, barcode_type, expires_at)
  VALUES (_order_id, _barcode_code, 'kitchen_handover', now() + interval '24 hours');
  
  -- Log the action
  INSERT INTO order_logs (order_id, action, description, performed_by)
  VALUES (_order_id, 'kitchen_ready', 'تم تجهيز الطلب وإنشاء باركود التسليم للسائق', auth.uid());
  
  RETURN json_build_object(
    'success', true, 
    'message', 'تم تجهيز الطلب وإنشاء باركود التسليم',
    'barcode_code', _barcode_code
  );
END;
$$;

-- Function to send order to branch - REQUIRES barcode to be scanned first
CREATE OR REPLACE FUNCTION public.kitchen_send_to_branch(_order_id uuid)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _order RECORD;
  _barcode RECORD;
BEGIN
  -- Get the order
  SELECT * INTO _order FROM orders WHERE id = _order_id;
  
  IF NOT FOUND THEN
    RETURN json_build_object('success', false, 'error', 'الطلب غير موجود');
  END IF;
  
  -- Check if user has kitchen or admin role
  IF NOT (is_admin(auth.uid()) OR has_role(auth.uid(), 'kitchen')) THEN
    RETURN json_build_object('success', false, 'error', 'غير مصرح لك بهذا الإجراء');
  END IF;
  
  -- Check order is in ready_to_ship status
  IF _order.status != 'ready_to_ship' THEN
    RETURN json_build_object('success', false, 'error', 'حالة الطلب يجب أن تكون "جاهز للإرسال"');
  END IF;
  
  -- CRITICAL: Check if kitchen handover barcode was scanned
  SELECT * INTO _barcode 
  FROM handover_barcodes 
  WHERE order_id = _order_id 
    AND barcode_type = 'kitchen_handover'
    AND scanned = true
  ORDER BY scanned_at DESC
  LIMIT 1;
  
  IF NOT FOUND THEN
    RETURN json_build_object(
      'success', false, 
      'error', 'يجب على السائق مسح باركود التسليم أولاً قبل إرسال الطلب للفرع',
      'error_code', 'BARCODE_NOT_SCANNED'
    );
  END IF;
  
  -- Update order status to in_transit
  UPDATE orders 
  SET status = 'in_transit',
      handover_from_kitchen = true,
      handover_kitchen_time = now(),
      handover_kitchen_by_driver = _barcode.scanned_by,
      status_changed_at = now(),
      status_changed_by = auth.uid(),
      status_changed_role = 'kitchen'
  WHERE id = _order_id;
  
  -- Generate branch handover barcode for driver
  INSERT INTO handover_barcodes (order_id, barcode_code, barcode_type, expires_at)
  VALUES (
    _order_id, 
    'BH-' || substring(gen_random_uuid()::text, 1, 8) || '-' || to_char(now(), 'YYMMDD'),
    'branch_handover', 
    now() + interval '24 hours'
  );
  
  -- Log the action
  INSERT INTO order_logs (order_id, action, description, performed_by)
  VALUES (_order_id, 'sent_to_branch', 'تم إرسال الطلب للفرع بعد مسح الباركود من السائق', auth.uid());
  
  RETURN json_build_object('success', true, 'message', 'تم إرسال الطلب للفرع');
END;
$$;

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION public.kitchen_mark_order_ready(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.kitchen_send_to_branch(uuid) TO authenticated;