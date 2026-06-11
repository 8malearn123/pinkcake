
DO $$
DECLARE
  demo_password text := 'Demo1234!';
  demo_accounts jsonb := '[
    {"email":"admin@demo.com","name":"مدير تجريبي","role":"admin"},
    {"email":"callcenter@demo.com","name":"مركز اتصال تجريبي","role":"call_center"},
    {"email":"kitchen@demo.com","name":"مطبخ تجريبي","role":"kitchen"},
    {"email":"branch@demo.com","name":"فرع تجريبي","role":"branch"},
    {"email":"driver@demo.com","name":"سائق تجريبي","role":"driver"},
    {"email":"support@demo.com","name":"دعم تجريبي","role":"customer_support"},
    {"email":"customer@demo.com","name":"عميل تجريبي","role":"customer"}
  ]'::jsonb;
  acc jsonb;
  new_user_id uuid;
  acc_email text;
  acc_name text;
  acc_role app_role;
BEGIN
  FOR acc IN SELECT * FROM jsonb_array_elements(demo_accounts)
  LOOP
    acc_email := acc->>'email';
    acc_name := acc->>'name';
    acc_role := (acc->>'role')::app_role;

    SELECT id INTO new_user_id FROM auth.users WHERE email = acc_email;

    IF new_user_id IS NULL THEN
      new_user_id := gen_random_uuid();

      INSERT INTO auth.users (
        instance_id, id, aud, role, email, encrypted_password,
        email_confirmed_at, created_at, updated_at,
        raw_app_meta_data, raw_user_meta_data,
        confirmation_token, recovery_token, email_change_token_new, email_change
      ) VALUES (
        '00000000-0000-0000-0000-000000000000',
        new_user_id, 'authenticated', 'authenticated',
        acc_email, crypt(demo_password, gen_salt('bf')),
        now(), now(), now(),
        jsonb_build_object('provider','email','providers',array['email']),
        jsonb_build_object('full_name', acc_name),
        '', '', '', ''
      );

      INSERT INTO auth.identities (
        id, user_id, provider_id, identity_data, provider,
        last_sign_in_at, created_at, updated_at
      ) VALUES (
        gen_random_uuid(), new_user_id, new_user_id::text,
        jsonb_build_object('sub', new_user_id::text, 'email', acc_email, 'email_verified', true),
        'email', now(), now(), now()
      );
    END IF;

    INSERT INTO public.profiles (id, full_name)
    VALUES (new_user_id, acc_name)
    ON CONFLICT (id) DO UPDATE SET full_name = EXCLUDED.full_name;

    INSERT INTO public.user_roles (user_id, role)
    VALUES (new_user_id, acc_role)
    ON CONFLICT (user_id, role) DO NOTHING;

    IF acc_role = 'customer' THEN
      INSERT INTO public.customers (user_id, name, phone, address)
      VALUES (new_user_id, acc_name, '0500000000', 'الرياض')
      ON CONFLICT (user_id) DO NOTHING;
    END IF;
  END LOOP;
END $$;
