# Order Notifications (Track T4)

Automatic SMS / WhatsApp messages to the customer when an order reaches a
meaningful milestone (paid, preparing, ready for pickup, completed, custom‑order
pricing/approval). Off by default; enabled per environment from the admin UI.

## Why it is server‑side

The customer's real phone number is **deliberately masked** from staff clients
(`get_kitchen_orders_secure` and friends). So the send must run where the
**service role** can read the unmasked number — a Supabase Edge Function — not in
the browser. Provider API keys also stay server‑side as function secrets and are
never shipped to the client.

```
orders.status changes
      │  (Database Webhook: UPDATE on public.orders)
      ▼
Edge Function  send-notification     ← service role; reads real phone
      │  • checks notification_settings.enabled
      │  • renders Arabic template for the new status (skips internal ones)
      │  • normalises phone → E.164, sends via provider (retry ×3)
      ▼
notification_log   (audit; recipient stored MASKED)
```

## Single source of truth

All message text and send logic lives in **`src/lib/notifications/`** and is
unit‑tested by vitest. `scripts/sync-notification-core.mjs` mirrors it verbatim
into `supabase/functions/send-notification/_core/` (adding the `.ts` import
extensions Deno needs). A test (`__tests__/sync.test.ts`) runs the sync in
`--check` mode, so the two copies can never drift.

```bash
npm run notify:sync     # regenerate the Edge Function copy after editing the core
npm run notify:check    # verify they are in sync (also runs in the test suite)
```

Edit templates only in `src/lib/notifications/templates.ts`, then run `notify:sync`.

## Data model (migration `20260612090000_order_notifications.sql`)

| Table | Purpose |
|---|---|
| `notification_settings` | Single row (`id = true`): `enabled`, `provider`, `channel`, `base_url`. Read by the function; edited by admins. |
| `notification_log` | One row per attempt: order, status, provider, **masked** recipient, body, `send_status`, attempts, error. Admin read‑only. |

RLS: admins read both, admins update settings; **only the service role writes the
log**. The migration is additive and safe — it changes no existing objects.

## Deploy checklist

1. **Apply the migration** to your project:
   ```bash
   supabase db push
   ```
2. **Set the function secrets** (pick one provider; mock needs none):
   ```bash
   supabase secrets set NOTIFICATION_WEBHOOK_SECRET="<random-string>"
   supabase secrets set STORE_NAME="Pink Cake"
   # Unifonic:
   supabase secrets set UNIFONIC_APP_SID="..." UNIFONIC_SENDER_ID="PinkCake"
   # Msegat:
   supabase secrets set MSEGAT_API_KEY="..." MSEGAT_USERNAME="..." MSEGAT_SENDER="PinkCake"
   # Twilio:
   supabase secrets set TWILIO_ACCOUNT_SID="AC..." TWILIO_AUTH_TOKEN="..." TWILIO_FROM="+966..."
   ```
3. **Deploy the function** (it is configured with `verify_jwt = false`; the shared
   secret protects it):
   ```bash
   supabase functions deploy send-notification
   ```
4. **Create a Database Webhook** (Dashboard → Database → Webhooks):
   - Table `public.orders`, event **Update**
   - URL: `https://<project-ref>.functions.supabase.co/send-notification`
   - HTTP header: `x-webhook-secret: <the value from step 2>`

   The function ignores updates where the status did not change.
5. **Enable in the app**: Settings → الإشعارات → toggle on, choose the provider and
   channel, and set the tracking base URL (your app origin, e.g.
   `https://app.example.com`). Start with provider **mock** to watch the log
   populate without sending real messages, then switch to a live provider.

### Alternative: a Postgres trigger instead of a Webhook

If you prefer DB‑level dispatch over a dashboard webhook, this trigger does the
same thing via `pg_net`. The send is wrapped so a notification failure can never
roll back the order update.

```sql
-- one-time config:
alter database postgres set app.notification_function_url = 'https://<ref>.functions.supabase.co/send-notification';
alter database postgres set app.notification_secret = '<NOTIFICATION_WEBHOOK_SECRET>';

create or replace function public.enqueue_order_notification()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if new.status is distinct from old.status then
    begin
      perform net.http_post(
        url := current_setting('app.notification_function_url', true),
        headers := jsonb_build_object(
          'Content-Type', 'application/json',
          'x-webhook-secret', current_setting('app.notification_secret', true)
        ),
        body := jsonb_build_object('orderId', new.id, 'status', new.status)
      );
    exception when others then
      raise warning 'notification dispatch failed for order %: %', new.id, sqlerrm;
    end;
  end if;
  return new;
end $$;

create trigger trg_enqueue_order_notification
  after update of status on public.orders
  for each row execute function public.enqueue_order_notification();
```

## Notifiable statuses

Only customer‑facing milestones notify; internal hand‑offs (`ready_to_ship`,
`in_transit`, `sent_to_chef`, …) are skipped. Current set:
`awaiting_payment`, `paid`, `preparing`, `ready_for_pickup`, `completed`,
`pricing_sent_to_customer`, `custom_chef_approved`.

## Provider note

The endpoints/fields in `providers.ts` follow each gateway's documented SMS API
at the time of writing. Gateways change — verify against your provider's current
docs before go‑live. The provider layer is split into pure `buildRequest` /
`parseResponse` functions specifically so you can unit‑test any adjustment.
