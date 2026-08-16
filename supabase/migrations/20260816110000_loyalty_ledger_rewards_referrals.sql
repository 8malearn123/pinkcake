-- المرحلة الثانية: دفتر الأختام، والمكافآت العينية، والإحالة.
--
-- ثلاثة مبادئ تحكم كل ما يلي، وكلّها مفروضة بالبنية لا بالانضباط:
--
--   ١) **دفتر مُلحَق فقط، لا عمود رصيد.** عمود `balance` قابل للضياع تحت التزامن،
--      ويستحيل معه عكس قيد بأمانة (يُعاد الحساب بالقاعدة الحالية، فيختلف الناتج
--      إن تغيّرت القاعدة بين الطلب والاسترجاع). الدفتر يعكس **بالإشارة إلى القيد
--      الأصلي وقيمته المخزّنة**، فلا ينحرف أبداً. الرصيد المادّي ذاكرة سريعة،
--      وتُوجد دالة مطابقة تثبت تطابقه مع الدفتر.
--
--   ٢) **الاستحقاق عند تحصيل القيمة، لا عند إنشاء الطلب، وبلا زر منح يدوي.**
--      `upsert_customer_by_phone` و`create_custom_order` كلاهما SECURITY DEFINER؛
--      لو رُبط الاستحقاق بإنشاء الطلب لأمكن لموظّف الفرع توليد مكافآت بلا أن
--      يمرّ ريال واحد بالصندوق. ولذلك أيضاً: **لا توجد في هذا الملف أي دالة
--      لمنح أختام يدوياً.** الاستحقاق مشتقّ من صف طلب مكتمل، لا غير.
--
--   ٣) **المكافأة عينية دائماً، لا خصماً.** «صنف مجاني» يُضاف بسعر صفر ولا يُنقص
--      الإجمالي. هذا هو الفرق بين تكلفة ٣٥٪ من قيمة المكافأة وتكلفة ١٠٠٪ منها،
--      وهو أيضاً ما يجعلها بحسب دليل هيئة الزكاة والضريبة (العروض الترويجية، ٨/٢)
--      **ليست توريداً اسمياً**، مع بقاء ضريبة المدخلات قابلة للخصم — بخلاف
--      «خصم ٩٠ ريالاً» الذي يقتطع من وعاء الضريبة.

-- ── ١) الإعدادات (صف واحد، يحرّرها المدير) ──────────────────────────────
CREATE TABLE IF NOT EXISTS public.loyalty_settings (
  id boolean PRIMARY KEY DEFAULT true CHECK (id),
  enabled boolean NOT NULL DEFAULT false,
  program_name text NOT NULL DEFAULT 'دائرة المناسبات',
  -- كرت الأختام: ٥ خانات، واحدة ممنوحة عند الانضمام (تأثير التقدّم الممنوح:
  -- ٣٤٪ إتمام مقابل ١٩٪ بنفس الجهد الحقيقي — Nunes & Drèze) ⇒ ٤ طلبات فعلية.
  --
  -- العدد ٥ مُشتقّ من سقف الكلفة لا من الذوق: بمتوسّط طلب ٢٢٠ ريالاً، وكلفة
  -- متغيّرة ٣٠ ريالاً لعلبة الكب كيك، ونسبة صرف ٠٫٨٥ ⇒
  --   (٣٠ × ٠٫٨٥) ÷ (٤ × ٢٢٠) = ٢٫٩٪ من إيراد الأعضاء.
  -- عند ٤ أختام (٣ طلبات) تصير النسبة ٤٫٩٪ — أي فوق سقف الـ٣٪ المُلزِم.
  stamps_required smallint NOT NULL DEFAULT 5 CHECK (stamps_required BETWEEN 2 AND 12),
  endowed_stamps smallint NOT NULL DEFAULT 1 CHECK (endowed_stamps >= 0),
  -- حد أدنى لقيمة الطلب حتى يُحتسب ختم، ولاستخدام مكافأة.
  stamp_min_order numeric(10,2) NOT NULL DEFAULT 150,
  redemption_min_order numeric(10,2) NOT NULL DEFAULT 150,
  -- سقف قيمة المكافأة كنسبة من قيمة الطلب: يمنع تمويل نصف كيكة زفاف بمكافأة.
  -- ٤٠٪ لا ٢٠٪ لأن المكافأة عينية: كلفتها الحقيقية ثلث قيمتها المعلنة، فالسقف
  -- على القيمة المعلنة يقابل ~١٣٪ من الطلب كلفةً فعلية.
  redemption_max_pct smallint NOT NULL DEFAULT 40 CHECK (redemption_max_pct BETWEEN 1 AND 100),
  -- انتهاء بالخمول لا بمرور الزمن (المعيار الذي تبنّته أونتاريو، ونتبنّاه طوعاً).
  inactivity_expiry_months smallint NOT NULL DEFAULT 12,
  -- كم مناسبة محفوظة تفتح مكافأة التخصيص المجانية.
  registry_unlock_occasions smallint NOT NULL DEFAULT 3,
  -- عتبة «دائرة مميّزة» على إنفاق ٢٤ شهراً المتدحرجة.
  tier_threshold_amount numeric(10,2) NOT NULL DEFAULT 3000,
  tier_window_months smallint NOT NULL DEFAULT 24,
  -- سقف الإحالات لكل عميلة في السنة.
  referral_cap_per_year smallint NOT NULL DEFAULT 10,
  -- نافذة تثبيت مكافأة الإحالة بعد التسليم (لا نافذة إرجاع للكيك).
  referral_vesting_hours smallint NOT NULL DEFAULT 72,
  updated_at timestamptz NOT NULL DEFAULT now(),
  updated_by uuid
);

INSERT INTO public.loyalty_settings (id) VALUES (true) ON CONFLICT (id) DO NOTHING;

ALTER TABLE public.loyalty_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone authenticated reads loyalty settings"
  ON public.loyalty_settings FOR SELECT TO authenticated USING (true);

CREATE POLICY "Admins update loyalty settings"
  ON public.loyalty_settings FOR UPDATE TO authenticated
  USING (public.is_admin(auth.uid()));

-- ── ٢) الحسابات ─────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.loyalty_accounts (
  customer_id uuid PRIMARY KEY REFERENCES public.customers(id) ON DELETE CASCADE,
  joined_at timestamptz NOT NULL DEFAULT now(),
  -- ذاكرة سريعة — الحقيقة في الدفتر. تُثبتها reconcile_loyalty_balances().
  stamp_balance integer NOT NULL DEFAULT 0,
  lifetime_stamps integer NOT NULL DEFAULT 0,
  tier text NOT NULL DEFAULT 'member' CHECK (tier IN ('member', 'circle')),
  tier_since timestamptz,
  window_spend numeric(12,2) NOT NULL DEFAULT 0,
  last_activity_at timestamptz,
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.loyalty_accounts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Customers read their own loyalty account"
  ON public.loyalty_accounts FOR SELECT TO authenticated
  USING (customer_id = public.get_my_customer_id());

CREATE POLICY "Admins read all loyalty accounts"
  ON public.loyalty_accounts FOR SELECT TO authenticated
  USING (public.is_admin(auth.uid()));

-- ── ٣) الدفتر — مُلحَق فقط وغير قابل للتعديل ────────────────────────────
CREATE TABLE IF NOT EXISTS public.loyalty_ledger (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id uuid NOT NULL REFERENCES public.customers(id) ON DELETE CASCADE,
  -- موجب = استحقاق، سالب = صرف/عكس/انتهاء. صفر ممنوع: قيد بلا أثر ضجيج.
  stamps integer NOT NULL CHECK (stamps <> 0),
  balance_after integer NOT NULL,
  kind text NOT NULL CHECK (kind IN ('earn', 'redeem', 'reverse', 'expire', 'endowment', 'migration')),
  -- رموز مغلقة لا نصّ حر: النص الحر يعني استحالة تحليل الاحتيال لاحقاً.
  reason_code text NOT NULL CHECK (reason_code IN (
    'ORDER_COMPLETED', 'ORDER_REVERSED', 'REWARD_REDEEMED', 'REWARD_CANCELLED',
    'JOIN_ENDOWMENT', 'INACTIVITY_EXPIRY', 'MIGRATION_SEED'
  )),
  source_type text NOT NULL CHECK (source_type IN ('order', 'redemption', 'system')),
  source_id uuid,
  -- مفتاح التكرار: نفس الطلب لا يُحتسب مرّتين مهما تكرّر النداء.
  idempotency_key text NOT NULL,
  -- عكس القيد يشير إلى أصله؛ بهذا لا يتأثر بتغيّر القواعد بعد الاستحقاق.
  reverses_entry_id uuid REFERENCES public.loyalty_ledger(id),
  -- لقطة القاعدة وقت الاستحقاق: بدونها يرث النظام خلل إعادة الحساب.
  rule_version integer NOT NULL DEFAULT 1,
  eligible_amount numeric(10,2),
  actor_id uuid,
  actor_role text,
  source_channel text CHECK (source_channel IN ('storefront', 'call_center', 'branch', 'system')),
  occurred_at timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS loyalty_ledger_idempotency_key
  ON public.loyalty_ledger (idempotency_key);

CREATE INDEX IF NOT EXISTS loyalty_ledger_customer_idx
  ON public.loyalty_ledger (customer_id, occurred_at DESC);

COMMENT ON TABLE public.loyalty_ledger IS
  'دفتر أختام مُلحَق فقط. لا UPDATE ولا DELETE — العكس يكون بقيد جديد يشير إلى الأصل عبر reverses_entry_id.';

ALTER TABLE public.loyalty_ledger ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Customers read their own ledger"
  ON public.loyalty_ledger FOR SELECT TO authenticated
  USING (customer_id = public.get_my_customer_id());

CREATE POLICY "Admins read all ledger entries"
  ON public.loyalty_ledger FOR SELECT TO authenticated
  USING (public.is_admin(auth.uid()));

-- الحصانة تُفرض بمُشغّل لا بغياب السياسة: دوال SECURITY DEFINER تتجاوز RLS.
CREATE OR REPLACE FUNCTION public.loyalty_ledger_immutable()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  RAISE EXCEPTION 'دفتر الولاء مُلحَق فقط: القيد لا يُعدَّل ولا يُحذف (استخدم قيد عكس)';
END;
$$;

DROP TRIGGER IF EXISTS trg_loyalty_ledger_immutable ON public.loyalty_ledger;
CREATE TRIGGER trg_loyalty_ledger_immutable
  BEFORE UPDATE OR DELETE ON public.loyalty_ledger
  FOR EACH ROW EXECUTE FUNCTION public.loyalty_ledger_immutable();

-- ── ٤) كتالوج المكافآت ──────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.loyalty_rewards (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  code text NOT NULL UNIQUE,
  name text NOT NULL,
  description text,
  -- ترتيب الكلفة الحقيقية تصاعدياً: التخصيص أرخص ما نُهديه وأعلى ما يُقدَّر.
  kind text NOT NULL CHECK (kind IN ('personalisation', 'upgrade', 'product', 'access')),
  -- القيمة المعلنة للعميلة (سعر البيع) والتكلفة المتغيّرة الحقيقية علينا.
  retail_value numeric(10,2) NOT NULL DEFAULT 0,
  variable_cost numeric(10,2) NOT NULL DEFAULT 0,
  stamp_cost smallint NOT NULL DEFAULT 0,
  min_order_amount numeric(10,2) NOT NULL DEFAULT 0,
  requires_tier text CHECK (requires_tier IN ('member', 'circle')),
  is_active boolean NOT NULL DEFAULT true,
  display_order smallint NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.loyalty_rewards ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone authenticated reads active rewards"
  ON public.loyalty_rewards FOR SELECT TO authenticated USING (true);

CREATE POLICY "Admins manage rewards"
  ON public.loyalty_rewards FOR ALL TO authenticated
  USING (public.is_admin(auth.uid())) WITH CHECK (public.is_admin(auth.uid()));

-- الكتالوج الافتتاحي. لا يوجد فيه «خصم ٪» ولا «قسيمة بقيمة ريال» عمداً:
-- كل مكافأة صنف أو خدمة تُضاف بسعر صفر، فترتيب الكلفة تصاعدياً هو
-- تخصيص (c≈٠٫١٨) ← ترقية (c≈٠٫٣٠) ← منتج (c≈٠٫٣٣) ← وصول (كلفة نقدية ~صفر).
INSERT INTO public.loyalty_rewards (code, name, description, kind, retail_value, variable_cost, stamp_cost, min_order_amount, requires_tier, display_order)
VALUES
  ('PERSONALISATION', 'لمسة التخصيص', 'لوحة الاسم والتوبر والشموع وعلبة الإهداء الفاخرة — مجاناً مع طلبك.', 'personalisation', 45, 8, 0, 150, NULL, 10),
  ('CUPCAKE_BOX_6', 'علبة ٦ كب كيك', 'علبة كب كيك مجانية تُضاف إلى طلبك.', 'product', 90, 30, 0, 150, NULL, 20),
  -- ميزة الشريحة: تظهر دائماً لعضوات «دائرة مميّزة» بلا إصدار قسيمة شهرية.
  ('CIRCLE_PRIORITY', 'أولوية الموعد', 'أولوية حجز مواعيد الخميس والجمعة ومواسم العيد والتخرّج.', 'access', 0, 0, 0, 0, 'circle', 30)
ON CONFLICT (code) DO NOTHING;

-- ── ٥) المكافآت المُصدَرة (قسائم) ───────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.loyalty_redemptions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id uuid NOT NULL REFERENCES public.customers(id) ON DELETE CASCADE,
  reward_id uuid NOT NULL REFERENCES public.loyalty_rewards(id),
  code text NOT NULL UNIQUE,
  -- لقطة المكافأة وقت الإصدار: الكتالوج متغيّر، والقسيمة لا تتغيّر بعد إصدارها.
  reward_snapshot jsonb NOT NULL,
  status text NOT NULL DEFAULT 'available'
    CHECK (status IN ('available', 'held', 'captured', 'expired', 'cancelled')),
  origin text NOT NULL CHECK (origin IN ('stamp_card', 'registry_unlock', 'referral_referrer', 'referral_referee', 'tier')),
  -- الإحالة تُثبَّت بعد التسليم بـ ٧٢ ساعة؛ حتى ذلك الحين القسيمة موجودة وغير قابلة للاستخدام.
  available_from timestamptz NOT NULL DEFAULT now(),
  expires_at timestamptz,
  held_order_id uuid REFERENCES public.orders(id),
  captured_order_id uuid REFERENCES public.orders(id),
  captured_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS loyalty_redemptions_customer_idx
  ON public.loyalty_redemptions (customer_id, status);

ALTER TABLE public.loyalty_redemptions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Customers read their own redemptions"
  ON public.loyalty_redemptions FOR SELECT TO authenticated
  USING (customer_id = public.get_my_customer_id());

CREATE POLICY "Admins read all redemptions"
  ON public.loyalty_redemptions FOR SELECT TO authenticated
  USING (public.is_admin(auth.uid()));

-- ── ٦) الإحالة ──────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.loyalty_referrals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  referrer_customer_id uuid NOT NULL REFERENCES public.customers(id) ON DELETE CASCADE,
  -- الهوية الموحّدة: الحسابات رخيصة، والأرقام لا. المطابقة على الرقم لا على الحساب.
  referee_phone text NOT NULL,
  referee_customer_id uuid REFERENCES public.customers(id),
  status text NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'vested', 'rewarded', 'rejected', 'review')),
  rejection_reason text,
  order_id uuid REFERENCES public.orders(id),
  created_at timestamptz NOT NULL DEFAULT now(),
  vested_at timestamptz
);

-- يُحال مرّة واحدة إلى الأبد: أقوى ضابط منفرد ضد الإحالة الذاتية.
CREATE UNIQUE INDEX IF NOT EXISTS loyalty_referrals_referee_once
  ON public.loyalty_referrals (referee_phone)
  WHERE status <> 'rejected';

CREATE INDEX IF NOT EXISTS loyalty_referrals_referrer_idx
  ON public.loyalty_referrals (referrer_customer_id, created_at DESC);

ALTER TABLE public.loyalty_referrals ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Customers read their own referrals"
  ON public.loyalty_referrals FOR SELECT TO authenticated
  USING (referrer_customer_id = public.get_my_customer_id());

CREATE POLICY "Admins read all referrals"
  ON public.loyalty_referrals FOR SELECT TO authenticated
  USING (public.is_admin(auth.uid()));

-- رمز الإحالة الشخصي، مشتقّ ثابت من معرّف العميلة (لا جدول إضافي).
CREATE OR REPLACE FUNCTION public.loyalty_referral_code(_customer_id uuid)
RETURNS text
LANGUAGE sql
IMMUTABLE
AS $$
  SELECT 'PC' || upper(substr(md5(_customer_id::text || 'pinkcake-referral'), 1, 6));
$$;

-- ── ٧) نواة القيد ───────────────────────────────────────────────────────
--
-- الدالة الوحيدة التي تكتب في الدفتر. تكتب القيد وتحدّث الذاكرة السريعة معاً،
-- وتتجاهل التكرار عبر idempotency_key بدل أن تُخطئ — فالنداء المكرّر (نقرة
-- مزدوجة، إعادة محاولة الشبكة، مُشغّل يعمل مرّتين) نتيجته الصحيحة «لا شيء».
CREATE OR REPLACE FUNCTION public.loyalty_post_entry(
  _customer_id uuid,
  _stamps integer,
  _kind text,
  _reason_code text,
  _source_type text,
  _source_id uuid,
  _idempotency_key text,
  _eligible_amount numeric DEFAULT NULL,
  _source_channel text DEFAULT 'system',
  _reverses_entry_id uuid DEFAULT NULL
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _entry_id uuid;
  _balance integer;
  _actor uuid := auth.uid();
  _role text;
BEGIN
  IF _stamps = 0 THEN
    RETURN NULL;
  END IF;

  INSERT INTO public.loyalty_accounts (customer_id)
  VALUES (_customer_id)
  ON CONFLICT (customer_id) DO NOTHING;

  -- القفل يسلسل القيود المتزامنة على نفس الحساب، فلا يضيع تحديث.
  SELECT stamp_balance INTO _balance
  FROM public.loyalty_accounts
  WHERE customer_id = _customer_id
  FOR UPDATE;

  _role := CASE
    WHEN _actor IS NULL THEN 'system'
    WHEN public.is_admin(_actor) THEN 'admin'
    WHEN public.has_role(_actor, 'call_center') THEN 'call_center'
    WHEN public.has_role(_actor, 'branch') THEN 'branch'
    ELSE 'customer'
  END;

  -- الرصيد يُسمح له بالنزول تحت الصفر عمداً: تثبيته عند الصفر يبني آلة مال
  -- مجاني (اشترِ ← استحق ← اصرف ← أرجِع الطلب).
  _balance := COALESCE(_balance, 0) + _stamps;

  INSERT INTO public.loyalty_ledger (
    customer_id, stamps, balance_after, kind, reason_code, source_type, source_id,
    idempotency_key, reverses_entry_id, eligible_amount, actor_id, actor_role, source_channel
  ) VALUES (
    _customer_id, _stamps, _balance, _kind, _reason_code, _source_type, _source_id,
    _idempotency_key, _reverses_entry_id, _eligible_amount, _actor, _role, _source_channel
  )
  ON CONFLICT (idempotency_key) DO NOTHING
  RETURNING id INTO _entry_id;

  -- تصادم = القيد مُسجَّل سلفاً. لا نلمس الرصيد.
  IF _entry_id IS NULL THEN
    RETURN NULL;
  END IF;

  UPDATE public.loyalty_accounts
  SET stamp_balance = _balance,
      lifetime_stamps = lifetime_stamps + GREATEST(_stamps, 0),
      last_activity_at = now(),
      updated_at = now()
  WHERE customer_id = _customer_id;

  RETURN _entry_id;
END;
$$;

REVOKE ALL ON FUNCTION public.loyalty_post_entry(
  uuid, integer, text, text, text, uuid, text, numeric, text, uuid
) FROM PUBLIC, anon, authenticated;

-- ── ٨) إصدار قسيمة ──────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.loyalty_issue_redemption(
  _customer_id uuid,
  _reward_code text,
  _origin text,
  _available_from timestamptz DEFAULT now(),
  _expires_at timestamptz DEFAULT NULL
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _reward public.loyalty_rewards%ROWTYPE;
  _id uuid;
BEGIN
  SELECT * INTO _reward FROM public.loyalty_rewards WHERE code = _reward_code AND is_active;
  IF _reward.id IS NULL THEN
    RETURN NULL;
  END IF;

  INSERT INTO public.loyalty_redemptions (
    customer_id, reward_id, code, reward_snapshot, origin, available_from, expires_at
  ) VALUES (
    _customer_id,
    _reward.id,
    'RW-' || upper(substr(md5(gen_random_uuid()::text), 1, 8)),
    to_jsonb(_reward),
    _origin,
    _available_from,
    _expires_at
  )
  RETURNING id INTO _id;

  RETURN _id;
END;
$$;

REVOKE ALL ON FUNCTION public.loyalty_issue_redemption(uuid, text, text, timestamptz, timestamptz)
  FROM PUBLIC, anon, authenticated;

-- ── ٩) الاستحقاق عند اكتمال الطلب ───────────────────────────────────────
CREATE OR REPLACE FUNCTION public.loyalty_accrue_for_order(_order_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _s public.loyalty_settings%ROWTYPE;
  _o public.orders%ROWTYPE;
  _eligible numeric;
  _entry uuid;
  _balance integer;
  _account public.loyalty_accounts%ROWTYPE;
  _first_order boolean;
  _ref public.loyalty_referrals%ROWTYPE;
  _phone text;
BEGIN
  SELECT * INTO _s FROM public.loyalty_settings WHERE id;
  IF NOT COALESCE(_s.enabled, false) THEN
    RETURN;
  END IF;

  SELECT * INTO _o FROM public.orders WHERE id = _order_id;
  IF _o.id IS NULL OR _o.customer_id IS NULL THEN
    RETURN;
  END IF;

  -- طلبات الضيافة لها نموذجها الخاص (رصيد عيني ٤٪) ولا تدخل كرت الأختام،
  -- وإلا صنع طلب صواني واحد أعلى شريحة بمفرده.
  IF COALESCE(_o.order_type, '') = 'event' THEN
    RETURN;
  END IF;

  -- الأساس هو مجموع الأصناف قبل التوصيل والخصم.
  _eligible := COALESCE(_o.subtotal, _o.total_amount, 0) - COALESCE(_o.discount, 0);

  -- أول انضمام يمنح الأختام الممنوحة (كرت يبدأ من ٢٥٪ لا من الصفر).
  SELECT * INTO _account FROM public.loyalty_accounts WHERE customer_id = _o.customer_id;
  IF _account.customer_id IS NULL AND _s.endowed_stamps > 0 THEN
    PERFORM public.loyalty_post_entry(
      _o.customer_id, _s.endowed_stamps, 'endowment', 'JOIN_ENDOWMENT',
      'system', NULL, 'endow:' || _o.customer_id::text, NULL, 'system'
    );
  END IF;

  IF _eligible >= _s.stamp_min_order THEN
    -- ختم واحد لكل طلب مهما بلغت قيمته: كيكة زفاف لا تصنع كرتاً كاملاً.
    _entry := public.loyalty_post_entry(
      _o.customer_id, 1, 'earn', 'ORDER_COMPLETED', 'order', _o.id,
      'earn:' || _o.id::text, _eligible,
      CASE WHEN _o.created_by IS NULL THEN 'storefront' ELSE 'call_center' END
    );
  END IF;

  -- تحديث نافذة الإنفاق والشريحة.
  PERFORM public.loyalty_refresh_tier(_o.customer_id);

  -- كرت مكتمل ← تُصدَر المكافأة وتُخصم الأختام فوراً (لا رصيد مفتوح معلّق).
  SELECT stamp_balance INTO _balance FROM public.loyalty_accounts WHERE customer_id = _o.customer_id;
  WHILE _balance >= _s.stamps_required LOOP
    PERFORM public.loyalty_post_entry(
      _o.customer_id, -_s.stamps_required, 'redeem', 'REWARD_REDEEMED',
      'system', NULL,
      'card:' || _o.customer_id::text || ':' || (_balance / _s.stamps_required)::text || ':' || _o.id::text,
      NULL, 'system'
    );
    PERFORM public.loyalty_issue_redemption(
      _o.customer_id, 'CUPCAKE_BOX_6', 'stamp_card', now(), now() + interval '12 months'
    );
    _balance := _balance - _s.stamps_required;
  END LOOP;

  -- الإحالة: تُثبَّت على أول طلب مكتمل للمُحال إليه، لا عند التسجيل.
  SELECT phone_normalized INTO _phone FROM public.customers WHERE id = _o.customer_id;
  SELECT count(*) = 1 INTO _first_order
  FROM public.orders
  WHERE customer_id = _o.customer_id AND status = 'completed';

  IF _first_order AND _phone IS NOT NULL THEN
    SELECT * INTO _ref FROM public.loyalty_referrals
    WHERE referee_phone = _phone AND status = 'pending'
    LIMIT 1;

    IF _ref.id IS NOT NULL AND _eligible >= _s.redemption_min_order THEN
      UPDATE public.loyalty_referrals
      SET status = 'vested', vested_at = now(), order_id = _o.id, referee_customer_id = _o.customer_id
      WHERE id = _ref.id;

      -- القسيمتان تُصدران الآن لكن لا تُستخدمان قبل انقضاء نافذة التثبيت.
      PERFORM public.loyalty_issue_redemption(
        _ref.referrer_customer_id, 'PERSONALISATION', 'referral_referrer',
        now() + make_interval(hours => _s.referral_vesting_hours), now() + interval '12 months'
      );
      PERFORM public.loyalty_issue_redemption(
        _o.customer_id, 'CUPCAKE_BOX_6', 'referral_referee',
        now() + make_interval(hours => _s.referral_vesting_hours), now() + interval '12 months'
      );
    END IF;
  END IF;
END;
$$;

-- ── ١٠) العكس عند الإلغاء/الاسترجاع ─────────────────────────────────────
CREATE OR REPLACE FUNCTION public.loyalty_reverse_for_order(_order_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _entry public.loyalty_ledger%ROWTYPE;
BEGIN
  FOR _entry IN
    SELECT * FROM public.loyalty_ledger
    WHERE source_type = 'order' AND source_id = _order_id AND kind = 'earn'
  LOOP
    -- العكس بقيمة القيد الأصلي المخزّنة، لا بإعادة حسابها بالقاعدة الحالية.
    PERFORM public.loyalty_post_entry(
      _entry.customer_id, -_entry.stamps, 'reverse', 'ORDER_REVERSED',
      'order', _order_id, 'reverse:' || _entry.id::text,
      _entry.eligible_amount, 'system', _entry.id
    );
  END LOOP;

  -- قسيمة استُخدمت على طلب أُلغي تعود متاحة.
  UPDATE public.loyalty_redemptions
  SET status = 'available', held_order_id = NULL, captured_order_id = NULL, captured_at = NULL
  WHERE captured_order_id = _order_id AND status = 'captured';
END;
$$;

-- ── ١١) الشريحة على إنفاق نافذة متدحرجة ─────────────────────────────────
CREATE OR REPLACE FUNCTION public.loyalty_refresh_tier(_customer_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _s public.loyalty_settings%ROWTYPE;
  _spend numeric;
  _tier text;
BEGIN
  SELECT * INTO _s FROM public.loyalty_settings WHERE id;

  SELECT COALESCE(sum(COALESCE(o.subtotal, o.total_amount, 0)), 0) INTO _spend
  FROM public.orders o
  WHERE o.customer_id = _customer_id
    AND o.status = 'completed'
    AND o.created_at >= now() - make_interval(months => _s.tier_window_months);

  _tier := CASE WHEN _spend >= _s.tier_threshold_amount THEN 'circle' ELSE 'member' END;

  INSERT INTO public.loyalty_accounts (customer_id) VALUES (_customer_id)
  ON CONFLICT (customer_id) DO NOTHING;

  UPDATE public.loyalty_accounts
  SET window_spend = _spend,
      tier = _tier,
      tier_since = CASE WHEN tier IS DISTINCT FROM _tier THEN now() ELSE tier_since END,
      updated_at = now()
  WHERE customer_id = _customer_id;
END;
$$;

-- ── ١٢) المُشغّل: حالة الطلب هي الحدث الوحيد الذي يحرّك الدفتر ──────────
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

  -- الاستحقاق عند اكتمال التسليم — لا عند إنشاء الطلب ولا عند الدفع الموعود.
  IF NEW.status = 'completed' THEN
    PERFORM public.loyalty_accrue_for_order(NEW.id);
  ELSIF NEW.status IN ('customer_rejected', 'custom_rejected') THEN
    PERFORM public.loyalty_reverse_for_order(NEW.id);
  END IF;

  RETURN NEW;
EXCEPTION WHEN OTHERS THEN
  -- خلل في الولاء لا يجوز أن يُرجِع تحديث حالة الطلب. نُحذّر ونمضي.
  RAISE WARNING 'loyalty accrual failed for order %: %', NEW.id, sqlerrm;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_loyalty_on_order_status ON public.orders;
CREATE TRIGGER trg_loyalty_on_order_status
  AFTER UPDATE OF status ON public.orders
  FOR EACH ROW EXECUTE FUNCTION public.loyalty_on_order_status_change();

-- ── ١٣) مكافأة تعبئة السجل ──────────────────────────────────────────────
--
-- ندفع مقابل التقاط التواريخ، لا مقابل التسجيل. مكافأة التسجيل هي أكثر ما
-- يُساء استغلاله في برنامج منخفض التكرار — تساوي أكثر من سنة استحقاق مشروع.
-- ولذلك الشرط هنا: مناسبات محفوظة **مع** طلب واحد مكتمل على الأقل.
CREATE OR REPLACE FUNCTION public.loyalty_check_registry_unlock()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _s public.loyalty_settings%ROWTYPE;
  _count int;
  _has_order boolean;
BEGIN
  SELECT * INTO _s FROM public.loyalty_settings WHERE id;
  IF NOT COALESCE(_s.enabled, false) THEN
    RETURN NEW;
  END IF;

  SELECT count(*) INTO _count
  FROM public.loyalty_occasions WHERE customer_id = NEW.customer_id;

  IF _count < _s.registry_unlock_occasions THEN
    RETURN NEW;
  END IF;

  SELECT EXISTS (
    SELECT 1 FROM public.orders
    WHERE customer_id = NEW.customer_id AND status = 'completed'
  ) INTO _has_order;

  IF NOT _has_order THEN
    RETURN NEW;
  END IF;

  -- مرّة واحدة لكل عميلة.
  IF EXISTS (
    SELECT 1 FROM public.loyalty_redemptions
    WHERE customer_id = NEW.customer_id AND origin = 'registry_unlock'
  ) THEN
    RETURN NEW;
  END IF;

  PERFORM public.loyalty_issue_redemption(
    NEW.customer_id, 'PERSONALISATION', 'registry_unlock', now(), now() + interval '12 months'
  );

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_loyalty_registry_unlock ON public.loyalty_occasions;
CREATE TRIGGER trg_loyalty_registry_unlock
  AFTER INSERT ON public.loyalty_occasions
  FOR EACH ROW EXECUTE FUNCTION public.loyalty_check_registry_unlock();

-- ── ١٤) انتهاء الصلاحية بالخمول + المطابقة (مهام مجدولة) ────────────────
CREATE OR REPLACE FUNCTION public.loyalty_expire_inactive()
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _s public.loyalty_settings%ROWTYPE;
  _row record;
  _n integer := 0;
BEGIN
  SELECT * INTO _s FROM public.loyalty_settings WHERE id;

  FOR _row IN
    SELECT a.customer_id, a.stamp_balance
    FROM public.loyalty_accounts a
    WHERE a.stamp_balance > 0
      AND COALESCE(a.last_activity_at, a.joined_at)
          < now() - make_interval(months => _s.inactivity_expiry_months)
  LOOP
    PERFORM public.loyalty_post_entry(
      _row.customer_id, -_row.stamp_balance, 'expire', 'INACTIVITY_EXPIRY',
      'system', NULL,
      'expire:' || _row.customer_id::text || ':' || to_char(now(), 'YYYYMM'),
      NULL, 'system'
    );
    _n := _n + 1;
  END LOOP;

  UPDATE public.loyalty_redemptions
  SET status = 'expired'
  WHERE status IN ('available', 'held') AND expires_at IS NOT NULL AND expires_at < now();

  RETURN _n;
END;
$$;

-- تُثبت أن الذاكرة السريعة تطابق الدفتر. تُشغَّل ليلياً؛ أي فرق هو خلل.
CREATE OR REPLACE FUNCTION public.reconcile_loyalty_balances()
RETURNS TABLE(customer_id uuid, cached integer, ledger_sum integer)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT a.customer_id, a.stamp_balance, COALESCE(sum(l.stamps), 0)::integer
  FROM public.loyalty_accounts a
  LEFT JOIN public.loyalty_ledger l ON l.customer_id = a.customer_id
  GROUP BY a.customer_id, a.stamp_balance
  HAVING a.stamp_balance <> COALESCE(sum(l.stamps), 0)::integer;
$$;

REVOKE ALL ON FUNCTION public.loyalty_expire_inactive() FROM PUBLIC, anon, authenticated;
