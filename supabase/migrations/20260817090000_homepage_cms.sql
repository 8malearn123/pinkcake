-- إدارة الصفحة الرئيسية من لوحة المدير: ترتيب الأقسام، وإظهارها، ومحتواها.
--
-- ── لماذا الجدول بهذا الشكل ─────────────────────────────────────────────
--
-- ١) المفتاح نصّ لا uuid. الصفّ يجب أن يسمّي مكوّن React، والنصّ الثابت هو
--    وصلة الربط. الأقسام تُبذر هنا: المدير يرتّب ويُخفي ويحرّر، ولا يُنشئ ولا
--    يحذف — لأن المكوّنات في الشفرة لا في الجدول.
--
-- ٢) `content` عمود jsonb واحد لا أحد عشر جدولاً. أشكال الأقسام متباعدة جداً
--    (الواجهة فيها صورة وعنوان وزرّان وشارتا ثقة، ومعرض المناسبات أربع بلاطات
--    بمقاسات مختلفة). العقد الذي يحفظ الـ jsonb من الفوضى مخطّط zod لكل مفتاح
--    في `src/lib/homepage/schema.ts`.
--
-- ٣) **`content` يخزّن التجاوزات فقط، ويبدأ فارغاً `{}`.** النصوص الأصلية تعيش
--    في `SECTION_DEFAULTS` في الشفرة، و`resolveContent` يدمج الصفّ فوقها. لو
--    بذرنا النصوص هنا أيضاً لصار للحقيقة مصدران يفترقان بصمت، ولصار زرّ «إعادة
--    للأصل» يُرجع نصّاً غير الذي تعرضه الشفرة. وهكذا صار الإرجاع سطراً واحداً:
--    `content = '{}'`.
--
-- ٤) عناصر الأقسام المتكرّرة (الأسئلة، الشهادات، بلاطات المناسبات، الفروع)
--    مصفوفات داخل `content`، لكل عنصر مفتاح `visible` خاصّ به. لا تُستعلَم أبداً
--    بمعزل عن قسمها، فجدول ثانٍ كان سيشتري وصلات JOIN ولا شيء غيرها.

CREATE TABLE IF NOT EXISTS public.homepage_sections (
  key           text PRIMARY KEY,
  is_visible    boolean     NOT NULL DEFAULT true,
  display_order smallint    NOT NULL,
  content       jsonb       NOT NULL DEFAULT '{}'::jsonb,
  updated_at    timestamptz NOT NULL DEFAULT now(),
  updated_by    uuid REFERENCES auth.users(id) ON DELETE SET NULL
);

COMMENT ON TABLE public.homepage_sections IS
  'أقسام الصفحة الرئيسية: الترتيب والإظهار وتجاوزات المحتوى. النصوص الأصلية في src/lib/homepage/schema.ts';
COMMENT ON COLUMN public.homepage_sections.content IS
  'تجاوزات المحتوى فقط؛ {} تعني «استخدم النصّ الأصلي من الشفرة»';

-- البذرة: مفتاح وترتيب لكل قسم، بلا محتوى (انظر النقطة ٣ أعلاه).
INSERT INTO public.homepage_sections (key, display_order) VALUES
  ('marquee',     1),
  ('hero',        2),
  ('customCake',  3),
  ('seasonal',    4),
  ('occasions',   5),
  ('shop',        6),
  ('combos',      7),
  ('reviews',     8),
  ('events',      9),
  ('branches',   10),
  ('faq',        11),
  ('giftBox',    12)
ON CONFLICT (key) DO NOTHING;

-- ── الحماية ────────────────────────────────────────────────────────────
-- RLS مفعّل بلا سياسة قراءة عامة: كل الوصول يمرّ بالدوال أدناه، وهو اتفاق هذا
-- المستودع («القراءات الحسّاسة والكتابات تمرّ بدوال»). سياسة المدير موجودة كي
-- يبقى الجدول قابلاً للتفقّد من محرّر SQL في لوحة Supabase.
ALTER TABLE public.homepage_sections ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "admins manage homepage sections" ON public.homepage_sections;
CREATE POLICY "admins manage homepage sections"
  ON public.homepage_sections
  FOR ALL
  USING (public.is_admin(auth.uid()))
  WITH CHECK (public.is_admin(auth.uid()));

-- ── القراءة العامة ─────────────────────────────────────────────────────
--
-- تعيد كل الصفوف — لا المرئية فقط — لأن الواجهة تحتاج أن تميّز «مخفيّ» عن
-- «غير موجود»: صفّ ناقص يعني قسماً أُضيف في الشفرة قبل هجرته، وهذا يجب أن
-- يَظهر بمحتواه الأصلي، بينما القسم المخفيّ يجب أن يختفي.
--
-- ومحتوى المخفيّ يُفرَّغ قبل الإرسال: الزائر لا يعرضه أصلاً، فلا داعي لأن
-- يصل نصّ قسم أطفأه المدير إلى المتصفّح.
CREATE OR REPLACE FUNCTION public.get_homepage_sections()
RETURNS TABLE(key text, is_visible boolean, display_order smallint, content jsonb)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    s.key,
    s.is_visible,
    s.display_order,
    CASE WHEN s.is_visible THEN s.content ELSE '{}'::jsonb END
  FROM public.homepage_sections s
  ORDER BY s.display_order ASC, s.key ASC;
$$;

-- نسخة المدير: المحتوى كاملاً بما فيه أقسام مُطفأة.
CREATE OR REPLACE FUNCTION public.get_homepage_sections_admin()
RETURNS TABLE(key text, is_visible boolean, display_order smallint, content jsonb)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT public.is_admin(auth.uid()) THEN
    RAISE EXCEPTION 'غير مصرح لك بعرض إعدادات الصفحة الرئيسية';
  END IF;

  RETURN QUERY
  SELECT s.key, s.is_visible, s.display_order, s.content
  FROM public.homepage_sections s
  ORDER BY s.display_order ASC, s.key ASC;
END;
$$;

-- ── الكتابة ────────────────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION public.update_homepage_section(
  _key        text,
  _content    jsonb   DEFAULT NULL,
  _is_visible boolean DEFAULT NULL
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT public.is_admin(auth.uid()) THEN
    RAISE EXCEPTION 'غير مصرح لك بتعديل الصفحة الرئيسية';
  END IF;

  UPDATE public.homepage_sections SET
    content    = COALESCE(_content, content),
    is_visible = COALESCE(_is_visible, is_visible),
    updated_at = now(),
    updated_by = auth.uid()
  WHERE homepage_sections.key = _key;

  -- بلا هذا الفحص يعود الزرّ بنجاح على مفتاح مكتوب خطأً ولا يتغيّر شيء.
  IF NOT FOUND THEN
    RAISE EXCEPTION 'قسم غير معروف في الصفحة الرئيسية: %', _key;
  END IF;
END;
$$;

-- الترتيب يُكتب دفعة واحدة من مصفوفة المفاتيح: موضع المفتاح هو ترتيبه.
-- تمريرة واحدة تمنع الحالة الوسطى التي تُنتجها عدّة UPDATEات متتابعة.
--
-- والمفاتيح التي لا صفّ لها تُتجاهل بلا خطأ. اللوحة ترسل دائماً القائمة كاملةً
-- مبنيّةً من `SECTION_KEYS` في الشفرة، فقسم أُضيف قبل أن تُطبَّق هجرته يجعل
-- القائمة أطول من الجدول. رفض القائمة عندها كان سيُعطّل ترتيب الأقسام كلّها
-- بسبب قسم واحد ناقص. والمفاتيح تأتي من اتحاد نصوص مُنمَّط، فالخطأ المطبعي
-- ليس الحالة التي نحرس منها هنا.
CREATE OR REPLACE FUNCTION public.reorder_homepage_sections(_keys text[])
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT public.is_admin(auth.uid()) THEN
    RAISE EXCEPTION 'غير مصرح لك بترتيب الصفحة الرئيسية';
  END IF;

  UPDATE public.homepage_sections s SET
    display_order = o.ord::smallint,
    updated_at    = now(),
    updated_by    = auth.uid()
  FROM (SELECT k.key, k.ord FROM unnest(_keys) WITH ORDINALITY AS k(key, ord)) o
  WHERE s.key = o.key;
END;
$$;

-- «إعادة للأصل» = امسح التجاوزات. النصّ الأصلي يعيش في الشفرة، فلا نسخة ثانية
-- منه هنا يمكن أن تفترق عنه.
CREATE OR REPLACE FUNCTION public.reset_homepage_section(_key text)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT public.is_admin(auth.uid()) THEN
    RAISE EXCEPTION 'غير مصرح لك بتعديل الصفحة الرئيسية';
  END IF;

  UPDATE public.homepage_sections SET
    content    = '{}'::jsonb,
    is_visible = true,
    updated_at = now(),
    updated_by = auth.uid()
  WHERE homepage_sections.key = _key;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'قسم غير معروف في الصفحة الرئيسية: %', _key;
  END IF;
END;
$$;

-- الصفحة الرئيسية تُعرض لزائر غير مسجّل، فالقراءة العامة ممنوحة لـ anon.
GRANT EXECUTE ON FUNCTION public.get_homepage_sections() TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.get_homepage_sections_admin() TO authenticated;
GRANT EXECUTE ON FUNCTION public.update_homepage_section(text, jsonb, boolean) TO authenticated;
GRANT EXECUTE ON FUNCTION public.reorder_homepage_sections(text[]) TO authenticated;
GRANT EXECUTE ON FUNCTION public.reset_homepage_section(text) TO authenticated;
