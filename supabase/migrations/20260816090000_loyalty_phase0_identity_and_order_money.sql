-- المرحلة صفر من برنامج «دائرة المناسبات»: توحيد هوية العميل، وفتح تفصيل المبالغ
-- في الطلب، وتسجيل الموافقات.
--
-- لماذا هذه المرحلة أولاً؟ لأن كل ما بعدها يعتمد عليها:
--
--   ١) هوية العميل = رقم الجوال. المطابقة كانت على «آخر ٩ خانات» داخل كل دالة
--      على حدة، وهي تفشل صامتةً مع الأرقام العربية-الهندية (٠٥٠١٢٣٤٥٦٧) التي
--      تُلصق من واتساب: `regexp_replace(phone,'\D','')` لا يسقطها بشكل موثوق،
--      فيُنشأ عميل ثانٍ بنفس الرقم. أي رصيد ولاء مبني على هوية مزدوجة خاطئ من
--      أساسه — لذلك نُنشئ دالة توحيد واحدة، وعموداً محسوباً، وفهرساً فريداً.
--
--   ٢) الطلب لا يحمل إلا `total_amount`. الواجهة ترسل أصلاً `_delivery_fee`
--      و`_discount` و`_coupon_code` و`_payment_method` إلى `create_customer_order`
--      وتُسقَط جميعها بصمت. المكافآت تُحتسب على **المجموع قبل التوصيل والخصم**،
--      فلا بد من تخزين التفصيل.
--
--   ٣) نظام حماية البيانات الشخصية (PDPL) م.٢٦: التسويق مشروط بموافقة مأخوذة
--      مباشرةً من صاحب البيانات. نفصل ثلاث موافقات ولا نجمعها في خانة واحدة.

-- ── ١) توحيد رقم الجوال ──────────────────────────────────────────────────
--
-- تقبل: 05XXXXXXXX · 5XXXXXXXX · 9665XXXXXXXX · +9665XXXXXXXX · 009665XXXXXXXX
-- وبأرقام لاتينية أو عربية-هندية (٠-٩) أو فارسية (۰-۹)، ومع مسافات وشرطات
-- وأقواس وعلامات اتجاه النص. تُعيد E.164 أو NULL إن لم يكن جوالاً سعودياً.
--
-- IMMUTABLE لأن العمود المحسوب أدناه يشترط ذلك.
CREATE OR REPLACE FUNCTION public.normalize_msisdn(_raw text)
RETURNS text
LANGUAGE plpgsql
IMMUTABLE
PARALLEL SAFE
AS $$
DECLARE
  _digits text;
  _nsn text;
BEGIN
  IF _raw IS NULL THEN
    RETURN NULL;
  END IF;

  -- توحيد الأرقام العربية-الهندية والفارسية إلى لاتينية، ثم إسقاط كل ما ليس رقماً.
  _digits := regexp_replace(
    translate(_raw, '٠١٢٣٤٥٦٧٨٩۰۱۲۳۴۵۶۷۸۹', '01234567890123456789'),
    '[^0-9]', '', 'g'
  );

  IF length(_digits) < 9 THEN
    RETURN NULL;
  END IF;

  -- الرقم الوطني = آخر ٩ خانات (يغطي كل البادئات أعلاه).
  _nsn := right(_digits, 9);

  -- جوال سعودي صالح: يبدأ بـ ٥ ويليه ٨ أرقام. الهواتف الثابتة تُعيد NULL عمداً —
  -- الفهرس الفريد أدناه جزئي، فلا تتعارض القيم الفارغة.
  IF _nsn !~ '^5[0-9]{8}$' THEN
    RETURN NULL;
  END IF;

  RETURN '+966' || _nsn;
END;
$$;

COMMENT ON FUNCTION public.normalize_msisdn(text) IS
  'يوحّد رقم الجوال السعودي إلى E.164 (‎+9665XXXXXXXX‎)، ويقبل الأرقام العربية-الهندية. مصدر الحقيقة الوحيد لهوية العميل.';

GRANT EXECUTE ON FUNCTION public.normalize_msisdn(text) TO authenticated, anon;

-- ── ٢) عمود محسوب + دمج المكرّرات + فهرس فريد ───────────────────────────
ALTER TABLE public.customers
  ADD COLUMN IF NOT EXISTS phone_normalized text
  GENERATED ALWAYS AS (public.normalize_msisdn(phone)) STORED;

COMMENT ON COLUMN public.customers.phone_normalized IS
  'هوية العميل الموحّدة (E.164). محسوب دائماً من phone — لا يُكتب يدوياً.';

-- دمج السجلات التي كانت مكرّرة قبل التوحيد: نُبقي الأقدم ونُحوّل إليه كل ما
-- يشير إلى الباقي، ثم نحذفها. بدون هذه الخطوة يفشل إنشاء الفهرس الفريد.
DO $$
DECLARE
  _dup record;
  _keep uuid;
BEGIN
  FOR _dup IN
    SELECT phone_normalized
    FROM public.customers
    WHERE phone_normalized IS NOT NULL
    GROUP BY phone_normalized
    HAVING count(*) > 1
  LOOP
    SELECT id INTO _keep
    FROM public.customers
    WHERE phone_normalized = _dup.phone_normalized
    ORDER BY created_at ASC, id ASC
    LIMIT 1;

    -- السجل المُبقى يرث أي ربط بحساب مستخدم وأي عنوان من التوائم.
    UPDATE public.customers k
    SET user_id = COALESCE(k.user_id, (
          SELECT c.user_id FROM public.customers c
          WHERE c.phone_normalized = _dup.phone_normalized
            AND c.id <> _keep AND c.user_id IS NOT NULL
          LIMIT 1)),
        address = COALESCE(NULLIF(trim(COALESCE(k.address, '')), ''), (
          SELECT c.address FROM public.customers c
          WHERE c.phone_normalized = _dup.phone_normalized
            AND c.id <> _keep AND NULLIF(trim(COALESCE(c.address, '')), '') IS NOT NULL
          LIMIT 1))
    WHERE k.id = _keep;

    UPDATE public.orders
    SET customer_id = _keep
    WHERE customer_id IN (
      SELECT id FROM public.customers
      WHERE phone_normalized = _dup.phone_normalized AND id <> _keep
    );

    UPDATE public.product_reviews
    SET customer_id = _keep
    WHERE customer_id IN (
      SELECT id FROM public.customers
      WHERE phone_normalized = _dup.phone_normalized AND id <> _keep
    );

    DELETE FROM public.customers
    WHERE phone_normalized = _dup.phone_normalized AND id <> _keep;
  END LOOP;
END $$;

CREATE UNIQUE INDEX IF NOT EXISTS customers_phone_normalized_key
  ON public.customers (phone_normalized)
  WHERE phone_normalized IS NOT NULL;

-- ── ٣) الموافقات (PDPL م.٢٦ / اللائحة م.٢٨-٢٩) ──────────────────────────
--
-- ثلاث موافقات منفصلة، غير مُجمّعة وغير مُفعّلة مسبقاً:
--   service   — معالجة الحساب والطلب (أساس التعاقد)
--   marketing — رسائل تسويقية عبر واتساب/الرسائل النصية
--   profiling — التخصيص وبناء ملف التفضيلات
--
-- الخانات على `customers` ذاكرة سريعة للقراءة؛ الحقيقة في السجل المُلحَق فقط.
ALTER TABLE public.customers
  ADD COLUMN IF NOT EXISTS consent_marketing boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS consent_profiling boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS consent_updated_at timestamptz;

CREATE TABLE IF NOT EXISTS public.loyalty_consents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id uuid NOT NULL REFERENCES public.customers(id) ON DELETE CASCADE,
  purpose text NOT NULL CHECK (purpose IN ('service', 'marketing', 'profiling')),
  granted boolean NOT NULL,
  channel text,
  -- نص الموافقة المعروض وقتها: بدونه لا يمكن إثبات ما وافق عليه العميل فعلاً.
  wording text,
  source text NOT NULL CHECK (source IN ('storefront', 'staff', 'counter', 'import', 'system')),
  actor_id uuid,
  actor_role text,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS loyalty_consents_customer_idx
  ON public.loyalty_consents (customer_id, purpose, created_at DESC);

COMMENT ON TABLE public.loyalty_consents IS
  'سجل موافقات مُلحَق فقط (append-only) — نفس انضباط دفتر النقاط. لا تحديث ولا حذف: السحب يُسجَّل كصف جديد granted=false.';

ALTER TABLE public.loyalty_consents ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Customers read their own consents"
  ON public.loyalty_consents FOR SELECT TO authenticated
  USING (customer_id = public.get_my_customer_id());

CREATE POLICY "Admins read all consents"
  ON public.loyalty_consents FOR SELECT TO authenticated
  USING (public.is_admin(auth.uid()));

-- لا سياسة INSERT/UPDATE/DELETE للعميل: الكتابة تمرّ عبر دوال SECURITY DEFINER فقط.

-- منع التعديل والحذف على مستوى القاعدة — لا يكفي غياب السياسة، لأن الدوال
-- ذات SECURITY DEFINER تتجاوز RLS.
CREATE OR REPLACE FUNCTION public.loyalty_consents_immutable()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  RAISE EXCEPTION 'سجل الموافقات مُلحَق فقط: لا يُعدَّل ولا يُحذف';
END;
$$;

DROP TRIGGER IF EXISTS trg_loyalty_consents_immutable ON public.loyalty_consents;
CREATE TRIGGER trg_loyalty_consents_immutable
  BEFORE UPDATE OR DELETE ON public.loyalty_consents
  FOR EACH ROW EXECUTE FUNCTION public.loyalty_consents_immutable();

-- تسجيل موافقة: صف جديد دائماً + تحديث الذاكرة السريعة.
CREATE OR REPLACE FUNCTION public.record_consent(
  _customer_id uuid,
  _purpose text,
  _granted boolean,
  _source text DEFAULT 'storefront',
  _channel text DEFAULT NULL,
  _wording text DEFAULT NULL
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _actor uuid := auth.uid();
  _role text;
BEGIN
  IF _customer_id IS NULL THEN
    RAISE EXCEPTION 'العميل مطلوب لتسجيل الموافقة';
  END IF;

  _role := CASE
    WHEN _actor IS NULL THEN 'system'
    WHEN public.is_admin(_actor) THEN 'admin'
    WHEN public.has_role(_actor, 'call_center') THEN 'call_center'
    WHEN public.has_role(_actor, 'branch') THEN 'branch'
    ELSE 'customer'
  END;

  INSERT INTO public.loyalty_consents (
    customer_id, purpose, granted, channel, wording, source, actor_id, actor_role
  ) VALUES (
    _customer_id, _purpose, _granted, _channel, _wording, _source, _actor, _role
  );

  IF _purpose = 'marketing' THEN
    UPDATE public.customers
    SET consent_marketing = _granted, consent_updated_at = now()
    WHERE id = _customer_id;
  ELSIF _purpose = 'profiling' THEN
    UPDATE public.customers
    SET consent_profiling = _granted, consent_updated_at = now()
    WHERE id = _customer_id;
  END IF;
END;
$$;

-- العميل يحدّث موافقاته بنفسه (على سجله هو فقط).
CREATE OR REPLACE FUNCTION public.set_my_consent(_purpose text, _granted boolean)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _customer_id uuid := public.get_my_customer_id();
BEGIN
  IF _customer_id IS NULL THEN
    RAISE EXCEPTION 'لم يتم العثور على ملف العميل';
  END IF;

  IF _purpose NOT IN ('marketing', 'profiling') THEN
    RAISE EXCEPTION 'غرض غير مدعوم';
  END IF;

  PERFORM public.record_consent(
    _customer_id, _purpose, _granted, 'storefront', NULL,
    CASE _purpose
      WHEN 'marketing' THEN 'أوافق على استقبال رسائل «دائرة المناسبات» عبر واتساب أو الرسائل النصية.'
      ELSE 'أوافق على تخصيص العروض والتذكيرات بناءً على مناسباتي وطلباتي السابقة.'
    END
  );
END;
$$;

GRANT EXECUTE ON FUNCTION public.set_my_consent(text, boolean) TO authenticated;

-- ── ٤) تفصيل مبالغ الطلب ────────────────────────────────────────────────
ALTER TABLE public.orders
  ADD COLUMN IF NOT EXISTS subtotal numeric(10,2),
  ADD COLUMN IF NOT EXISTS delivery_fee numeric(10,2) NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS discount numeric(10,2) NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS coupon_code text,
  ADD COLUMN IF NOT EXISTS payment_method text,
  ADD COLUMN IF NOT EXISTS fulfillment_mode text,
  ADD COLUMN IF NOT EXISTS is_gift boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS card_message text;

COMMENT ON COLUMN public.orders.subtotal IS
  'مجموع الأصناف قبل التوصيل والخصم. أساس احتساب المكافآت — لا يُحتسب على رسوم التوصيل.';

-- الطلبات القديمة: المجموع الفرعي = الإجمالي (لم يكن هناك تفصيل).
UPDATE public.orders SET subtotal = total_amount WHERE subtotal IS NULL;

-- ── ٥) create_customer_order: يحفظ ما ترسله الواجهة فعلاً ───────────────
--
-- النسخة القديمة (٤ بارامترات) تُسقط رسوم التوصيل والخصم والكوبون وطريقة الدفع
-- والهدية. نحذفها ونستبدلها بواحدة تحفظ كل شيء وتُعيد رقم الطلب ورمز التتبّع.
DROP FUNCTION IF EXISTS public.create_customer_order(uuid, date, time, jsonb);

CREATE OR REPLACE FUNCTION public.create_customer_order(
  _branch_id uuid,
  _delivery_date date,
  _delivery_time time,
  _items jsonb,
  _fulfillment_mode text DEFAULT 'delivery',
  _recipient_name text DEFAULT NULL,
  _recipient_phone text DEFAULT NULL,
  _address text DEFAULT NULL,
  _is_gift boolean DEFAULT false,
  _card_message text DEFAULT NULL,
  _gift_recipient_name text DEFAULT NULL,
  _gift_recipient_phone text DEFAULT NULL,
  _notes text DEFAULT NULL,
  _delivery_fee numeric DEFAULT 0,
  _payment_method text DEFAULT NULL,
  _coupon_code text DEFAULT NULL,
  _discount numeric DEFAULT 0
)
RETURNS TABLE(order_id uuid, order_number text, tracking_code text)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _customer_id uuid;
  _order_id uuid;
  _order_number text;
  _tracking_code text;
  _subtotal numeric := 0;
  _fee numeric := GREATEST(COALESCE(_delivery_fee, 0), 0);
  _disc numeric := GREATEST(COALESCE(_discount, 0), 0);
  _item jsonb;
BEGIN
  _customer_id := public.get_my_customer_id();

  IF _customer_id IS NULL THEN
    RAISE EXCEPTION 'لم يتم العثور على ملف العميل';
  END IF;

  IF _items IS NULL OR jsonb_array_length(_items) = 0 THEN
    RAISE EXCEPTION 'السلة فارغة';
  END IF;

  FOR _item IN SELECT * FROM jsonb_array_elements(_items)
  LOOP
    _subtotal := _subtotal + ((_item->>'quantity')::int * (_item->>'unit_price')::numeric);
  END LOOP;

  -- الخصم لا يتجاوز قيمة الأصناف؛ الإجمالي لا ينزل تحت الصفر.
  _disc := LEAST(_disc, _subtotal);

  _order_number := 'ORD-' || to_char(now(), 'YYYYMMDD') || '-' || lpad(floor(random() * 10000)::text, 4, '0');
  _tracking_code := 'TRK-' || upper(substr(md5(gen_random_uuid()::text), 1, 8));

  INSERT INTO public.orders (
    order_number, customer_id, branch_id, delivery_date, delivery_time,
    subtotal, delivery_fee, discount, coupon_code, payment_method,
    fulfillment_mode, is_gift, card_message, notes,
    total_amount, status, payment_status, order_type, tracking_code
  ) VALUES (
    _order_number, _customer_id, _branch_id, _delivery_date, _delivery_time,
    _subtotal, _fee, _disc, NULLIF(trim(COALESCE(_coupon_code, '')), ''), _payment_method,
    COALESCE(_fulfillment_mode, 'delivery'), COALESCE(_is_gift, false),
    NULLIF(trim(COALESCE(_card_message, '')), ''),
    NULLIF(trim(COALESCE(_notes, '')), ''),
    GREATEST(_subtotal + _fee - _disc, 0),
    'pending_approval', 'unpaid',
    CASE WHEN COALESCE(_fulfillment_mode, 'delivery') = 'pickup' THEN 'pickup' ELSE 'home_delivery' END,
    _tracking_code
  ) RETURNING id INTO _order_id;

  FOR _item IN SELECT * FROM jsonb_array_elements(_items)
  LOOP
    INSERT INTO public.order_items (
      order_id, product_id, product_name, quantity, unit_price, total_price, notes
    ) VALUES (
      _order_id,
      -- الكيك المصمّم يصل بـ product_id = null (المعرّفات ‎custom-…‎ تفشل في ::uuid)
      CASE WHEN (_item->>'product_id') ~ '^[0-9a-fA-F-]{36}$' THEN (_item->>'product_id')::uuid ELSE NULL END,
      _item->>'product_name',
      (_item->>'quantity')::int,
      (_item->>'unit_price')::numeric,
      (_item->>'quantity')::int * (_item->>'unit_price')::numeric,
      _item->>'notes'
    );
  END LOOP;

  -- عنوان/مستلم مختلف عن ملف العميل يُحفظ في ملاحظات الطلب حتى تُضاف جداول
  -- العناوين — أفضل من إسقاطه بصمت كما كان يحدث.
  IF NULLIF(trim(COALESCE(_recipient_name, '')), '') IS NOT NULL
     OR NULLIF(trim(COALESCE(_address, '')), '') IS NOT NULL THEN
    INSERT INTO public.order_logs (order_id, action, description, performed_by)
    VALUES (
      _order_id, 'recipient_captured',
      concat_ws(' · ',
        NULLIF(trim(COALESCE(_recipient_name, '')), ''),
        NULLIF(trim(COALESCE(_address, '')), ''),
        CASE WHEN COALESCE(_is_gift, false) THEN 'هدية: ' || COALESCE(_gift_recipient_name, '—') ELSE NULL END
      ),
      auth.uid()
    );
  END IF;

  RETURN QUERY SELECT _order_id, _order_number, _tracking_code;
END;
$$;

GRANT EXECUTE ON FUNCTION public.create_customer_order(
  uuid, date, time, jsonb, text, text, text, text, boolean, text, text, text, text,
  numeric, text, text, numeric
) TO authenticated;

-- ── ٦) البحث والإنشاء على الهوية الموحّدة ───────────────────────────────
CREATE OR REPLACE FUNCTION public.search_customer_by_phone(_phone text)
RETURNS TABLE(id uuid, name text, phone text, address text)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _user_id uuid;
  _user_name text;
  _msisdn text;
BEGIN
  _user_id := auth.uid();

  IF NOT (
    public.is_admin(_user_id)
    OR public.has_role(_user_id, 'call_center')
    OR public.has_role(_user_id, 'branch')
  ) THEN
    RAISE EXCEPTION 'غير مصرح لك بالبحث عن العملاء';
  END IF;

  _msisdn := public.normalize_msisdn(_phone);

  -- رقم غير صالح: لا نتيجة، ولا وصول يستحق التسجيل.
  IF _msisdn IS NULL THEN
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
    'Phone search: ' || left(_msisdn, 7) || '***'
  );

  RETURN QUERY
  SELECT c.id, c.name, c.phone, c.address
  FROM public.customers c
  WHERE c.phone_normalized = _msisdn
  LIMIT 1;
END;
$$;

CREATE OR REPLACE FUNCTION public.upsert_customer_by_phone(
  _name text,
  _phone text,
  _address text DEFAULT NULL::text
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _user_id uuid;
  _user_name text;
  _customer_id uuid;
  _msisdn text;
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

  _msisdn := public.normalize_msisdn(_phone);

  IF _msisdn IS NULL THEN
    RAISE EXCEPTION 'رقم جوال غير صالح — المتوقّع جوال سعودي (05XXXXXXXX)';
  END IF;

  SELECT full_name INTO _user_name FROM public.profiles WHERE id = _user_id;

  SELECT c.id INTO _customer_id
  FROM public.customers c
  WHERE c.phone_normalized = _msisdn
  LIMIT 1;

  IF _customer_id IS NULL THEN
    INSERT INTO public.customers (name, phone, address)
    VALUES (
      COALESCE(NULLIF(trim(_name), ''), 'غير معروف'),
      _msisdn,
      NULLIF(trim(COALESCE(_address, '')), '')
    )
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
    'Order creation - phone: ' || left(_msisdn, 7) || '***'
  );

  RETURN _customer_id;
END;
$$;
