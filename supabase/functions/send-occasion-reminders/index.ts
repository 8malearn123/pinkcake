// محرّك تذكير المناسبات — «دائرة المناسبات».
//
// يُشغَّل مرّة يومياً (Cron Job في Supabase، أو أي مُجدوِل خارجي يستدعيه بمفتاح
// مشترك). يقرأ المناسبات المستحقّة اليوم ويرسل تذكيراً واحداً لكل واحدة.
//
// لماذا خادمياً؟ للسبب نفسه الذي جعل إشعارات الطلبات خادمية: رقم الجوال الحقيقي
// مُقنَّع عمداً عن واجهات الموظفين، ومفاتيح المزوّدين لا تُشحن إلى المتصفّح.
//
// قاعدتان لا تُخالَفان هنا:
//
//   ١) **عائلتا قالب، لا واحدة.** التذكير المجرّد (بلا سعر ولا عرض) يستند إلى
//      استثناء «التعامل السابق»؛ وأي رسالة تحمل عرضاً هي تسويق مباشر لا استثناء
//      فيه. لذلك نقرأ موافقة العميلة ونختار العائلة بناءً عليها — ولا نرسل
//      رسالة تسويقية لمن لم توافق، أبداً.
//
//   ٢) **لا نراسل طرفاً ثالثاً.** المناسبة تحمل اسماً نصّياً وتاريخاً فقط؛
//      المستقبِل هو العميلة نفسها التي حفظت المناسبة، لا من حُفظت باسمه.
//
// النشر:
//   supabase functions deploy send-occasion-reminders
//   supabase secrets set NOTIFICATION_WEBHOOK_SECRET="…" STORE_NAME="Pink Cake"
// ثم جدولة استدعاء يومي (يُفضّل ١٠:٠٠ بتوقيت الرياض — ضمن نافذة الإرسال
// المسموح بها للرسائل الترويجية ٠٨:٠٠–٢٢:٠٠).
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import {
  renderOccasionReminder,
  toE164KSA,
  maskPhone,
  withRetry,
  sendOrThrow,
  type NotificationChannel,
  type NotificationProviderName,
  type ProviderConfig,
} from '../send-notification/_core/index.ts';

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

interface DueReminder {
  occasion_id: string;
  customer_id: string;
  customer_name: string | null;
  customer_phone: string | null;
  label: string;
  occasion_type: string;
  lead_days: number;
  cycle_year: number;
  consent_marketing: boolean;
}

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

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });

  const secret = Deno.env.get('NOTIFICATION_WEBHOOK_SECRET');
  if (secret && req.headers.get('x-webhook-secret') !== secret) {
    return json(401, { success: false, error: 'unauthorized' });
  }

  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
  );

  try {
    // البرنامج والإشعارات لهما مفتاحان منفصلان — كلاهما يجب أن يكون مُفعّلاً.
    const [{ data: settings }, { data: loyalty }] = await Promise.all([
      supabase
        .from('notification_settings')
        .select('enabled, provider, channel, base_url')
        .eq('id', true)
        .maybeSingle<SettingsRow>(),
      supabase.from('loyalty_settings').select('enabled').eq('id', true).maybeSingle(),
    ]);

    if (!settings?.enabled) return json(200, { success: true, skipped: 'notifications disabled' });
    if (!loyalty?.enabled) return json(200, { success: true, skipped: 'loyalty disabled' });

    const { data: due, error } = await supabase.rpc('get_due_occasion_reminders');
    if (error) throw error;

    const rows = (due ?? []) as DueReminder[];
    const storeName = Deno.env.get('STORE_NAME') ?? 'Pink Cake';
    const shopUrl = settings.base_url ? `${settings.base_url.replace(/\/$/, '')}/shop` : null;

    let sent = 0;
    let failed = 0;
    let skipped = 0;

    for (const row of rows) {
      // التسويقية للموافِقات فقط؛ ومن لم توافق تصلها الصيغة المجرّدة.
      const kind: 'utility' | 'marketing' = row.consent_marketing ? 'marketing' : 'utility';

      const body = renderOccasionReminder({
        label: row.label,
        occasionType: row.occasion_type,
        leadDays: row.lead_days,
        storeName,
        // الرابط دعوة للشراء، فلا يُرفق في الصيغة المجرّدة.
        shopUrl: kind === 'marketing' ? shopUrl : null,
        kind,
      });

      const to = toE164KSA(row.customer_phone);

      if (!body || !to) {
        skipped++;
        await supabase.rpc('log_occasion_reminder', {
          _occasion_id: row.occasion_id,
          _customer_id: row.customer_id,
          _cycle_year: row.cycle_year,
          _lead_days: row.lead_days,
          _channel: settings.channel,
          _template_kind: kind,
          _send_status: 'skipped',
          _error: !to ? 'invalid recipient phone' : 'no template for lead window',
        });
        continue;
      }

      try {
        await withRetry(
          () =>
            sendOrThrow(
              settings.provider,
              { to, body, channel: settings.channel },
              providerConfig(settings.provider),
            ),
          { retries: 2 },
        );
        sent++;
        // يُسجَّل بعد الإرسال لا قبله، والفهرس الفريد في القاعدة يمنع التكرار
        // لو شُغّلت المهمة مرّتين في اليوم نفسه.
        await supabase.rpc('log_occasion_reminder', {
          _occasion_id: row.occasion_id,
          _customer_id: row.customer_id,
          _cycle_year: row.cycle_year,
          _lead_days: row.lead_days,
          _channel: settings.channel,
          _template_kind: kind,
          _send_status: 'sent',
          _error: null,
        });
      } catch (sendErr) {
        failed++;
        await supabase.rpc('log_occasion_reminder', {
          _occasion_id: row.occasion_id,
          _customer_id: row.customer_id,
          _cycle_year: row.cycle_year,
          _lead_days: row.lead_days,
          _channel: settings.channel,
          _template_kind: kind,
          _send_status: 'failed',
          _error: String((sendErr as Error)?.message ?? sendErr),
        });
      }
    }

    console.log(
      `[occasion-reminders] due=${rows.length} sent=${sent} failed=${failed} skipped=${skipped}`,
    );
    return json(200, { success: true, due: rows.length, sent, failed, skipped });
  } catch (err) {
    console.error('send-occasion-reminders error:', err);
    return json(500, { success: false, error: 'unexpected error' });
  }
});
