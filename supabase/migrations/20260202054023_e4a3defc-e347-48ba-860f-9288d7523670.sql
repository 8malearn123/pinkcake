-- Function to generate handover barcode
CREATE OR REPLACE FUNCTION public.generate_handover_barcode(
  _order_id uuid,
  _barcode_type text
)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _user_id uuid;
  _barcode_code text;
  _order_status order_status;
  _can_generate boolean := false;
BEGIN
  _user_id := auth.uid();
  
  -- Get current order status
  SELECT status INTO _order_status FROM public.orders WHERE id = _order_id;
  
  IF _order_status IS NULL THEN
    RAISE EXCEPTION 'الطلب غير موجود';
  END IF;
  
  -- Check permissions based on barcode type
  CASE _barcode_type
    WHEN 'kitchen_handover' THEN
      -- Kitchen generates when order is ready_to_ship
      IF public.has_role(_user_id, 'kitchen') AND _order_status = 'ready_to_ship' THEN
        _can_generate := true;
      ELSIF public.is_admin(_user_id) THEN
        _can_generate := true;
      END IF;
    WHEN 'branch_handover' THEN
      -- System generates after kitchen handover confirmed
      IF public.has_role(_user_id, 'driver') OR public.is_admin(_user_id) THEN
        _can_generate := true;
      END IF;
    WHEN 'customer_delivery' THEN
      -- System generates for home delivery orders
      IF public.is_admin(_user_id) OR public.has_role(_user_id, 'driver') THEN
        _can_generate := true;
      END IF;
    ELSE
      RAISE EXCEPTION 'نوع الباركود غير صالح';
  END CASE;
  
  IF NOT _can_generate THEN
    RAISE EXCEPTION 'غير مصرح لك بإنشاء هذا الباركود';
  END IF;
  
  -- Check if barcode already exists
  SELECT barcode_code INTO _barcode_code
  FROM public.handover_barcodes
  WHERE order_id = _order_id AND barcode_type = _barcode_type AND is_valid = true AND scanned = false;
  
  IF _barcode_code IS NOT NULL THEN
    RETURN _barcode_code;
  END IF;
  
  -- Generate new barcode with type prefix
  _barcode_code := UPPER(REPLACE(_barcode_type, '_', '-')) || '-' || encode(gen_random_bytes(12), 'hex') || '-' || SUBSTRING(_order_id::text, 1, 8);
  
  INSERT INTO public.handover_barcodes (order_id, barcode_type, barcode_code, expires_at)
  VALUES (_order_id, _barcode_type, _barcode_code, NOW() + INTERVAL '24 hours')
  ON CONFLICT (order_id, barcode_type) DO UPDATE SET 
    barcode_code = EXCLUDED.barcode_code,
    generated_at = NOW(),
    expires_at = NOW() + INTERVAL '24 hours',
    scanned = false,
    is_valid = true;
  
  RETURN _barcode_code;
END;
$$;

-- Function to get handover barcode for an order
CREATE OR REPLACE FUNCTION public.get_handover_barcode(_order_id uuid, _barcode_type text)
RETURNS text
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _user_id uuid;
  _barcode_code text;
  _can_view boolean := false;
BEGIN
  _user_id := auth.uid();
  
  -- Check permissions based on barcode type and user role
  CASE _barcode_type
    WHEN 'kitchen_handover' THEN
      _can_view := public.has_role(_user_id, 'kitchen') OR public.is_admin(_user_id);
    WHEN 'branch_handover' THEN
      _can_view := public.has_role(_user_id, 'driver') OR public.is_admin(_user_id);
    WHEN 'customer_delivery' THEN
      IF public.has_role(_user_id, 'customer') THEN
        -- Customer can only see their own delivery barcode
        _can_view := EXISTS (
          SELECT 1 FROM public.orders 
          WHERE id = _order_id AND customer_id = public.get_my_customer_id()
        );
      ELSE
        _can_view := public.is_admin(_user_id);
      END IF;
    ELSE
      RETURN NULL;
  END CASE;
  
  IF NOT _can_view THEN
    RETURN NULL;
  END IF;
  
  SELECT barcode_code INTO _barcode_code
  FROM public.handover_barcodes
  WHERE order_id = _order_id 
    AND barcode_type = _barcode_type 
    AND is_valid = true 
    AND scanned = false;
  
  RETURN _barcode_code;
END;
$$;

-- Function to scan and validate handover barcode
CREATE OR REPLACE FUNCTION public.scan_handover_barcode(_barcode_code text)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _user_id uuid;
  _user_role text;
  _user_name text;
  _barcode_record record;
  _order_record record;
  _expected_role text;
  _new_status order_status;
BEGIN
  _user_id := auth.uid();
  
  -- Get user info
  SELECT full_name INTO _user_name FROM public.profiles WHERE id = _user_id;
  
  -- Determine user's primary role for this operation
  IF public.has_role(_user_id, 'driver') THEN
    _user_role := 'driver';
  ELSIF public.has_role(_user_id, 'branch') THEN
    _user_role := 'branch';
  ELSIF public.is_admin(_user_id) THEN
    _user_role := 'admin';
  ELSE
    RETURN jsonb_build_object('success', false, 'error', 'غير مصرح لك بمسح الباركود', 'error_code', 'UNAUTHORIZED');
  END IF;
  
  -- Find barcode
  SELECT * INTO _barcode_record
  FROM public.handover_barcodes
  WHERE barcode_code = _barcode_code;
  
  IF _barcode_record IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'الباركود غير صالح', 'error_code', 'INVALID_BARCODE');
  END IF;
  
  -- Get order info
  SELECT * INTO _order_record FROM public.orders WHERE id = _barcode_record.order_id;
  
  -- Check if already scanned
  IF _barcode_record.scanned THEN
    INSERT INTO public.barcode_scan_logs (order_id, barcode_type, barcode_code, scanned_by, scanned_by_role, scan_result, rejection_reason)
    VALUES (_barcode_record.order_id, _barcode_record.barcode_type, _barcode_code, _user_id, _user_role, 'rejected_already_used', 'الباركود مستخدم مسبقاً');
    
    RETURN jsonb_build_object('success', false, 'error', 'تم استخدام هذا الباركود مسبقاً', 'error_code', 'ALREADY_USED');
  END IF;
  
  -- Check if expired
  IF _barcode_record.expires_at IS NOT NULL AND _barcode_record.expires_at < NOW() THEN
    INSERT INTO public.barcode_scan_logs (order_id, barcode_type, barcode_code, scanned_by, scanned_by_role, scan_result, rejection_reason)
    VALUES (_barcode_record.order_id, _barcode_record.barcode_type, _barcode_code, _user_id, _user_role, 'rejected_expired', 'الباركود منتهي الصلاحية');
    
    RETURN jsonb_build_object('success', false, 'error', 'انتهت صلاحية الباركود', 'error_code', 'EXPIRED');
  END IF;
  
  -- Validate role matches barcode type and determine new status
  CASE _barcode_record.barcode_type
    WHEN 'kitchen_handover' THEN
      _expected_role := 'driver';
      _new_status := 'in_transit';
    WHEN 'branch_handover' THEN
      _expected_role := 'branch';
      _new_status := 'ready_for_pickup';
    WHEN 'customer_delivery' THEN
      _expected_role := 'driver';
      _new_status := 'completed';
    ELSE
      RETURN jsonb_build_object('success', false, 'error', 'نوع باركود غير معروف', 'error_code', 'UNKNOWN_TYPE');
  END CASE;
  
  -- Admin can scan anything, others must match role
  IF _user_role != 'admin' AND _user_role != _expected_role THEN
    INSERT INTO public.barcode_scan_logs (order_id, barcode_type, barcode_code, scanned_by, scanned_by_role, scan_result, rejection_reason)
    VALUES (_barcode_record.order_id, _barcode_record.barcode_type, _barcode_code, _user_id, _user_role, 'rejected_wrong_role', 'الدور غير مطابق');
    
    RETURN jsonb_build_object('success', false, 'error', 'غير مصرح لدورك بمسح هذا النوع من الباركود', 'error_code', 'WRONG_ROLE');
  END IF;
  
  -- For branch handover, verify branch matches
  IF _barcode_record.barcode_type = 'branch_handover' AND _user_role = 'branch' THEN
    IF _order_record.branch_id != public.get_user_branch_id(_user_id) THEN
      INSERT INTO public.barcode_scan_logs (order_id, barcode_type, barcode_code, scanned_by, scanned_by_role, scan_result, rejection_reason)
      VALUES (_barcode_record.order_id, _barcode_record.barcode_type, _barcode_code, _user_id, _user_role, 'rejected_wrong_role', 'الطلب لفرع آخر');
      
      RETURN jsonb_build_object('success', false, 'error', 'هذا الطلب مخصص لفرع آخر', 'error_code', 'WRONG_BRANCH');
    END IF;
  END IF;
  
  -- All checks passed - process the scan
  UPDATE public.handover_barcodes
  SET scanned = true, scanned_at = NOW(), scanned_by = _user_id, scanned_by_role = _user_role, is_valid = false
  WHERE id = _barcode_record.id;
  
  -- Update order based on barcode type
  CASE _barcode_record.barcode_type
    WHEN 'kitchen_handover' THEN
      UPDATE public.orders
      SET status = _new_status,
          handover_from_kitchen = true,
          handover_kitchen_time = NOW(),
          handover_kitchen_by_driver = _user_id
      WHERE id = _barcode_record.order_id;
      
    WHEN 'branch_handover' THEN
      UPDATE public.orders
      SET status = _new_status,
          handover_to_branch = true,
          handover_branch_time = NOW(),
          handover_branch_by = _user_id
      WHERE id = _barcode_record.order_id;
      
    WHEN 'customer_delivery' THEN
      UPDATE public.orders
      SET status = _new_status,
          delivered = true,
          delivered_time = NOW(),
          delivered_by_driver = _user_id
      WHERE id = _barcode_record.order_id;
  END CASE;
  
  -- Log successful scan
  INSERT INTO public.barcode_scan_logs (order_id, barcode_type, barcode_code, scanned_by, scanned_by_role, scan_result)
  VALUES (_barcode_record.order_id, _barcode_record.barcode_type, _barcode_code, _user_id, _user_role, 'success');
  
  -- Log in order_logs
  INSERT INTO public.order_logs (order_id, action, description, performed_by)
  VALUES (
    _barcode_record.order_id,
    'barcode_scanned',
    'تم مسح باركود ' || 
    CASE _barcode_record.barcode_type 
      WHEN 'kitchen_handover' THEN 'تسليم المطبخ'
      WHEN 'branch_handover' THEN 'تسليم الفرع'
      WHEN 'customer_delivery' THEN 'تسليم العميل'
    END || ' بواسطة ' || COALESCE(_user_name, 'غير معروف'),
    _user_id
  );
  
  RETURN jsonb_build_object(
    'success', true,
    'order_id', _barcode_record.order_id,
    'order_number', _order_record.order_number,
    'barcode_type', _barcode_record.barcode_type,
    'new_status', _new_status,
    'scanned_by', _user_name,
    'scanned_at', NOW()
  );
END;
$$;

-- Function for admin to change order status with reason
CREATE OR REPLACE FUNCTION public.admin_change_order_status(
  _order_id uuid,
  _new_status order_status,
  _reason text
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _user_id uuid;
  _user_name text;
  _old_status order_status;
BEGIN
  _user_id := auth.uid();
  
  -- Only admin can use this function
  IF NOT public.is_admin(_user_id) THEN
    RAISE EXCEPTION 'فقط المدير يمكنه تغيير حالة الطلب';
  END IF;
  
  -- Reason is mandatory
  IF _reason IS NULL OR trim(_reason) = '' THEN
    RAISE EXCEPTION 'سبب التغيير مطلوب';
  END IF;
  
  -- Get user name and old status
  SELECT full_name INTO _user_name FROM public.profiles WHERE id = _user_id;
  SELECT status INTO _old_status FROM public.orders WHERE id = _order_id;
  
  IF _old_status IS NULL THEN
    RAISE EXCEPTION 'الطلب غير موجود';
  END IF;
  
  -- Update order
  UPDATE public.orders
  SET status = _new_status,
      status_changed_by = _user_id,
      status_changed_role = 'admin',
      status_changed_at = NOW(),
      admin_override = true,
      admin_override_reason = _reason
  WHERE id = _order_id;
  
  -- Log the action
  INSERT INTO public.order_logs (order_id, action, description, performed_by)
  VALUES (
    _order_id,
    'admin_status_override',
    'تغيير حالة الطلب بواسطة المدير من ' || _old_status::text || ' إلى ' || _new_status::text || ' - السبب: ' || _reason,
    _user_id
  );
  
  RETURN true;
END;
$$;

-- Function to get driver's assigned orders (using existing statuses only)
CREATE OR REPLACE FUNCTION public.get_driver_orders()
RETURNS TABLE(
  id uuid,
  order_number text,
  status order_status,
  branch_name text,
  branch_address text,
  delivery_date date,
  delivery_time time,
  order_type text,
  handover_from_kitchen boolean,
  handover_to_branch boolean,
  customer_name text,
  total_amount numeric,
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
    b.name as branch_name,
    b.address as branch_address,
    o.delivery_date,
    o.delivery_time,
    o.order_type,
    o.handover_from_kitchen,
    o.handover_to_branch,
    c.name as customer_name,
    o.total_amount,
    (
      SELECT jsonb_agg(jsonb_build_object(
        'product_name', oi.product_name,
        'quantity', oi.quantity
      ))
      FROM public.order_items oi
      WHERE oi.order_id = o.id
    ) as items
  FROM public.orders o
  LEFT JOIN public.branches b ON o.branch_id = b.id
  LEFT JOIN public.customers c ON o.customer_id = c.id
  WHERE (o.assigned_driver_id = auth.uid() OR o.assigned_driver_id IS NULL)
    AND o.status IN ('ready_to_ship', 'in_transit', 'ready_for_pickup')
    AND public.has_role(auth.uid(), 'driver')
  ORDER BY o.created_at DESC;
$$;