-- Order notifications (Track T / T4)
-- Adds two tables; the send itself runs in the `send-notification` Edge Function
-- (service role). Safe, additive migration — no existing objects are changed.

-- 1. Single-row runtime config the Edge Function reads on every event.
create table if not exists public.notification_settings (
  id          boolean primary key default true,
  enabled     boolean not null default false,
  provider    text    not null default 'mock',
  channel     text    not null default 'sms',
  base_url    text,
  updated_at  timestamptz not null default now(),
  updated_by  uuid references auth.users(id),
  constraint notification_settings_singleton   check (id = true),
  constraint notification_settings_provider_chk check (provider in ('mock','unifonic','msegat','twilio')),
  constraint notification_settings_channel_chk  check (channel in ('sms','whatsapp'))
);

-- 2. Audit trail — one row per attempt. The full phone is NEVER stored here;
--    `recipient` is masked (e.g. +966••••678) to match the app's PII policy.
create table if not exists public.notification_log (
  id                  uuid primary key default gen_random_uuid(),
  order_id            uuid references public.orders(id) on delete set null,
  order_number        text,
  status              public.order_status,
  channel             text not null,
  provider            text not null,
  recipient           text,
  body                text,
  send_status         text not null default 'pending'
                        check (send_status in ('pending','sent','failed','skipped')),
  attempts            integer not null default 0,
  error               text,
  provider_message_id text,
  created_at          timestamptz not null default now(),
  sent_at             timestamptz
);

create index if not exists idx_notification_log_order   on public.notification_log(order_id);
create index if not exists idx_notification_log_created on public.notification_log(created_at desc);

-- 3. Seed the singleton (disabled + mock until an operator configures a provider).
insert into public.notification_settings (id, enabled, provider, channel)
values (true, false, 'mock', 'sms')
on conflict (id) do nothing;

-- 4. RLS. The Edge Function uses the service role and bypasses all of this;
--    authenticated clients are admin-only, and read-only on the log.
alter table public.notification_settings enable row level security;
alter table public.notification_log      enable row level security;

create policy "Deny anonymous access to notification_settings"
  on public.notification_settings for all to anon using (false) with check (false);

create policy "Admins can view notification settings"
  on public.notification_settings for select to authenticated
  using (public.has_role(auth.uid(), 'admin'));

create policy "Admins can update notification settings"
  on public.notification_settings for update to authenticated
  using (public.has_role(auth.uid(), 'admin'))
  with check (public.has_role(auth.uid(), 'admin'));

create policy "Deny anonymous access to notification_log"
  on public.notification_log for all to anon using (false) with check (false);

create policy "Admins can view notification log"
  on public.notification_log for select to authenticated
  using (public.has_role(auth.uid(), 'admin'));
-- (No client INSERT/UPDATE/DELETE policies: only the service role writes logs.)

comment on table public.notification_settings is
  'Single-row runtime config for order notifications, read by the send-notification Edge Function.';
comment on table public.notification_log is
  'Audit trail of notification attempts. Recipient is masked; the full phone is never persisted here.';
