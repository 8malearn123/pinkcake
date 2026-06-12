// Sends a customer SMS/WhatsApp when an order reaches a notifiable status.
//
// Invoked by a Supabase Database Webhook on `orders` UPDATE (recommended) or
// directly with { orderId, status }. Runs with the service role so it can read
// the customer's real phone — which is deliberately masked from staff clients.
// All notification logic lives in ./_core (generated from src/lib/notifications;
// see docs/notifications.md). Deploy with --no-verify-jwt and protect with the
// NOTIFICATION_WEBHOOK_SECRET shared secret.
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import {
  renderMessage,
  isNotifiableStatus,
  toE164KSA,
  maskPhone,
  withRetry,
  sendOrThrow,
  type NotificationChannel,
  type NotificationProviderName,
  type ProviderConfig,
} from './_core/index.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers':
    'authorization, x-client-info, apikey, content-type, x-webhook-secret',
};

const json = (status: number, body: unknown) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });

interface SettingsRow {
  enabled: boolean;
  provider: NotificationProviderName;
  channel: NotificationChannel;
  base_url: string | null;
}

/** Assemble provider credentials from Edge Function secrets. */
function providerConfig(provider: NotificationProviderName): ProviderConfig {
  const env = (k: string) => Deno.env.get(k) ?? undefined;
  switch (provider) {
    case 'unifonic':
      return { apiKey: env('UNIFONIC_APP_SID'), senderId: env('UNIFONIC_SENDER_ID') };
    case 'msegat':
      return {
        apiKey: env('MSEGAT_API_KEY'),
        username: env('MSEGAT_USERNAME'),
        senderId: env('MSEGAT_SENDER'),
      };
    case 'twilio':
      return {
        accountSid: env('TWILIO_ACCOUNT_SID'),
        authToken: env('TWILIO_AUTH_TOKEN'),
        from: env('TWILIO_FROM'),
      };
    default:
      return {};
  }
}

/** Pull orderId + new/old status out of either payload shape. */
function parseEvent(body: Record<string, unknown>): {
  orderId?: string;
  status?: string;
  previous?: string;
} {
  if (body.record && typeof body.record === 'object') {
    const rec = body.record as Record<string, unknown>;
    const old = (body.old_record ?? {}) as Record<string, unknown>;
    return { orderId: rec.id as string, status: rec.status as string, previous: old.status as string };
  }
  return { orderId: body.orderId as string, status: body.status as string };
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });

  // Shared-secret gate (the DB webhook is configured to send this header).
  const secret = Deno.env.get('NOTIFICATION_WEBHOOK_SECRET');
  if (secret && req.headers.get('x-webhook-secret') !== secret) {
    return json(401, { success: false, error: 'unauthorized' });
  }

  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
  );

  try {
    const { orderId, status, previous } = parseEvent(await req.json().catch(() => ({})));

    if (!orderId || !status) return json(400, { success: false, error: 'missing orderId/status' });
    if (previous !== undefined && previous === status) {
      return json(200, { success: true, skipped: 'status unchanged' });
    }
    if (!isNotifiableStatus(status)) {
      return json(200, { success: true, skipped: `status not customer-facing: ${status}` });
    }

    // Honour the admin toggle.
    const { data: settings } = await supabase
      .from('notification_settings')
      .select('enabled, provider, channel, base_url')
      .eq('id', true)
      .maybeSingle<SettingsRow>();

    if (!settings || !settings.enabled) {
      return json(200, { success: true, skipped: 'notifications disabled' });
    }

    // Read the order + customer (service role bypasses the PII masking).
    const { data: order, error: orderErr } = await supabase
      .from('orders')
      .select('order_number, tracking_code, customer_id, branch_id')
      .eq('id', orderId)
      .single();
    if (orderErr || !order) return json(404, { success: false, error: 'order not found' });

    const [{ data: customer }, { data: branch }] = await Promise.all([
      order.customer_id
        ? supabase.from('customers').select('name, phone').eq('id', order.customer_id).maybeSingle()
        : Promise.resolve({ data: null }),
      order.branch_id
        ? supabase.from('branches').select('name').eq('id', order.branch_id).maybeSingle()
        : Promise.resolve({ data: null }),
    ]);

    const body = renderMessage(status, {
      orderNumber: order.order_number,
      customerName: customer?.name ?? null,
      storeName: Deno.env.get('STORE_NAME') ?? 'Pink Cake',
      branchName: branch?.name ?? null,
      trackingCode: order.tracking_code,
      trackingBaseUrl: settings.base_url,
    });
    if (!body) return json(200, { success: true, skipped: 'no template' });

    const to = toE164KSA(customer?.phone);
    const logBase = {
      order_id: orderId,
      order_number: order.order_number,
      status,
      channel: settings.channel,
      provider: settings.provider,
      recipient: maskPhone(to),
      body,
    };

    if (!to) {
      await supabase
        .from('notification_log')
        .insert({ ...logBase, send_status: 'failed', error: 'invalid recipient phone' });
      return json(200, { success: false, error: 'invalid recipient phone' });
    }

    let attempts = 0;
    try {
      const providerId = await withRetry(
        () => {
          attempts++;
          return sendOrThrow(
            settings.provider,
            { to, body, channel: settings.channel },
            providerConfig(settings.provider)
          );
        },
        { retries: 2 }
      );
      await supabase.from('notification_log').insert({
        ...logBase,
        send_status: 'sent',
        attempts,
        provider_message_id: providerId || null,
        sent_at: new Date().toISOString(),
      });
      return json(200, { success: true, attempts });
    } catch (sendErr) {
      await supabase.from('notification_log').insert({
        ...logBase,
        send_status: 'failed',
        attempts,
        error: String((sendErr as Error)?.message ?? sendErr),
      });
      return json(200, { success: false, error: 'delivery failed', attempts });
    }
  } catch (err) {
    console.error('send-notification error:', err);
    return json(500, { success: false, error: 'unexpected error' });
  }
});
