-- =====================================================
-- SECURITY FIX: Lock down customer phone/address access
-- =====================================================

-- 1) Ensure ONLY customers (customer role) can SELECT/UPDATE their own customer row.
--    Staff must NOT be able to read customers.* directly (prevents PII leakage).

DROP POLICY IF EXISTS "Customers can only see own record" ON public.customers;
CREATE POLICY "Customers can only see own record"
ON public.customers
FOR SELECT
TO authenticated
USING (
  public.has_role(auth.uid(), 'customer'::public.app_role)
  AND user_id IS NOT NULL
  AND user_id = auth.uid()
);

DROP POLICY IF EXISTS "Customers can update own profile" ON public.customers;
CREATE POLICY "Customers can update own profile"
ON public.customers
FOR UPDATE
TO authenticated
USING (
  public.has_role(auth.uid(), 'customer'::public.app_role)
  AND user_id IS NOT NULL
  AND user_id = auth.uid()
)
WITH CHECK (
  public.has_role(auth.uid(), 'customer'::public.app_role)
  AND user_id IS NOT NULL
  AND user_id = auth.uid()
);

-- 2) Staff-facing RPC to upsert a customer by phone WITHOUT exposing PII via direct SELECT.
--    Used by Admin/Call Center flows (e.g. creating an order).

CREATE OR REPLACE FUNCTION public.upsert_customer_by_phone(
  _name text,
  _phone text,
  _address text DEFAULT NULL
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _user_id uuid;
  _customer_id uuid;
BEGIN
  _user_id := auth.uid();

  IF _user_id IS NULL THEN
    RAISE EXCEPTION 'يجب تسجيل الدخول أولاً';
  END IF;

  IF NOT (public.is_admin(_user_id) OR public.has_role(_user_id, 'call_center'::app_role)) THEN
    RAISE EXCEPTION 'غير مصرح لك بإدارة بيانات العملاء';
  END IF;

  IF _phone IS NULL OR trim(_phone) = '' THEN
    RAISE EXCEPTION 'رقم الجوال مطلوب';
  END IF;

  SELECT id
  INTO _customer_id
  FROM public.customers
  WHERE phone = trim(_phone)
  LIMIT 1;

  IF _customer_id IS NULL THEN
    INSERT INTO public.customers (name, phone, address)
    VALUES (
      COALESCE(NULLIF(trim(_name), ''), 'غير معروف'),
      trim(_phone),
      NULLIF(trim(COALESCE(_address, '')), '')
    )
    RETURNING id INTO _customer_id;
  ELSE
    UPDATE public.customers
    SET
      name = COALESCE(NULLIF(trim(_name), ''), name),
      address = COALESCE(NULLIF(trim(COALESCE(_address, '')), ''), address)
    WHERE id = _customer_id;
  END IF;

  RETURN _customer_id;
END;
$$;