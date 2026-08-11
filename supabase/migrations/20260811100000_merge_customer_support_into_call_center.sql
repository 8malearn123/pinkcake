-- دمج دور "خدمة العملاء" (customer_support) في "مركز الاتصال" (call_center).
--
-- صار حساب مركز الاتصال يغطّي المهمتين، فلم يعد هناك حساب خدمة عملاء منفصل.
--
-- 1) ننقل كل من يحمل customer_support إلى call_center ثم نحذف صفوف الدور القديم.
-- 2) نُبقي قيمة الـ enum (لا يمكن حذف قيمة من نوع enum في Postgres) لكنها تصبح
--    بلا مستخدمين، ونجعل has_role تعتبر call_center مكافئاً لها — فتستمر كل
--    الدوال وسياسات RLS التي تفحص customer_support بالعمل لموظف مركز الاتصال
--    دون إعادة كتابة كل واحدة منها.

-- 1) ترحيل المستخدمين
INSERT INTO public.user_roles (user_id, role)
SELECT DISTINCT ur.user_id, 'call_center'::app_role
FROM public.user_roles ur
WHERE ur.role = 'customer_support'::app_role
  AND NOT EXISTS (
    SELECT 1 FROM public.user_roles existing
    WHERE existing.user_id = ur.user_id
      AND existing.role = 'call_center'::app_role
  );

DELETE FROM public.user_roles WHERE role = 'customer_support'::app_role;

-- 2) الدور القديم كاسم بديل للدور الجديد
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role public.app_role)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id
      AND (
        role = _role
        -- خدمة العملاء أُدمجت في مركز الاتصال: أي فحص للدور القديم يُلبّيه الجديد.
        OR (_role = 'customer_support'::app_role AND role = 'call_center'::app_role)
      )
  )
$$;

COMMENT ON FUNCTION public.has_role(UUID, public.app_role) IS
  'فحص دور المستخدم. الدور customer_support مُدمج في call_center: أي فحص له ينجح لموظفي مركز الاتصال (لا تُسند القيمة القديمة لأي مستخدم جديد).';
