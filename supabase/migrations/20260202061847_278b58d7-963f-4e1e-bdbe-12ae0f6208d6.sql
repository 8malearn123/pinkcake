
-- ============================================
-- 1. COMPLETE ACTIVITY LOGGING FOR ALL ORDER CHANGES
-- ============================================

-- Create a comprehensive trigger function that logs ALL order changes
CREATE OR REPLACE FUNCTION public.log_order_changes_detailed()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _user_id uuid;
  _user_name text;
  _user_role text;
  _changes jsonb := '[]'::jsonb;
  _description text := '';
BEGIN
  _user_id := auth.uid();
  
  -- Get user info
  SELECT full_name INTO _user_name FROM public.profiles WHERE id = _user_id;
  SELECT COALESCE(
    (SELECT role::text FROM public.user_roles WHERE user_id = _user_id LIMIT 1),
    'system'
  ) INTO _user_role;

  -- For INSERT
  IF TG_OP = 'INSERT' THEN
    INSERT INTO public.order_logs (order_id, action, description, performed_by)
    VALUES (NEW.id, 'order_created', 'تم إنشاء الطلب رقم ' || NEW.order_number, NEW.created_by);
    RETURN NEW;
  END IF;

  -- For UPDATE - track all field changes
  IF TG_OP = 'UPDATE' THEN
    -- Status change
    IF OLD.status IS DISTINCT FROM NEW.status THEN
      _changes := _changes || jsonb_build_object(
        'field', 'status',
        'field_ar', 'الحالة',
        'old_value', OLD.status::text,
        'new_value', NEW.status::text
      );
    END IF;

    -- Branch change
    IF OLD.branch_id IS DISTINCT FROM NEW.branch_id THEN
      DECLARE
        _old_branch text;
        _new_branch text;
      BEGIN
        SELECT name INTO _old_branch FROM public.branches WHERE id = OLD.branch_id;
        SELECT name INTO _new_branch FROM public.branches WHERE id = NEW.branch_id;
        _changes := _changes || jsonb_build_object(
          'field', 'branch_id',
          'field_ar', 'الفرع',
          'old_value', COALESCE(_old_branch, 'غير محدد'),
          'new_value', COALESCE(_new_branch, 'غير محدد')
        );
      END;
    END IF;

    -- Customer change
    IF OLD.customer_id IS DISTINCT FROM NEW.customer_id THEN
      DECLARE
        _old_customer text;
        _new_customer text;
      BEGIN
        SELECT name INTO _old_customer FROM public.customers WHERE id = OLD.customer_id;
        SELECT name INTO _new_customer FROM public.customers WHERE id = NEW.customer_id;
        _changes := _changes || jsonb_build_object(
          'field', 'customer_id',
          'field_ar', 'العميل',
          'old_value', COALESCE(_old_customer, 'غير محدد'),
          'new_value', COALESCE(_new_customer, 'غير محدد')
        );
      END;
    END IF;

    -- Total amount change
    IF OLD.total_amount IS DISTINCT FROM NEW.total_amount THEN
      _changes := _changes || jsonb_build_object(
        'field', 'total_amount',
        'field_ar', 'المبلغ الإجمالي',
        'old_value', OLD.total_amount::text || ' ر.س',
        'new_value', NEW.total_amount::text || ' ر.س'
      );
    END IF;

    -- Delivery date change
    IF OLD.delivery_date IS DISTINCT FROM NEW.delivery_date THEN
      _changes := _changes || jsonb_build_object(
        'field', 'delivery_date',
        'field_ar', 'تاريخ التسليم',
        'old_value', COALESCE(OLD.delivery_date::text, 'غير محدد'),
        'new_value', COALESCE(NEW.delivery_date::text, 'غير محدد')
      );
    END IF;

    -- Delivery time change
    IF OLD.delivery_time IS DISTINCT FROM NEW.delivery_time THEN
      _changes := _changes || jsonb_build_object(
        'field', 'delivery_time',
        'field_ar', 'وقت التسليم',
        'old_value', COALESCE(OLD.delivery_time::text, 'غير محدد'),
        'new_value', COALESCE(NEW.delivery_time::text, 'غير محدد')
      );
    END IF;

    -- Order type change
    IF OLD.order_type IS DISTINCT FROM NEW.order_type THEN
      _changes := _changes || jsonb_build_object(
        'field', 'order_type',
        'field_ar', 'نوع الطلب',
        'old_value', COALESCE(OLD.order_type, 'غير محدد'),
        'new_value', COALESCE(NEW.order_type, 'غير محدد')
      );
    END IF;

    -- Payment status change
    IF OLD.payment_status IS DISTINCT FROM NEW.payment_status THEN
      _changes := _changes || jsonb_build_object(
        'field', 'payment_status',
        'field_ar', 'حالة الدفع',
        'old_value', COALESCE(OLD.payment_status, 'غير محدد'),
        'new_value', COALESCE(NEW.payment_status, 'غير محدد')
      );
    END IF;

    -- Payment link change
    IF OLD.payment_link IS DISTINCT FROM NEW.payment_link THEN
      _changes := _changes || jsonb_build_object(
        'field', 'payment_link',
        'field_ar', 'رابط الدفع',
        'old_value', CASE WHEN OLD.payment_link IS NOT NULL THEN 'موجود' ELSE 'غير موجود' END,
        'new_value', CASE WHEN NEW.payment_link IS NOT NULL THEN 'تم التحديث' ELSE 'تم الحذف' END
      );
    END IF;

    -- Notes change
    IF OLD.notes IS DISTINCT FROM NEW.notes THEN
      _changes := _changes || jsonb_build_object(
        'field', 'notes',
        'field_ar', 'الملاحظات',
        'old_value', COALESCE(LEFT(OLD.notes, 50), 'فارغ'),
        'new_value', COALESCE(LEFT(NEW.notes, 50), 'فارغ')
      );
    END IF;

    -- Assigned driver change
    IF OLD.assigned_driver_id IS DISTINCT FROM NEW.assigned_driver_id THEN
      DECLARE
        _old_driver text;
        _new_driver text;
      BEGIN
        SELECT full_name INTO _old_driver FROM public.profiles WHERE id = OLD.assigned_driver_id;
        SELECT full_name INTO _new_driver FROM public.profiles WHERE id = NEW.assigned_driver_id;
        _changes := _changes || jsonb_build_object(
          'field', 'assigned_driver_id',
          'field_ar', 'السائق المعين',
          'old_value', COALESCE(_old_driver, 'غير معين'),
          'new_value', COALESCE(_new_driver, 'غير معين')
        );
      END;
    END IF;

    -- If there are changes, log them
    IF jsonb_array_length(_changes) > 0 THEN
      -- Build description from changes
      SELECT string_agg(
        (c->>'field_ar') || ': ' || (c->>'old_value') || ' ← ' || (c->>'new_value'),
        ' | '
      ) INTO _description
      FROM jsonb_array_elements(_changes) AS c;

      INSERT INTO public.order_logs (order_id, action, description, performed_by)
      VALUES (
        NEW.id,
        CASE 
          WHEN OLD.status IS DISTINCT FROM NEW.status THEN 'status_changed'
          ELSE 'order_updated'
        END,
        'تعديل بواسطة ' || COALESCE(_user_name, 'النظام') || ' (' || _user_role || '): ' || _description,
        _user_id
      );
    END IF;
  END IF;

  RETURN NEW;
END;
$$;

-- Drop old trigger and create new comprehensive one
DROP TRIGGER IF EXISTS log_order_changes ON public.orders;
CREATE TRIGGER log_order_changes
  AFTER INSERT OR UPDATE ON public.orders
  FOR EACH ROW
  EXECUTE FUNCTION public.log_order_changes_detailed();


-- ============================================
-- 2. LOG ORDER ITEMS CHANGES
-- ============================================

CREATE OR REPLACE FUNCTION public.log_order_items_changes()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _user_id uuid;
  _user_name text;
  _order_number text;
BEGIN
  _user_id := auth.uid();
  SELECT full_name INTO _user_name FROM public.profiles WHERE id = _user_id;

  IF TG_OP = 'INSERT' THEN
    SELECT order_number INTO _order_number FROM public.orders WHERE id = NEW.order_id;
    INSERT INTO public.order_logs (order_id, action, description, performed_by)
    VALUES (
      NEW.order_id,
      'item_added',
      'تمت إضافة منتج: ' || NEW.product_name || ' (الكمية: ' || NEW.quantity || ', السعر: ' || NEW.total_price || ' ر.س)',
      _user_id
    );
    RETURN NEW;
  END IF;

  IF TG_OP = 'UPDATE' THEN
    -- Quantity change
    IF OLD.quantity IS DISTINCT FROM NEW.quantity THEN
      INSERT INTO public.order_logs (order_id, action, description, performed_by)
      VALUES (
        NEW.order_id,
        'item_updated',
        'تعديل كمية ' || NEW.product_name || ': ' || OLD.quantity || ' ← ' || NEW.quantity,
        _user_id
      );
    END IF;

    -- Price change
    IF OLD.unit_price IS DISTINCT FROM NEW.unit_price THEN
      INSERT INTO public.order_logs (order_id, action, description, performed_by)
      VALUES (
        NEW.order_id,
        'item_price_changed',
        'تعديل سعر ' || NEW.product_name || ': ' || OLD.unit_price || ' ← ' || NEW.unit_price || ' ر.س',
        _user_id
      );
    END IF;

    -- Notes change
    IF OLD.notes IS DISTINCT FROM NEW.notes THEN
      INSERT INTO public.order_logs (order_id, action, description, performed_by)
      VALUES (
        NEW.order_id,
        'item_notes_updated',
        'تعديل ملاحظات ' || NEW.product_name,
        _user_id
      );
    END IF;

    RETURN NEW;
  END IF;

  IF TG_OP = 'DELETE' THEN
    INSERT INTO public.order_logs (order_id, action, description, performed_by)
    VALUES (
      OLD.order_id,
      'item_removed',
      'تم حذف منتج: ' || OLD.product_name || ' (الكمية: ' || OLD.quantity || ')',
      _user_id
    );
    RETURN OLD;
  END IF;

  RETURN NULL;
END;
$$;

-- Create trigger for order items
DROP TRIGGER IF EXISTS log_order_items_changes ON public.order_items;
CREATE TRIGGER log_order_items_changes
  AFTER INSERT OR UPDATE OR DELETE ON public.order_items
  FOR EACH ROW
  EXECUTE FUNCTION public.log_order_items_changes();


-- ============================================
-- 3. AUTOMATIC WORKFLOW TRANSITION ENGINE
-- ============================================

CREATE OR REPLACE FUNCTION public.auto_workflow_transition()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _should_transition boolean := false;
  _next_status order_status;
BEGIN
  -- Only process status changes
  IF OLD.status IS NOT DISTINCT FROM NEW.status THEN
    RETURN NEW;
  END IF;

  -- ========================================
  -- WORKFLOW RULE 1: PAID → PREPARING
  -- When order becomes PAID, automatically send to kitchen
  -- ========================================
  IF NEW.status = 'paid' AND OLD.status = 'awaiting_payment' THEN
    _should_transition := true;
    _next_status := 'preparing';
    
    -- Log the automatic transition
    INSERT INTO public.order_logs (order_id, action, description, performed_by)
    VALUES (
      NEW.id,
      'auto_workflow',
      'تحويل تلقائي للمطبخ: الطلب مدفوع → قيد التجهيز',
      NULL -- System action
    );
    
    -- Apply the transition
    NEW.status := _next_status;
    NEW.status_changed_at := NOW();
    NEW.status_changed_by := NULL;
    NEW.status_changed_role := 'system';
  END IF;

  -- ========================================
  -- WORKFLOW RULE 2: PENDING_APPROVAL → AWAITING_PAYMENT
  -- When admin approves, move to awaiting payment
  -- (This is optional - depends on business logic)
  -- ========================================
  -- This transition is usually manual, so we don't auto-transition

  -- ========================================
  -- WORKFLOW RULE 3: READY_TO_SHIP → IN_TRANSIT
  -- This is handled by barcode scanning
  -- ========================================

  -- ========================================
  -- WORKFLOW RULE 4: IN_TRANSIT → READY_FOR_PICKUP
  -- This is handled by barcode scanning
  -- ========================================

  RETURN NEW;
END;
$$;

-- Create trigger for automatic workflow transitions
-- Use BEFORE trigger so we can modify NEW
DROP TRIGGER IF EXISTS auto_workflow_transition ON public.orders;
CREATE TRIGGER auto_workflow_transition
  BEFORE UPDATE ON public.orders
  FOR EACH ROW
  EXECUTE FUNCTION public.auto_workflow_transition();


-- ============================================
-- 4. HELPER FUNCTION TO MANUALLY ADVANCE WORKFLOW
-- ============================================

CREATE OR REPLACE FUNCTION public.advance_order_workflow(_order_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _user_id uuid;
  _current_status order_status;
  _next_status order_status;
  _can_advance boolean := false;
  _user_role text;
BEGIN
  _user_id := auth.uid();
  
  -- Get current order status
  SELECT status INTO _current_status FROM public.orders WHERE id = _order_id;
  
  IF _current_status IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'الطلب غير موجود');
  END IF;

  -- Determine user role
  IF public.is_admin(_user_id) THEN
    _user_role := 'admin';
  ELSIF public.has_role(_user_id, 'call_center') THEN
    _user_role := 'call_center';
  ELSIF public.has_role(_user_id, 'kitchen') THEN
    _user_role := 'kitchen';
  ELSIF public.has_role(_user_id, 'branch') THEN
    _user_role := 'branch';
  ELSIF public.has_role(_user_id, 'driver') THEN
    _user_role := 'driver';
  ELSE
    RETURN jsonb_build_object('success', false, 'error', 'غير مصرح لك');
  END IF;

  -- Define workflow transitions based on role
  CASE _current_status
    WHEN 'pending_approval' THEN
      IF _user_role IN ('admin', 'call_center') THEN
        _next_status := 'awaiting_payment';
        _can_advance := true;
      END IF;
    
    WHEN 'awaiting_payment' THEN
      IF _user_role IN ('admin', 'call_center') THEN
        _next_status := 'paid';
        _can_advance := true;
      END IF;
    
    WHEN 'paid' THEN
      -- Auto-transition handled by trigger, but allow manual override
      IF _user_role IN ('admin', 'call_center') THEN
        _next_status := 'preparing';
        _can_advance := true;
      END IF;
    
    WHEN 'preparing' THEN
      IF _user_role IN ('admin', 'kitchen') THEN
        _next_status := 'ready_to_ship';
        _can_advance := true;
      END IF;
    
    WHEN 'ready_to_ship' THEN
      IF _user_role IN ('admin', 'driver') THEN
        _next_status := 'in_transit';
        _can_advance := true;
      END IF;
    
    WHEN 'in_transit' THEN
      IF _user_role IN ('admin', 'driver', 'branch') THEN
        _next_status := 'ready_for_pickup';
        _can_advance := true;
      END IF;
    
    WHEN 'ready_for_pickup' THEN
      IF _user_role IN ('admin', 'branch') THEN
        _next_status := 'completed';
        _can_advance := true;
      END IF;
    
    ELSE
      RETURN jsonb_build_object('success', false, 'error', 'الطلب في حالته النهائية');
  END CASE;

  IF NOT _can_advance THEN
    RETURN jsonb_build_object('success', false, 'error', 'غير مصرح لدورك بتقديم هذا الطلب');
  END IF;

  -- Update order status
  UPDATE public.orders
  SET 
    status = _next_status,
    status_changed_at = NOW(),
    status_changed_by = _user_id,
    status_changed_role = _user_role
  WHERE id = _order_id;

  RETURN jsonb_build_object(
    'success', true,
    'old_status', _current_status,
    'new_status', _next_status,
    'changed_by', _user_role
  );
END;
$$;
