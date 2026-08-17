// محرّك الرسائل التسويقية — «التسويق» ← «الرسائل التسويقية».
//
// يُستدعى من لوحة المدير مباشرةً (لا بمُجدوِل). لماذا خادمياً؟ للسبب نفسه الذي
// جعل إشعارات الطلبات وتذكيرات المناسبات خادمية: رقم الجوال الحقيقي مُقنَّع
// عمداً عن واجهات الموظفين، ومفاتيح المزوّدين لا تُشحن إلى المتصفّح. فالمتصفّح
// يحرّر النصّ ويختار الشريحة، وهذه الدالة هي التي تعرف الأرقام وترسل.
//
// ثلاث قواعد تُعاد هنا ولو فحصها المتصفّح، لأن المتصفّح ليس جهة إنفاذ:
//
//   ١) **الموافقة شرط لا خيار.** كل رسالة من هنا تحمل قيمة تسويقية، فهي تسويق
//      مباشر (نظام حماية البيانات م.٢٩) لا يشمله استثناء «التعامل السابق».
//      الاستعلام يبدأ بـ`consent_marketing = true` ولا توجد طريقة لتجاوزه.
//   ٢) **النافذة الزمنية.** ٠٨:٠٠–٢٢:٠٠ بتوقيت الرياض. خارجها تُرفض العملية.
//   ٣) **لا نراسل طرفاً ثالثاً.** شريحة «لديها مناسبة قريبة» تراسل صاحبة
//      السجلّ نفسها؛ `loyalty_occasions` تحفظ نصّاً وتاريخاً بلا وسيلة تواصل.
//
// نقص معروف وموثّق: **لا سجلّ خادمي للإرسال** — لا جدول `campaign_log` في هذه
// المرحلة (قرار المنتج: بلا هجرات). النتائج تعود في الردّ ويحفظها المتصفّح.
// قبل أي تسويق مباشر حقيقي يلزم جدول يثبت الموافقة لحظة الإرسال.
//
// النشر:
//   supabase functions deploy send-campaign
// يستخدم أسرار `send-notification` نفسها — لا أسرار جديدة.
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import {
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

type AudienceKey =
  | 'all_consented'
  | 'circle_tier'
  | 'lapsed_90d'
  | 'upcoming_occasion_30d'
  | 'never_ordered';

interface SettingsRow {
  enabled: boolean;
  provider: NotificationProviderName;
  channel: NotificationChannel;
  base_url: string | null;
}

interface Recipient {
  id: string;
  phone: string | null;
}

/** الرياض على UTC+3 ثابتاً بلا توقيت صيفي. مُكرَّرة عمداً: Deno لا يستورد من src/. */
const SEND_WINDOW_START = 8;
const SEND_WINDOW_END = 22;

function sendWindowBlock(now: Date): string | null {
  const hour = (now.getUTCHours() + 3) % 24;
  if (hour >= SEND_WINDOW_START && hour < SEND_WINDOW_END) return null;
  return `الإرسال الترويجي مسموح بين ٨ صباحاً و١٠ مساءً بتوقيت الرياض. الساعة الآن ${hour}:00.`;
}

/** الرمز في سطر مستقلّ — النسخ من رسالة نصّية على الهاتف أسهل هكذا. */
function renderBody(body: string, couponCode: string | null): string {
  const text = (body ?? '').trim();
  return couponCode ? `${text}\nرمزك: ${couponCode}` : text;
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

const daysAgo = (n: number) => new Date(Date.now() - n * 86_400_000).toISOString();

/**
 * أضيق واجهة يحتاجها حلّ الشريحة من عميل Supabase — بدل `any`، فيبقى
 * الملفّ نظيفاً تحت قاعدة `no-explicit-any` ويظلّ التوقيع موثِّقاً لما يُستعمل.
 */
interface QueryResult<T> {
  data: T[] | null;
  error: unknown;
}

interface Filter<T> extends PromiseLike<QueryResult<T>> {
  eq(column: string, value: unknown): Filter<T>;
  in(column: string, values: unknown[]): Filter<T>;
  gte(column: string, value: unknown): Filter<T>;
}

interface Db {
  from(table: string): { select<T>(columns: string): Filter<T> };
}

/**
 * حلّ الشريحة. كل فرع يبدأ من الموافِقات ثم يضيّق — الموافقة ليست مرشّحاً
 * يمكن نسيانه في فرع واحد.
 *
 * يعتمد على جداول قائمة فقط (`customers` و`orders` و`loyalty_*`)؛ لا جدول
 * جديد. الجداول التي لم تُهاجَر بعد تُعيد خطأً نحوّله إلى سبب مفهوم.
 */
async function resolveAudience(
  supabase: Db,
  audience: AudienceKey,
): Promise<{ recipients: Recipient[]; error: string | null }> {
  const consented = () =>
    supabase.from('customers').select<Recipient>('id, phone').eq('consent_marketing', true);

  try {
    if (audience === 'all_consented') {
      const { data, error } = await consented();
      if (error) throw error;
      return { recipients: data ?? [], error: null };
    }

    if (audience === 'circle_tier') {
      const { data: accounts, error: accErr } = await supabase
        .from('loyalty_accounts')
        .select<{ customer_id: string }>('customer_id')
        .eq('tier', 'circle');
      if (accErr) throw accErr;
      const ids = (accounts ?? []).map((a) => a.customer_id);
      if (ids.length === 0) return { recipients: [], error: null };
      const { data, error } = await consented().in('id', ids);
      if (error) throw error;
      return { recipients: data ?? [], error: null };
    }

    // الشرائح الثلاث الباقية تُبنى على من طلب ومتى.
    const { data: recentOrders, error: ordErr } = await supabase
      .from('orders')
      .select<{ customer_id: string | null }>('customer_id, created_at')
      .gte('created_at', daysAgo(90));
    if (ordErr) throw ordErr;
    const recentIds = new Set(
      (recentOrders ?? []).map((o) => o.customer_id).filter(Boolean) as string[],
    );

    if (audience === 'lapsed_90d' || audience === 'never_ordered') {
      const { data: everOrdered, error: everErr } = await supabase
        .from('orders')
        .select<{ customer_id: string | null }>('customer_id');
      if (everErr) throw everErr;
      const everIds = new Set(
        (everOrdered ?? []).map((o) => o.customer_id).filter(Boolean) as string[],
      );

      const { data, error } = await consented();
      if (error) throw error;
      const rows = data ?? [];

      // «لم تطلب منذ ٩٠ يوماً» تعني: طلبت يوماً ما، ولم تطلب مؤخّراً. من لم
      // تطلب قطّ شريحة أخرى برسالة أخرى — خلطهما يُرسل «اشتقنا لك» لمن لم تشترِ.
      const filtered =
        audience === 'never_ordered'
          ? rows.filter((r) => !everIds.has(r.id))
          : rows.filter((r) => everIds.has(r.id) && !recentIds.has(r.id));
      return { recipients: filtered, error: null };
    }

    // upcoming_occasion_30d
    const { data: occasions, error: occErr } = await supabase
      .from('loyalty_occasions')
      .select<{ customer_id: string; occasion_day: number; occasion_month: number }>(
        'customer_id, occasion_day, occasion_month',
      );
    if (occErr) throw occErr;

    const today = new Date();
    const withinMonth = new Set<string>();
    for (const row of occasions ?? []) {
      const lastDay = new Date(today.getFullYear(), row.occasion_month, 0).getDate();
      let next = new Date(
        today.getFullYear(),
        row.occasion_month - 1,
        Math.min(row.occasion_day, lastDay),
      );
      if (next < today) next = new Date(next.setFullYear(today.getFullYear() + 1));
      const days = Math.round((next.getTime() - today.getTime()) / 86_400_000);
      if (days >= 0 && days <= 30) withinMonth.add(row.customer_id);
    }

    if (withinMonth.size === 0) return { recipients: [], error: null };
    const { data, error } = await consented().in('id', [...withinMonth]);
    if (error) throw error;
    return { recipients: data ?? [], error: null };
  } catch (err) {
    const message = String((err as Error)?.message ?? err);
    if (/does not exist|schema cache|relation/i.test(message)) {
      return {
        recipients: [],
        error: 'جداول الولاء غير مُهيّأة على هذا المشروع — طبّق الهجرات أولاً.',
      };
    }
    return { recipients: [], error: message };
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
    const payload = (await req.json()) as {
      audience?: AudienceKey;
      channel?: NotificationChannel;
      body?: string;
      couponCode?: string | null;
      dryRun?: boolean;
    };

    const audience = payload.audience ?? 'all_consented';
    const dryRun = !!payload.dryRun;
    const sample = renderBody(payload.body ?? '', payload.couponCode ?? null);

    const blocked = (result: string) =>
      json(200, {
        dryRun,
        recipients: 0,
        sent: 0,
        failed: 0,
        sample,
        results: [],
        blockedReason: result,
      });

    if (sample.trim().length < 10) return blocked('نصّ الرسالة قصير جداً.');

    // النافذة تُفحص حتى في المعاينة، كي لا يعِد الزرّ بما سيُرفض بعد ثانية.
    const windowBlock = sendWindowBlock(new Date());
    if (windowBlock) return blocked(windowBlock);

    const { data: settings } = await supabase
      .from('notification_settings')
      .select('enabled, provider, channel, base_url')
      .eq('id', true)
      .maybeSingle<SettingsRow>();

    if (!settings?.enabled) {
      return blocked('الإشعارات موقوفة — فعّلها من الإعدادات ← الإشعارات أولاً.');
    }

    const { recipients, error: audienceError } = await resolveAudience(
      supabase as unknown as Db,
      audience,
    );
    if (audienceError) return blocked(audienceError);

    if (dryRun) {
      return json(200, {
        dryRun: true,
        recipients: recipients.length,
        sent: 0,
        failed: 0,
        sample,
        results: [],
        blockedReason: null,
      });
    }

    const channel = payload.channel ?? settings.channel;
    const config = providerConfig(settings.provider);

    let sent = 0;
    let failed = 0;
    const results: { maskedPhone: string; ok: boolean; error: string | null }[] = [];

    for (const recipient of recipients) {
      const to = toE164KSA(recipient.phone);
      if (!to) {
        failed++;
        results.push({ maskedPhone: maskPhone(recipient.phone ?? ''), ok: false, error: 'رقم غير صالح' });
        continue;
      }
      try {
        await withRetry(() => sendOrThrow(settings.provider, { to, body: sample, channel }, config), {
          retries: 2,
        });
        sent++;
        // العيّنة محدودة عمداً: ردّ فيه آلاف الأسطر لا يُقرأ ولا يُعرض.
        if (results.length < 25) results.push({ maskedPhone: maskPhone(to), ok: true, error: null });
      } catch (sendErr) {
        failed++;
        const message = String((sendErr as Error)?.message ?? sendErr);
        if (results.length < 25) results.push({ maskedPhone: maskPhone(to), ok: false, error: message });
      }
    }

    console.log(
      `[send-campaign] audience=${audience} recipients=${recipients.length} sent=${sent} failed=${failed}`,
    );

    return json(200, {
      dryRun: false,
      recipients: recipients.length,
      sent,
      failed,
      sample,
      results,
      blockedReason: null,
    });
  } catch (err) {
    console.error('[send-campaign] error', err);
    return json(500, { success: false, error: String((err as Error)?.message ?? err) });
  }
});
