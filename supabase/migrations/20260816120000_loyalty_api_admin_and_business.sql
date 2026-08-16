-- المرحلتان الثالثة والرابعة: واجهة العميلة، وصرف المكافأة داخل الطلب،
-- ولوحة المدير، وحسابات ضيافة المناسبات (B2B).

-- ── ١) ملخّص العميلة ────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.get_my_loyalty()
RETURNS TABLE(
  enabled boolean,
  program_name text,
  tier text,
  stamp_balance integer,
  stamps_required smallint,
  stamps_to_next smallint,
  lifetime_stamps integer,
  window_spend numeric,
  tier_threshold numeric,
  occasions_count integer,
  registry_unlock_occasions smallint,
  registry_unlocked boolean,
  available_rewards integer,
  referral_code text,
  consent_marketing boolean
)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _customer_id uuid := public.get_my_customer_id();
  _s public.loyalty_settings%ROWTYPE;
BEGIN
  SELECT * INTO _s FROM public.loyalty_settings WHERE id;

  IF _customer_id IS NULL THEN
    RETURN QUERY SELECT
      COALESCE(_s.enabled, false), COALESCE(_s.program_name, 'دائرة المناسبات'),
      'member'::text, 0, COALESCE(_s.stamps_required, 5::smallint), COALESCE(_s.stamps_required, 5::smallint),
      0, 0::numeric, COALESCE(_s.tier_threshold_amount, 0), 0,
      COALESCE(_s.registry_unlock_occasions, 3::smallint), false, 0, NULL::text, false;
    RETURN;
  END IF;

  RETURN QUERY
  SELECT
    _s.enabled,
    _s.program_name,
    COALESCE(a.tier, 'member'),
    COALESCE(a.stamp_balance, 0),
    _s.stamps_required,
    GREATEST(_s.stamps_required - COALESCE(a.stamp_balance, 0), 0)::smallint,
    COALESCE(a.lifetime_stamps, 0),
    COALESCE(a.window_spend, 0),
    _s.tier_threshold_amount,
    (SELECT count(*) FROM public.loyalty_occasions o WHERE o.customer_id = _customer_id)::integer,
    _s.registry_unlock_occasions,
    EXISTS (
      SELECT 1 FROM public.loyalty_redemptions r
      WHERE r.customer_id = _customer_id AND r.origin = 'registry_unlock'
    ),
    (SELECT count(*) FROM public.loyalty_redemptions r
      WHERE r.customer_id = _customer_id AND r.status = 'available' AND r.available_from <= now())::integer,
    public.loyalty_referral_code(_customer_id),
    COALESCE(c.consent_marketing, false)
  FROM public.customers c
  LEFT JOIN public.loyalty_accounts a ON a.customer_id = c.id
  WHERE c.id = _customer_id;
END;
$$;

-- ── ٢) مكافآتي ──────────────────────────────────────────────────────────
--
-- تجمع القسائم المُصدَرة مع ميزة الشريحة الدائمة (تُعرض كمكافأة متاحة بلا
-- إصدار قسيمة شهرية — أبسط تشغيلياً ولا يبني التزاماً في الدفاتر).
CREATE OR REPLACE FUNCTION public.get_my_rewards()
RETURNS TABLE(
  redemption_code text,
  reward_code text,
  name text,
  description text,
  kind text,
  retail_value numeric,
  min_order_amount numeric,
  status text,
  origin text,
  available_from timestamptz,
  expires_at timestamptz,
  is_usable boolean
)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _customer_id uuid := public.get_my_customer_id();
  _tier text;
BEGIN
  IF _customer_id IS NULL THEN
    RETURN;
  END IF;

  SELECT COALESCE(a.tier, 'member') INTO _tier
  FROM public.loyalty_accounts a WHERE a.customer_id = _customer_id;

  RETURN QUERY
  SELECT
    r.code,
    (r.reward_snapshot->>'code')::text,
    (r.reward_snapshot->>'name')::text,
    (r.reward_snapshot->>'description')::text,
    (r.reward_snapshot->>'kind')::text,
    (r.reward_snapshot->>'retail_value')::numeric,
    (r.reward_snapshot->>'min_order_amount')::numeric,
    r.status,
    r.origin,
    r.available_from,
    r.expires_at,
    (r.status = 'available' AND r.available_from <= now()
      AND (r.expires_at IS NULL OR r.expires_at > now()))
  FROM public.loyalty_redemptions r
  WHERE r.customer_id = _customer_id
    AND r.status IN ('available', 'held')
  ORDER BY r.available_from ASC;

  -- ميزة الشريحة: ليست قسيمة، فلا رمز لها ولا تُصرف في السلة.
  IF COALESCE(_tier, 'member') = 'circle' THEN
    RETURN QUERY
    SELECT
      NULL::text, w.code, w.name, w.description, w.kind, w.retail_value,
      w.min_order_amount, 'tier'::text, 'tier'::text, now(), NULL::timestamptz, false
    FROM public.loyalty_rewards w
    WHERE w.requires_tier = 'circle' AND w.is_active;
  END IF;
END;
$$;

GRANT EXECUTE ON FUNCTION public.get_my_loyalty() TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_my_rewards() TO authenticated;

-- ── ٣) التحقّق من المكافأة قبل الصرف ────────────────────────────────────
--
-- نفس شكل مُغلّف `validate_coupon` عمداً، حتى تركب في السلة بلا إعادة كتابة —
-- لكن **بلا حقل خصم**: المكافأة صنف مجاني يُضاف، ولا تُنقص الإجمالي أبداً.
CREATE OR REPLACE FUNCTION public.validate_loyalty_reward(_code text, _subtotal numeric DEFAULT 0)
RETURNS jsonb
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _customer_id uuid := public.get_my_customer_id();
  _s public.loyalty_settings%ROWTYPE;
  _r public.loyalty_redemptions%ROWTYPE;
  _min numeric;
  _retail numeric;
BEGIN
  SELECT * INTO _s FROM public.loyalty_settings WHERE id;

  IF NOT COALESCE(_s.enabled, false) THEN
    RETURN jsonb_build_object('valid', false, 'message', 'البرنامج غير مُفعّل حالياً');
  END IF;

  IF _customer_id IS NULL THEN
    RETURN jsonb_build_object('valid', false, 'message', 'سجّلي الدخول لاستخدام مكافآتك');
  END IF;

  SELECT * INTO _r FROM public.loyalty_redemptions
  WHERE code = upper(trim(_code)) AND customer_id = _customer_id;

  IF _r.id IS NULL THEN
    RETURN jsonb_build_object('valid', false, 'message', 'رمز المكافأة غير صحيح');
  END IF;

  IF _r.status = 'captured' THEN
    RETURN jsonb_build_object('valid', false, 'message', 'استُخدمت هذه المكافأة سابقاً');
  END IF;

  IF _r.status NOT IN ('available', 'held') THEN
    RETURN jsonb_build_object('valid', false, 'message', 'المكافأة لم تعد صالحة');
  END IF;

  IF _r.available_from > now() THEN
    RETURN jsonb_build_object('valid', false,
      'message', 'مكافأة الإحالة تُفعّل بعد ٧٢ ساعة من تسليم طلب صديقتك');
  END IF;

  IF _r.expires_at IS NOT NULL AND _r.expires_at <= now() THEN
    RETURN jsonb_build_object('valid', false, 'message', 'انتهت صلاحية المكافأة');
  END IF;

  _min := GREATEST(
    COALESCE((_r.reward_snapshot->>'min_order_amount')::numeric, 0),
    COALESCE(_s.redemption_min_order, 0)
  );
  _retail := COALESCE((_r.reward_snapshot->>'retail_value')::numeric, 0);

  IF COALESCE(_subtotal, 0) < _min THEN
    RETURN jsonb_build_object('valid', false,
      'message', 'الحد الأدنى لاستخدام المكافأة ' || trim(to_char(_min, 'FM999999')) || ' ريال');
  END IF;

  -- سقف قيمة المكافأة نسبةً إلى الطلب — يمنع تمويل جزء كبير من طلب كبير.
  IF _subtotal > 0 AND _retail > (_subtotal * _s.redemption_max_pct / 100.0) THEN
    RETURN jsonb_build_object('valid', false,
      'message', 'قيمة المكافأة أعلى من المسموح لهذا الطلب — أضيفي صنفاً آخر لاستخدامها');
  END IF;

  RETURN jsonb_build_object(
    'valid', true,
    'code', _r.code,
    'reward_code', _r.reward_snapshot->>'code',
    'name', _r.reward_snapshot->>'name',
    'kind', _r.reward_snapshot->>'kind',
    'retail_value', _retail,
    'message', 'أضفنا مكافأتك إلى الطلب'
  );
END;
$$;

GRANT EXECUTE ON FUNCTION public.validate_loyalty_reward(text, numeric) TO authenticated;

-- ── ٤) الطلب يصرف المكافأة ذرّياً ───────────────────────────────────────
--
-- نُعيد بناء الدالة ببارامتر `_reward_code`، حتى يقع التحقّق والصرف وإنشاء
-- الطلب في معاملة واحدة. الفصل إلى نداءين يترك ثغرة: طلب أُنشئ ومكافأة لم
-- تُصرف (أو العكس).
DROP FUNCTION IF EXISTS public.create_customer_order(
  uuid, date, time, jsonb, text, text, text, text, boolean, text, text, text, text,
  numeric, text, text, numeric
);

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
  _discount numeric DEFAULT 0,
  _reward_code text DEFAULT NULL
)
RETURNS TABLE(order_id uuid, order_number text, tracking_code text, reward_applied text)
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
  _reward jsonb;
  _reward_name text;
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

  _disc := LEAST(_disc, _subtotal);

  -- التحقّق قبل إنشاء أي شيء: مكافأة غير صالحة تُفشل الطلب كلّه بدل أن تُبتلع.
  IF NULLIF(trim(COALESCE(_reward_code, '')), '') IS NOT NULL THEN
    _reward := public.validate_loyalty_reward(_reward_code, _subtotal);
    IF NOT (_reward->>'valid')::boolean THEN
      RAISE EXCEPTION '%', COALESCE(_reward->>'message', 'المكافأة غير صالحة');
    END IF;
    _reward_name := _reward->>'name';
  END IF;

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
      CASE WHEN (_item->>'product_id') ~ '^[0-9a-fA-F-]{36}$' THEN (_item->>'product_id')::uuid ELSE NULL END,
      _item->>'product_name',
      (_item->>'quantity')::int,
      (_item->>'unit_price')::numeric,
      (_item->>'quantity')::int * (_item->>'unit_price')::numeric,
      _item->>'notes'
    );
  END LOOP;

  -- المكافأة سطر بسعر صفر، لا خصم. الإجمالي لا يتغيّر، ووعاء الضريبة لا يُمسّ
  -- (دليل العروض الترويجية ٨/٢: ليست توريداً اسمياً، والمدخلات قابلة للخصم).
  IF _reward_name IS NOT NULL THEN
    INSERT INTO public.order_items (
      order_id, product_id, product_name, quantity, unit_price, total_price, notes
    ) VALUES (
      _order_id, NULL, _reward_name || ' (مكافأة)', 1, 0, 0, 'مكافأة دائرة المناسبات'
    );

    UPDATE public.loyalty_redemptions
    SET status = 'captured', captured_order_id = _order_id, captured_at = now()
    WHERE code = upper(trim(_reward_code))
      AND customer_id = _customer_id
      AND status IN ('available', 'held');

    INSERT INTO public.order_logs (order_id, action, description, performed_by)
    VALUES (_order_id, 'loyalty_reward_applied', _reward_name, auth.uid());
  END IF;

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

  RETURN QUERY SELECT _order_id, _order_number, _tracking_code, _reward_name;
END;
$$;

GRANT EXECUTE ON FUNCTION public.create_customer_order(
  uuid, date, time, jsonb, text, text, text, text, boolean, text, text, text, text,
  numeric, text, text, numeric, text
) TO authenticated;

-- ── ٥) الإحالة: تسجيل من دعاني ──────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.register_my_referral(_code text)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _customer_id uuid := public.get_my_customer_id();
  _s public.loyalty_settings%ROWTYPE;
  _referrer uuid;
  _phone text;
  _year_count int;
BEGIN
  SELECT * INTO _s FROM public.loyalty_settings WHERE id;

  IF NOT COALESCE(_s.enabled, false) THEN
    RETURN jsonb_build_object('valid', false, 'message', 'البرنامج غير مُفعّل حالياً');
  END IF;

  IF _customer_id IS NULL THEN
    RETURN jsonb_build_object('valid', false, 'message', 'سجّلي الدخول أولاً');
  END IF;

  SELECT phone_normalized INTO _phone FROM public.customers WHERE id = _customer_id;
  IF _phone IS NULL THEN
    RETURN jsonb_build_object('valid', false, 'message', 'أضيفي رقم جوال صحيح لملفك أولاً');
  END IF;

  SELECT c.id INTO _referrer
  FROM public.customers c
  WHERE public.loyalty_referral_code(c.id) = upper(trim(_code))
  LIMIT 1;

  IF _referrer IS NULL THEN
    RETURN jsonb_build_object('valid', false, 'message', 'رمز الدعوة غير صحيح');
  END IF;

  IF _referrer = _customer_id THEN
    RETURN jsonb_build_object('valid', false, 'message', 'لا يمكن استخدام رمز دعوتك الخاص');
  END IF;

  -- المُحال إليه يجب أن يكون عميلة جديدة: المطابقة على الرقم لا على الحساب،
  -- لأن إنشاء حساب جديد مجاني بينما الحصول على رقم جوال سعودي ليس كذلك.
  IF EXISTS (
    SELECT 1 FROM public.orders WHERE customer_id = _customer_id AND status = 'completed'
  ) THEN
    RETURN jsonb_build_object('valid', false, 'message', 'الدعوة للعميلات الجديدات فقط');
  END IF;

  SELECT count(*) INTO _year_count
  FROM public.loyalty_referrals
  WHERE referrer_customer_id = _referrer
    AND created_at >= now() - interval '1 year'
    AND status <> 'rejected';

  IF _year_count >= _s.referral_cap_per_year THEN
    RETURN jsonb_build_object('valid', false, 'message', 'بلغت صاحبة الدعوة الحد السنوي للدعوات');
  END IF;

  INSERT INTO public.loyalty_referrals (referrer_customer_id, referee_phone)
  VALUES (_referrer, _phone)
  ON CONFLICT DO NOTHING;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('valid', false, 'message', 'هذا الرقم مسجّل بدعوة سابقة');
  END IF;

  RETURN jsonb_build_object('valid', true,
    'message', 'تم تسجيل الدعوة — مكافأتك تصلك بعد أول طلب مكتمل');
END;
$$;

CREATE OR REPLACE FUNCTION public.get_my_referral_summary()
RETURNS TABLE(code text, invited integer, vested integer, rewarded integer)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _customer_id uuid := public.get_my_customer_id();
BEGIN
  IF _customer_id IS NULL THEN
    RETURN;
  END IF;

  RETURN QUERY
  SELECT
    public.loyalty_referral_code(_customer_id),
    count(*) FILTER (WHERE r.status <> 'rejected')::integer,
    count(*) FILTER (WHERE r.status IN ('vested', 'rewarded'))::integer,
    count(*) FILTER (WHERE r.status = 'rewarded')::integer
  FROM public.loyalty_referrals r
  WHERE r.referrer_customer_id = _customer_id;
END;
$$;

GRANT EXECUTE ON FUNCTION public.register_my_referral(text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_my_referral_summary() TO authenticated;

-- ── ٦) شارة الموظّف: المكافأة لا الرصيد ─────────────────────────────────
--
-- الموظّف يرى «لديها مكافأة: علبة كب كيك» لا رقماً قابلاً للمساومة على
-- الطاولة، ولا رصيداً يُقرأ بصوت عالٍ في الهاتف (إفشاء + ثغرة استيلاء).
CREATE OR REPLACE FUNCTION public.get_customer_loyalty_badge(_customer_id uuid)
RETURNS TABLE(tier text, has_reward boolean, reward_label text, stamps_to_next smallint)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _s public.loyalty_settings%ROWTYPE;
BEGIN
  IF NOT (
    public.is_admin(auth.uid())
    OR public.has_role(auth.uid(), 'call_center')
    OR public.has_role(auth.uid(), 'branch')
  ) THEN
    RAISE EXCEPTION 'غير مصرح لك بعرض هذه البيانات';
  END IF;

  SELECT * INTO _s FROM public.loyalty_settings WHERE id;

  RETURN QUERY
  SELECT
    COALESCE(a.tier, 'member'),
    EXISTS (
      SELECT 1 FROM public.loyalty_redemptions r
      WHERE r.customer_id = _customer_id AND r.status = 'available'
        AND r.available_from <= now() AND (r.expires_at IS NULL OR r.expires_at > now())
    ),
    (SELECT string_agg(r.reward_snapshot->>'name', ' + ')
      FROM public.loyalty_redemptions r
      WHERE r.customer_id = _customer_id AND r.status = 'available'
        AND r.available_from <= now() AND (r.expires_at IS NULL OR r.expires_at > now())),
    GREATEST(_s.stamps_required - COALESCE(a.stamp_balance, 0), 0)::smallint
  FROM public.customers c
  LEFT JOIN public.loyalty_accounts a ON a.customer_id = c.id
  WHERE c.id = _customer_id;
END;
$$;

GRANT EXECUTE ON FUNCTION public.get_customer_loyalty_badge(uuid) TO authenticated;

-- ── ٧) لوحة المدير ──────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.get_loyalty_overview()
RETURNS TABLE(
  members integer,
  circle_members integer,
  occasions_stored integer,
  members_with_occasions integer,
  marketing_consent_rate numeric,
  outstanding_stamps integer,
  rewards_available integer,
  rewards_captured_90d integer,
  reward_cost_90d numeric,
  member_revenue_90d numeric,
  cost_pct_of_revenue numeric,
  reminders_sent_90d integer,
  referrals_vested_90d integer
)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _revenue numeric;
  _cost numeric;
BEGIN
  IF NOT public.is_admin(auth.uid()) THEN
    RAISE EXCEPTION 'غير مصرح لك بعرض هذه البيانات';
  END IF;

  SELECT COALESCE(sum(COALESCE(o.subtotal, o.total_amount, 0)), 0) INTO _revenue
  FROM public.orders o
  JOIN public.loyalty_accounts a ON a.customer_id = o.customer_id
  WHERE o.status = 'completed' AND o.created_at >= now() - interval '90 days';

  SELECT COALESCE(sum((r.reward_snapshot->>'variable_cost')::numeric), 0) INTO _cost
  FROM public.loyalty_redemptions r
  WHERE r.status = 'captured' AND r.captured_at >= now() - interval '90 days';

  RETURN QUERY
  SELECT
    (SELECT count(*) FROM public.loyalty_accounts)::integer,
    (SELECT count(*) FROM public.loyalty_accounts WHERE tier = 'circle')::integer,
    (SELECT count(*) FROM public.loyalty_occasions)::integer,
    (SELECT count(DISTINCT customer_id) FROM public.loyalty_occasions)::integer,
    -- معدّل الموافقة التسويقية هو المقياس الحاكم، لا عدد المنضمّات.
    ROUND(
      100.0 * (SELECT count(*) FROM public.customers WHERE consent_marketing)
      / NULLIF((SELECT count(*) FROM public.customers), 0), 1
    ),
    (SELECT COALESCE(sum(stamp_balance), 0) FROM public.loyalty_accounts)::integer,
    (SELECT count(*) FROM public.loyalty_redemptions
      WHERE status = 'available' AND available_from <= now())::integer,
    (SELECT count(*) FROM public.loyalty_redemptions
      WHERE status = 'captured' AND captured_at >= now() - interval '90 days')::integer,
    _cost,
    _revenue,
    -- السقف المُلزِم: ≤ ٣٪. تجاوزه يعني إعادة تصميم لا مواصلة.
    ROUND(100.0 * _cost / NULLIF(_revenue, 0), 2),
    (SELECT count(*) FROM public.loyalty_reminder_log
      WHERE send_status = 'sent' AND created_at >= now() - interval '90 days')::integer,
    (SELECT count(*) FROM public.loyalty_referrals
      WHERE status IN ('vested', 'rewarded') AND vested_at >= now() - interval '90 days')::integer;
END;
$$;

-- تقرير المخاطر الأسبوعي. الإشارة التي نبحث عنها: تركّز غير متناسب لمكافآت
-- مصروفة على موظّف أو فرع بعينه، أو تركّز الصرف في أعلى شريحة إنفاق (تمويل
-- سلوك قائم أصلاً بدل خلق سلوك جديد).
CREATE OR REPLACE FUNCTION public.get_loyalty_risk_report()
RETURNS TABLE(
  metric text,
  label text,
  value numeric,
  detail text
)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT public.is_admin(auth.uid()) THEN
    RAISE EXCEPTION 'غير مصرح لك بعرض هذه البيانات';
  END IF;

  RETURN QUERY
  -- ١) تركّز المكافآت في أعلى عُشر إنفاق
  SELECT
    'top_decile_share'::text,
    'حصة أعلى عُشر إنفاقاً من قيمة المكافآت'::text,
    COALESCE(ROUND(100.0 * (
      SELECT COALESCE(sum((r.reward_snapshot->>'retail_value')::numeric), 0)
      FROM public.loyalty_redemptions r
      JOIN public.loyalty_accounts a ON a.customer_id = r.customer_id
      WHERE r.status = 'captured'
        AND a.window_spend >= (SELECT percentile_cont(0.9) WITHIN GROUP (ORDER BY window_spend)
                               FROM public.loyalty_accounts)
    ) / NULLIF((
      SELECT COALESCE(sum((r.reward_snapshot->>'retail_value')::numeric), 0)
      FROM public.loyalty_redemptions r WHERE r.status = 'captured'
    ), 0), 1), 0),
    'تجاوز ٥٠٪ يعني أننا نموّل سلوكاً قائماً — أعِد تصميم العتبات'::text

  UNION ALL
  -- ٢) عملاء أنشأهم موظّف واحد ثم استحقّوا مكافأة سريعاً
  SELECT
    'staff_originated'::text,
    'طلبات مُستحقّة أنشأها موظّفون (لا عبر المتجر)'::text,
    (SELECT count(*)::numeric FROM public.loyalty_ledger
      WHERE kind = 'earn' AND source_channel IN ('branch', 'call_center')
        AND occurred_at >= now() - interval '7 days'),
    'قارنها بحجم الطلبات عبر الفروع — التركّز في حساب واحد إشارة'::text

  UNION ALL
  -- ٣) الفروق بين الذاكرة السريعة والدفتر: يجب أن تكون صفراً دائماً
  SELECT
    'ledger_drift'::text,
    'حسابات لا يطابق رصيدها الدفتر'::text,
    (SELECT count(*)::numeric FROM public.reconcile_loyalty_balances()),
    'أي رقم غير الصفر خلل يستوجب التوقّف'::text

  UNION ALL
  -- ٤) إحالات تنتظر المراجعة
  SELECT
    'referrals_review'::text,
    'إحالات موقوفة للمراجعة'::text,
    (SELECT count(*)::numeric FROM public.loyalty_referrals WHERE status = 'review'),
    'تُراجَع يدوياً — لا تُرفض تلقائياً في سوق صغير'::text;
END;
$$;

GRANT EXECUTE ON FUNCTION public.get_loyalty_overview() TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_loyalty_risk_report() TO authenticated;

-- الإعدادات عبر دالتين لا عبر `from('loyalty_settings')` مباشرة: الاتفاق في
-- هذا المستودع أن القراءات الحسّاسة والكتابات تمرّ بدوال، وهو أيضاً ما يجعل
-- الطبقة التجريبية قادرة على محاكاتها (وإلا صار الزرّ ميتاً في وضع العرض).
CREATE OR REPLACE FUNCTION public.get_loyalty_settings()
RETURNS SETOF public.loyalty_settings
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT * FROM public.loyalty_settings WHERE id;
$$;

CREATE OR REPLACE FUNCTION public.update_loyalty_settings(_patch jsonb)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT public.is_admin(auth.uid()) THEN
    RAISE EXCEPTION 'غير مصرح لك بتعديل إعدادات البرنامج';
  END IF;

  UPDATE public.loyalty_settings SET
    enabled = COALESCE((_patch->>'enabled')::boolean, enabled),
    program_name = COALESCE(_patch->>'program_name', program_name),
    stamps_required = COALESCE((_patch->>'stamps_required')::smallint, stamps_required),
    endowed_stamps = COALESCE((_patch->>'endowed_stamps')::smallint, endowed_stamps),
    stamp_min_order = COALESCE((_patch->>'stamp_min_order')::numeric, stamp_min_order),
    redemption_min_order = COALESCE((_patch->>'redemption_min_order')::numeric, redemption_min_order),
    redemption_max_pct = COALESCE((_patch->>'redemption_max_pct')::smallint, redemption_max_pct),
    inactivity_expiry_months = COALESCE((_patch->>'inactivity_expiry_months')::smallint, inactivity_expiry_months),
    registry_unlock_occasions = COALESCE((_patch->>'registry_unlock_occasions')::smallint, registry_unlock_occasions),
    tier_threshold_amount = COALESCE((_patch->>'tier_threshold_amount')::numeric, tier_threshold_amount),
    tier_window_months = COALESCE((_patch->>'tier_window_months')::smallint, tier_window_months),
    referral_cap_per_year = COALESCE((_patch->>'referral_cap_per_year')::smallint, referral_cap_per_year),
    referral_vesting_hours = COALESCE((_patch->>'referral_vesting_hours')::smallint, referral_vesting_hours),
    updated_at = now(),
    updated_by = auth.uid()
  WHERE id;
END;
$$;

GRANT EXECUTE ON FUNCTION public.get_loyalty_settings() TO authenticated;
GRANT EXECUTE ON FUNCTION public.update_loyalty_settings(jsonb) TO authenticated;

-- ── ٨) حسابات ضيافة المناسبات (B2B) ─────────────────────────────────────
--
-- نموذج مختلف تماماً: مشترٍ مؤسسي، تكرار أسبوعي-شهري، والقرار يقوم على
-- الاعتمادية لا على الخصم. ولذلك: رصيد ضيافة عيني ٤٪، ولا أختام ولا شرائح.
CREATE TABLE IF NOT EXISTS public.loyalty_business_accounts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id uuid NOT NULL UNIQUE REFERENCES public.customers(id) ON DELETE CASCADE,
  company_name text NOT NULL,
  vat_number text,
  account_manager_id uuid,
  -- «طلبنا المعتاد»: قائمة الأصناف المتكرّرة، تُختصر بها المكالمة.
  standing_order jsonb,
  credit_rate numeric(5,2) NOT NULL DEFAULT 4.00,
  credit_balance numeric(12,2) NOT NULL DEFAULT 0,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.loyalty_business_accounts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Staff read business accounts"
  ON public.loyalty_business_accounts FOR SELECT TO authenticated
  USING (
    public.is_admin(auth.uid())
    OR public.has_role(auth.uid(), 'call_center')
    OR public.has_role(auth.uid(), 'branch')
  );

CREATE POLICY "Admins manage business accounts"
  ON public.loyalty_business_accounts FOR ALL TO authenticated
  USING (public.is_admin(auth.uid())) WITH CHECK (public.is_admin(auth.uid()));

CREATE TABLE IF NOT EXISTS public.loyalty_business_credit_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  business_account_id uuid NOT NULL REFERENCES public.loyalty_business_accounts(id) ON DELETE CASCADE,
  order_id uuid REFERENCES public.orders(id),
  amount numeric(12,2) NOT NULL,
  balance_after numeric(12,2) NOT NULL,
  kind text NOT NULL CHECK (kind IN ('earn', 'spend', 'expire', 'adjust')),
  idempotency_key text NOT NULL UNIQUE,
  -- الرصيد غير متدحرج وينتهي خلال ٩٠ يوماً (سابقة MyPanera Catering).
  expires_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.loyalty_business_credit_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins read business credit log"
  ON public.loyalty_business_credit_log FOR SELECT TO authenticated
  USING (public.is_admin(auth.uid()));

CREATE OR REPLACE FUNCTION public.loyalty_accrue_business_credit(_order_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _o public.orders%ROWTYPE;
  _acct public.loyalty_business_accounts%ROWTYPE;
  _amount numeric;
  _new_balance numeric;
BEGIN
  SELECT * INTO _o FROM public.orders WHERE id = _order_id;
  IF _o.id IS NULL OR _o.customer_id IS NULL THEN
    RETURN;
  END IF;

  SELECT * INTO _acct FROM public.loyalty_business_accounts
  WHERE customer_id = _o.customer_id AND is_active;
  IF _acct.id IS NULL THEN
    RETURN;
  END IF;

  _amount := ROUND(COALESCE(_o.subtotal, _o.total_amount, 0) * _acct.credit_rate / 100.0, 2);
  IF _amount <= 0 THEN
    RETURN;
  END IF;

  _new_balance := _acct.credit_balance + _amount;

  INSERT INTO public.loyalty_business_credit_log (
    business_account_id, order_id, amount, balance_after, kind, idempotency_key, expires_at
  ) VALUES (
    _acct.id, _order_id, _amount, _new_balance, 'earn',
    'bizearn:' || _order_id::text, now() + interval '90 days'
  )
  ON CONFLICT (idempotency_key) DO NOTHING;

  IF FOUND THEN
    UPDATE public.loyalty_business_accounts
    SET credit_balance = _new_balance WHERE id = _acct.id;
  END IF;
END;
$$;

-- طلبات الضيافة تمرّ على مسار الرصيد المؤسسي بدل كرت الأختام.
CREATE OR REPLACE FUNCTION public.loyalty_on_order_status_change()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.status IS NOT DISTINCT FROM OLD.status THEN
    RETURN NEW;
  END IF;

  IF NEW.status = 'completed' THEN
    IF COALESCE(NEW.order_type, '') = 'event' THEN
      PERFORM public.loyalty_accrue_business_credit(NEW.id);
    ELSE
      PERFORM public.loyalty_accrue_for_order(NEW.id);
    END IF;
  ELSIF NEW.status IN ('customer_rejected', 'custom_rejected') THEN
    PERFORM public.loyalty_reverse_for_order(NEW.id);
  END IF;

  RETURN NEW;
EXCEPTION WHEN OTHERS THEN
  RAISE WARNING 'loyalty accrual failed for order %: %', NEW.id, sqlerrm;
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.get_business_accounts()
RETURNS TABLE(
  id uuid,
  customer_id uuid,
  company_name text,
  vat_number text,
  contact_name text,
  credit_rate numeric,
  credit_balance numeric,
  orders_90d integer,
  spend_90d numeric,
  is_active boolean
)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT (
    public.is_admin(auth.uid())
    OR public.has_role(auth.uid(), 'call_center')
  ) THEN
    RAISE EXCEPTION 'غير مصرح لك بعرض هذه البيانات';
  END IF;

  RETURN QUERY
  SELECT
    b.id, b.customer_id, b.company_name, b.vat_number, c.name,
    b.credit_rate, b.credit_balance,
    (SELECT count(*)::integer FROM public.orders o
      WHERE o.customer_id = b.customer_id AND o.status = 'completed'
        AND o.created_at >= now() - interval '90 days'),
    (SELECT COALESCE(sum(COALESCE(o.subtotal, o.total_amount, 0)), 0) FROM public.orders o
      WHERE o.customer_id = b.customer_id AND o.status = 'completed'
        AND o.created_at >= now() - interval '90 days'),
    b.is_active
  FROM public.loyalty_business_accounts b
  JOIN public.customers c ON c.id = b.customer_id
  ORDER BY b.credit_balance DESC;
END;
$$;

GRANT EXECUTE ON FUNCTION public.get_business_accounts() TO authenticated;
