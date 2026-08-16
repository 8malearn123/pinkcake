-- المرحلة الأولى: «سجل المناسبات» ومحرّك التذكير — قلب برنامج الولاء.
--
-- الفكرة: عميلة تشتري كيكة مناسبة مرّة أو ثلاثاً في السنة لا يحرّكها كرت أختام،
-- بل يحرّكها أن نتذكّر معها المناسبة قبل موعدها. لذلك تُخزَّن المناسبات لا النقاط.
--
-- قيود مقصودة في التصميم:
--
--   • **لا سنة ميلاد.** نخزّن اليوم والشهر فقط. تخزين السنة يحوّل السجل إلى
--     بيانات هوية (وبيانات أطفال) بلا حاجة تشغيلية، ويستدعي تقييم أثر إلزامياً
--     بحسب اللائحة التنفيذية لنظام حماية البيانات (م.٢٥/١/ج).
--
--   • **لا رقم جوال للمُهدى إليه.** نظام حماية البيانات م.٢٦ يشترط أن تُجمع
--     البيانات «مباشرةً من صاحبها» للتسويق. لا يجوز مراسلة من أُهديت له الكيكة،
--     ولا تُصحّح ذلك موافقة المُهدي. فالسجل يحفظ اسماً نصّياً وتاريخاً — لا شخصاً
--     يمكن مراسلته.
--
--   • **«مناسبتك» لا «عيد ميلادك».** حقل نوع المناسبة اختياري القيمة ومتعدّدها،
--     فهو أنسب ثقافياً وأفيد تجارياً: للأسرة مناسبات أكثر من أعياد الميلاد.

-- ── ١) سجل المناسبات ────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.loyalty_occasions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id uuid NOT NULL REFERENCES public.customers(id) ON DELETE CASCADE,
  -- اسم حر: «ماما» أو «سارة» — نص لا هوية.
  label text NOT NULL CHECK (length(trim(label)) BETWEEN 1 AND 60),
  occasion_type text NOT NULL DEFAULT 'other'
    CHECK (occasion_type IN ('birthday', 'anniversary', 'graduation', 'newborn', 'work', 'other')),
  occasion_day smallint NOT NULL CHECK (occasion_day BETWEEN 1 AND 31),
  occasion_month smallint NOT NULL CHECK (occasion_month BETWEEN 1 AND 12),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- نفس الاسم + نفس التاريخ مرّة واحدة لكل عميلة (يمنع التكرار بالنقر المزدوج).
CREATE UNIQUE INDEX IF NOT EXISTS loyalty_occasions_unique_per_customer
  ON public.loyalty_occasions (customer_id, lower(trim(label)), occasion_month, occasion_day);

CREATE INDEX IF NOT EXISTS loyalty_occasions_calendar_idx
  ON public.loyalty_occasions (occasion_month, occasion_day);

COMMENT ON TABLE public.loyalty_occasions IS
  'مناسبات العميلة (يوم/شهر بلا سنة). لا تحمل أي وسيلة تواصل لطرف ثالث — انظر PDPL م.٢٦.';

ALTER TABLE public.loyalty_occasions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Customers read their own occasions"
  ON public.loyalty_occasions FOR SELECT TO authenticated
  USING (customer_id = public.get_my_customer_id());

CREATE POLICY "Admins read all occasions"
  ON public.loyalty_occasions FOR SELECT TO authenticated
  USING (public.is_admin(auth.uid()));

CREATE OR REPLACE FUNCTION public.touch_updated_at()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at := now();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_loyalty_occasions_touch ON public.loyalty_occasions;
CREATE TRIGGER trg_loyalty_occasions_touch
  BEFORE UPDATE ON public.loyalty_occasions
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

-- ── ٢) سجل الإرسال — يمنع تكرار نفس التذكير ─────────────────────────────
CREATE TABLE IF NOT EXISTS public.loyalty_reminder_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  occasion_id uuid NOT NULL REFERENCES public.loyalty_occasions(id) ON DELETE CASCADE,
  customer_id uuid NOT NULL REFERENCES public.customers(id) ON DELETE CASCADE,
  -- السنة الميلادية لدورة المناسبة: المفتاح الذي يجعل التذكير سنوياً لا يومياً.
  cycle_year smallint NOT NULL,
  -- كم يوماً قبل المناسبة أُرسل هذا التذكير (١٤ / ٥ / ١).
  lead_days smallint NOT NULL,
  channel text NOT NULL DEFAULT 'whatsapp',
  -- utility = تذكير بلا عرض (مسموح بالتعامل السابق) · marketing = يحمل عرضاً
  -- (يستلزم موافقة تسويقية صريحة). الفصل مقصود ومطلوب نظاماً.
  template_kind text NOT NULL DEFAULT 'utility' CHECK (template_kind IN ('utility', 'marketing')),
  send_status text NOT NULL DEFAULT 'sent' CHECK (send_status IN ('sent', 'failed', 'skipped')),
  error text,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS loyalty_reminder_log_dedupe
  ON public.loyalty_reminder_log (occasion_id, cycle_year, lead_days);

COMMENT ON TABLE public.loyalty_reminder_log IS
  'أثر إرسال التذكيرات + مفتاح منع التكرار. الفهرس الفريد هو الضمانة: تشغيل المهمة مرّتين في اليوم لا يُرسل رسالتين.';

ALTER TABLE public.loyalty_reminder_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins read the reminder log"
  ON public.loyalty_reminder_log FOR SELECT TO authenticated
  USING (public.is_admin(auth.uid()));

-- ── ٣) دوال العميلة ─────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.get_my_occasions()
RETURNS TABLE(
  id uuid,
  label text,
  occasion_type text,
  occasion_day smallint,
  occasion_month smallint,
  days_until integer
)
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
    o.id, o.label, o.occasion_type, o.occasion_day, o.occasion_month,
    public.days_until_occasion(o.occasion_month, o.occasion_day) AS days_until
  FROM public.loyalty_occasions o
  WHERE o.customer_id = _customer_id
  ORDER BY public.days_until_occasion(o.occasion_month, o.occasion_day) ASC;
END;
$$;

-- كم يوماً حتى الدورة القادمة لهذا اليوم/الشهر، بتوقيت الرياض (UTC+3، بلا توقيت صيفي).
-- ٢٩ فبراير في سنة غير كبيسة يُعامَل كـ ٢٨ فبراير حتى لا تختفي المناسبة ٣ سنوات.
CREATE OR REPLACE FUNCTION public.days_until_occasion(_month smallint, _day smallint)
RETURNS integer
LANGUAGE plpgsql
STABLE
AS $$
DECLARE
  _today date := (now() AT TIME ZONE 'Asia/Riyadh')::date;
  _year int := extract(year from _today)::int;
  _next date;
BEGIN
  _next := public.safe_make_date(_year, _month, _day);
  IF _next < _today THEN
    _next := public.safe_make_date(_year + 1, _month, _day);
  END IF;
  RETURN _next - _today;
END;
$$;

CREATE OR REPLACE FUNCTION public.safe_make_date(_year int, _month smallint, _day smallint)
RETURNS date
LANGUAGE plpgsql
IMMUTABLE
AS $$
DECLARE
  _last_day int;
BEGIN
  _last_day := extract(day from (make_date(_year, _month, 1) + interval '1 month - 1 day'))::int;
  RETURN make_date(_year, _month, LEAST(_day::int, _last_day));
END;
$$;

CREATE OR REPLACE FUNCTION public.upsert_my_occasion(
  _label text,
  _occasion_type text,
  _day smallint,
  _month smallint,
  _id uuid DEFAULT NULL
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _customer_id uuid := public.get_my_customer_id();
  _count int;
  _result uuid;
BEGIN
  IF _customer_id IS NULL THEN
    RAISE EXCEPTION 'لم يتم العثور على ملف العميل';
  END IF;

  IF NULLIF(trim(COALESCE(_label, '')), '') IS NULL THEN
    RAISE EXCEPTION 'اسم المناسبة مطلوب';
  END IF;

  -- سقف معقول: يمنع استخدام السجل كمخزن بيانات، ويحدّ من كلفة الرسائل.
  IF _id IS NULL THEN
    SELECT count(*) INTO _count FROM public.loyalty_occasions WHERE customer_id = _customer_id;
    IF _count >= 20 THEN
      RAISE EXCEPTION 'بلغت الحد الأقصى للمناسبات المحفوظة (٢٠)';
    END IF;
  END IF;

  IF _id IS NULL THEN
    INSERT INTO public.loyalty_occasions (customer_id, label, occasion_type, occasion_day, occasion_month)
    VALUES (_customer_id, trim(_label), COALESCE(_occasion_type, 'other'), _day, _month)
    ON CONFLICT (customer_id, lower(trim(label)), occasion_month, occasion_day)
      DO UPDATE SET occasion_type = EXCLUDED.occasion_type
    RETURNING id INTO _result;
  ELSE
    UPDATE public.loyalty_occasions
    SET label = trim(_label),
        occasion_type = COALESCE(_occasion_type, 'other'),
        occasion_day = _day,
        occasion_month = _month
    WHERE id = _id AND customer_id = _customer_id
    RETURNING id INTO _result;

    IF _result IS NULL THEN
      RAISE EXCEPTION 'المناسبة غير موجودة';
    END IF;
  END IF;

  RETURN _result;
END;
$$;

CREATE OR REPLACE FUNCTION public.delete_my_occasion(_id uuid)
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

  DELETE FROM public.loyalty_occasions WHERE id = _id AND customer_id = _customer_id;
END;
$$;

GRANT EXECUTE ON FUNCTION public.get_my_occasions() TO authenticated;
GRANT EXECUTE ON FUNCTION public.upsert_my_occasion(text, text, smallint, smallint, uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.delete_my_occasion(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.days_until_occasion(smallint, smallint) TO authenticated;

-- ── ٤) ما تقرأه المهمة المجدولة ─────────────────────────────────────────
--
-- تُستدعى بمفتاح الخدمة من Edge Function ‎send-occasion-reminders‎. تُعيد
-- المناسبات المستحقّة اليوم فقط، مع رقم الجوال الحقيقي (غير مُقنّع) — ولهذا
-- تعمل خادمياً لا في المتصفّح، تماماً كإشعارات الطلبات.
CREATE OR REPLACE FUNCTION public.get_due_occasion_reminders(_lead_days smallint[] DEFAULT ARRAY[14, 5, 1]::smallint[])
RETURNS TABLE(
  occasion_id uuid,
  customer_id uuid,
  customer_name text,
  customer_phone text,
  label text,
  occasion_type text,
  lead_days smallint,
  cycle_year smallint,
  consent_marketing boolean
)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _today date := (now() AT TIME ZONE 'Asia/Riyadh')::date;
BEGIN
  RETURN QUERY
  SELECT
    o.id,
    c.id,
    c.name,
    c.phone_normalized,
    o.label,
    o.occasion_type,
    d.lead::smallint,
    extract(year from (_today + d.lead))::smallint,
    c.consent_marketing
  FROM public.loyalty_occasions o
  JOIN public.customers c ON c.id = o.customer_id
  CROSS JOIN LATERAL unnest(_lead_days) AS d(lead)
  WHERE c.phone_normalized IS NOT NULL
    AND public.safe_make_date(
          extract(year from (_today + d.lead))::int, o.occasion_month, o.occasion_day
        ) = (_today + d.lead)
    AND NOT EXISTS (
      SELECT 1 FROM public.loyalty_reminder_log l
      WHERE l.occasion_id = o.id
        AND l.cycle_year = extract(year from (_today + d.lead))::smallint
        AND l.lead_days = d.lead::smallint
    )
    -- تذكير اللحظة الأخيرة (يوم واحد) لا يُرسل إن كانت هناك طلبية قائمة أصلاً
    -- خلال آخر ١٤ يوماً: العميلة طلبت بالفعل، فالرسالة إزعاج لا خدمة.
    AND NOT (
      d.lead = 1 AND EXISTS (
        SELECT 1 FROM public.orders ord
        WHERE ord.customer_id = c.id
          AND ord.created_at >= now() - interval '14 days'
          AND ord.status NOT IN ('customer_rejected', 'custom_rejected')
      )
    );
END;
$$;

CREATE OR REPLACE FUNCTION public.log_occasion_reminder(
  _occasion_id uuid,
  _customer_id uuid,
  _cycle_year smallint,
  _lead_days smallint,
  _channel text,
  _template_kind text,
  _send_status text,
  _error text DEFAULT NULL
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.loyalty_reminder_log (
    occasion_id, customer_id, cycle_year, lead_days, channel, template_kind, send_status, error
  ) VALUES (
    _occasion_id, _customer_id, _cycle_year, _lead_days, _channel, _template_kind, _send_status, _error
  )
  -- التشغيل المتزامن لا يُنتج رسالتين: الفهرس الفريد يحسم، ونتجاهل التصادم.
  ON CONFLICT (occasion_id, cycle_year, lead_days) DO NOTHING;
END;
$$;

-- لا GRANT لدور authenticated على هاتين: مفتاح الخدمة فقط (Edge Function).
REVOKE ALL ON FUNCTION public.get_due_occasion_reminders(smallint[]) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.log_occasion_reminder(uuid, uuid, smallint, smallint, text, text, text, text)
  FROM PUBLIC, anon, authenticated;
