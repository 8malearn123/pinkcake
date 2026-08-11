-- تمكين الفرع من إنشاء الطلبات بحالاتها الثلاث (عادي / مخصص / ضيافة مناسبة)،
-- وحفظ تصميم الكيك المرفق بالطلب المخصص.
--
-- الفرع يستقبل العملاء وجهاً لوجه، فيحتاج نفس ما يملكه مركز الاتصال لإنشاء
-- الطلب: الاستعلام عن العميل، إنشاء/تحديث بياناته، إنشاء طلب عادي بأصنافه،
-- وإنشاء طلب مخصص (مع تصميم كيك مبني من نفس كتالوج الاستوديو).

-- ── 1) العميل: بحث وإنشاء ───────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.search_customer_by_phone(_phone text)
RETURNS TABLE(id uuid, name text, phone text, address text)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _user_id uuid;
  _user_name text;
  _digits text;
BEGIN
  _user_id := auth.uid();

  IF NOT (
    public.is_admin(_user_id)
    OR public.has_role(_user_id, 'call_center')
    OR public.has_role(_user_id, 'branch')
  ) THEN
    RAISE EXCEPTION 'غير مصرح لك بالبحث عن العملاء';
  END IF;

  _digits := right(regexp_replace(COALESCE(_phone, ''), '\D', '', 'g'), 9);

  -- رقم غير مكتمل: لا نتيجة، ولا وصول يستحق التسجيل
  IF length(_digits) < 9 THEN
    RETURN;
  END IF;

  SELECT full_name INTO _user_name FROM public.profiles WHERE id = _user_id;

  INSERT INTO public.admin_data_access_logs (
    admin_id, admin_name, admin_role, action_type, resource_type, resource_id, justification
  ) VALUES (
    _user_id,
    _user_name,
    CASE
      WHEN public.is_admin(_user_id) THEN 'admin'
      WHEN public.has_role(_user_id, 'call_center') THEN 'call_center'
      ELSE 'branch'
    END,
    'searched_customer',
    'customer',
    NULL,
    'Phone search: ' || LEFT(_phone, 3) || '***'
  );

  RETURN QUERY
  SELECT c.id, c.name, c.phone, c.address
  FROM public.customers c
  WHERE right(regexp_replace(c.phone, '\D', '', 'g'), 9) = _digits
  LIMIT 1;
END;
$$;

CREATE OR REPLACE FUNCTION public.upsert_customer_by_phone(_name text, _phone text, _address text DEFAULT NULL::text)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _user_id uuid;
  _user_name text;
  _customer_id uuid;
  _is_new boolean := false;
BEGIN
  _user_id := auth.uid();

  IF _user_id IS NULL THEN
    RAISE EXCEPTION 'يجب تسجيل الدخول أولاً';
  END IF;

  IF NOT (
    public.is_admin(_user_id)
    OR public.has_role(_user_id, 'call_center')
    OR public.has_role(_user_id, 'branch')
  ) THEN
    RAISE EXCEPTION 'غير مصرح لك بإدارة بيانات العملاء';
  END IF;

  IF _phone IS NULL OR trim(_phone) = '' THEN
    RAISE EXCEPTION 'رقم الجوال مطلوب';
  END IF;

  SELECT full_name INTO _user_name FROM public.profiles WHERE id = _user_id;

  SELECT id INTO _customer_id
  FROM public.customers
  WHERE right(regexp_replace(phone, '\D', '', 'g'), 9)
      = right(regexp_replace(trim(_phone), '\D', '', 'g'), 9)
  LIMIT 1;

  IF _customer_id IS NULL THEN
    INSERT INTO public.customers (name, phone, address)
    VALUES (COALESCE(NULLIF(trim(_name), ''), 'غير معروف'), trim(_phone), NULLIF(trim(COALESCE(_address, '')), ''))
    RETURNING id INTO _customer_id;
    _is_new := true;
  ELSE
    UPDATE public.customers
    SET name = COALESCE(NULLIF(trim(_name), ''), name),
        address = COALESCE(NULLIF(trim(COALESCE(_address, '')), ''), address)
    WHERE id = _customer_id;
  END IF;

  INSERT INTO public.admin_data_access_logs (
    admin_id, admin_name, admin_role, action_type, resource_type, resource_id, justification
  ) VALUES (
    _user_id,
    _user_name,
    CASE
      WHEN public.is_admin(_user_id) THEN 'admin'
      WHEN public.has_role(_user_id, 'call_center') THEN 'call_center'
      ELSE 'branch'
    END,
    CASE WHEN _is_new THEN 'created_customer' ELSE 'updated_customer' END,
    'customer',
    _customer_id,
    'Order creation - phone: ' || LEFT(trim(_phone), 3) || '***'
  );

  RETURN _customer_id;
END;
$$;

-- ── 2) الطلب العادي: إدراج الطلب وأصنافه من الفرع ───────────────────────
DROP POLICY IF EXISTS "Call center and admins can create orders" ON public.orders;
CREATE POLICY "Staff can create orders"
  ON public.orders FOR INSERT
  TO authenticated WITH CHECK (
    public.is_admin(auth.uid())
    OR public.has_role(auth.uid(), 'call_center')
    OR public.has_role(auth.uid(), 'branch')
  );

DROP POLICY IF EXISTS "Call center can insert order items for valid orders" ON public.order_items;
CREATE POLICY "Staff can insert order items for valid orders"
  ON public.order_items FOR INSERT
  WITH CHECK (
    (
      public.is_admin(auth.uid())
      OR public.has_role(auth.uid(), 'call_center')
      OR public.has_role(auth.uid(), 'branch')
    )
    AND EXISTS (
      SELECT 1 FROM public.orders o
      WHERE o.id = order_items.order_id
        AND o.status IN ('pending_approval', 'awaiting_payment')
    )
  );

-- ── 3) الطلب المخصص: تصميم الكيك + صلاحية الفرع ─────────────────────────
ALTER TABLE public.custom_order_details
  ADD COLUMN IF NOT EXISTS cake_design jsonb;

COMMENT ON COLUMN public.custom_order_details.cake_design IS
  'تصميم الكيك المبني من كتالوج الاستوديو (نفس شكل CartCakeDesign في الواجهة): المعرّفات والمسميات العربية ومفتاح الصورة.';

-- التوقيع تغيّر (بارامتر تصميم الكيك)، فنحذف القديم أولاً حتى لا يتبقى
-- تحميلان زائدان يتنازعان على نفس الاستدعاء عبر PostgREST.
DROP FUNCTION IF EXISTS public.create_custom_order(
  text, text, text, uuid, date, time, text, text, integer, text, text, text, text, text, text, uuid, text
);

CREATE FUNCTION public.create_custom_order(
  _customer_name text,
  _customer_phone text,
  _customer_address text,
  _branch_id uuid,
  _pickup_date date,
  _pickup_time time,
  _product_type text,
  _occasion text DEFAULT NULL,
  _number_of_people integer DEFAULT NULL,
  _flavor text DEFAULT NULL,
  _filling text DEFAULT NULL,
  _sugar_level text DEFAULT NULL,
  _design_description text DEFAULT NULL,
  _writing_text text DEFAULT NULL,
  _reference_image_url text DEFAULT NULL,
  _reference_order_id uuid DEFAULT NULL,
  _notes text DEFAULT NULL,
  _cake_design jsonb DEFAULT NULL
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _user_id uuid := auth.uid();
  _customer_id uuid;
  _order_id uuid;
  _order_number text;
BEGIN
  -- مركز الاتصال (وخدمة العملاء المدمجة فيه) والفرع والمدير
  IF NOT (
    is_admin(_user_id)
    OR has_role(_user_id, 'customer_support'::app_role)
    OR has_role(_user_id, 'call_center'::app_role)
    OR has_role(_user_id, 'branch'::app_role)
  ) THEN
    RAISE EXCEPTION 'غير مصرح لك بإنشاء طلب مخصص';
  END IF;

  _customer_id := public.upsert_customer_by_phone(_customer_name, _customer_phone, _customer_address);

  _order_number := 'CUST-' || to_char(now(), 'YYYYMMDD') || '-' || LPAD(floor(random() * 10000)::text, 4, '0');

  INSERT INTO orders (
    order_number, customer_id, branch_id, delivery_date, delivery_time,
    notes, status, order_type, created_by, total_amount
  ) VALUES (
    _order_number, _customer_id, _branch_id, _pickup_date, _pickup_time,
    _notes, 'custom_pending_review'::order_status, 'custom', _user_id, 0
  )
  RETURNING id INTO _order_id;

  INSERT INTO custom_order_details (
    order_id, product_type, occasion, number_of_people, flavor, filling,
    sugar_level, design_description, writing_text, reference_image_url,
    reference_order_id, cake_design
  ) VALUES (
    _order_id, _product_type, _occasion, _number_of_people, _flavor, _filling,
    _sugar_level, _design_description, _writing_text, _reference_image_url,
    _reference_order_id, _cake_design
  );

  RETURN _order_id;
END;
$$;

GRANT EXECUTE ON FUNCTION public.create_custom_order(
  text, text, text, uuid, date, time, text, text, integer, text, text, text, text, text, text, uuid, text, jsonb
) TO authenticated;

-- ── 4) المطبخ يرى التصميم مع بقية تفاصيل الطلب ──────────────────────────
DROP FUNCTION IF EXISTS public.get_custom_orders_for_review();

CREATE FUNCTION public.get_custom_orders_for_review()
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
  cake_design JSONB,
  notes TEXT,
  created_at TIMESTAMPTZ,
  status order_status
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
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
    cod.cake_design,
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

GRANT EXECUTE ON FUNCTION public.get_custom_orders_for_review() TO authenticated;
