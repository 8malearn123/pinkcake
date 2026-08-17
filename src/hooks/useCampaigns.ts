import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { isMissingFunction } from '@/hooks/useMarketing';
import type {
  AudienceKey,
  CampaignDraft,
  CampaignMessage,
  CampaignSendResult,
} from '@/lib/marketing/types';

/**
 * «الرسائل التسويقية».
 *
 * الإرسال **لا يحدث في المتصفّح**، وهذا ليس تفضيلاً: أرقام العميلات مُقنَّعة
 * عمداً عن واجهات الموظفين، ومفاتيح المزوّدين أسرارٌ لدالة الحافّة. فالمتصفّح
 * يحرّر الحملة ويستدعي `send-campaign`، والدالة هي التي تقرأ الشريحة وتتحقّق
 * من الموافقة والنافذة الزمنية وترسل.
 *
 * التسجيل خطوة ثانية صريحة (`record_campaign_send`) بعد عودة النتيجة: الإرسال
 * حدث خادمياً، وحفظ أثره في هذه المرحلة يحدث في المتصفّح — وهي ثغرة تدقيق
 * معروفة موثّقة في الخطة، تُغلق بجدول `campaign_log` عند أوّل هجرة.
 */

type UntypedRpc = {
  rpc: (fn: string, args?: Record<string, unknown>) => Promise<{ data: unknown; error: unknown }>;
};

const rpc = () => supabase as unknown as UntypedRpc;

async function callRpc<T>(fn: string, args?: Record<string, unknown>): Promise<T | null> {
  const { data, error } = await rpc().rpc(fn, args);
  if (error) {
    if (isMissingFunction(error)) return null;
    throw error as Error;
  }
  return data as T;
}

function assertWrite(data: unknown, fallback: string) {
  const row = (Array.isArray(data) ? data[0] : data) as { success?: boolean; message?: string } | null;
  if (row && row.success === false) throw new Error(row.message || fallback);
  return row ?? {};
}

const CAMPAIGNS_KEY = ['marketing', 'campaigns'] as const;
const OVERVIEW_KEY = ['marketing', 'overview'] as const;

export function useCampaigns() {
  return useQuery({
    queryKey: CAMPAIGNS_KEY,
    queryFn: async () => (await callRpc<CampaignMessage[]>('get_campaigns')) ?? [],
  });
}

export function useAudienceSize(audience: AudienceKey) {
  return useQuery({
    queryKey: ['marketing', 'audience', audience],
    queryFn: async () => (await callRpc<number>('get_audience_size', { _audience: audience })) ?? 0,
  });
}

function useCampaignWrite<TVars>(
  fn: (vars: TVars) => Promise<unknown>,
  success: string,
  failure: string,
) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: fn,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: CAMPAIGNS_KEY });
      queryClient.invalidateQueries({ queryKey: OVERVIEW_KEY });
      toast({ title: success });
    },
    onError: (error: Error) =>
      toast({ title: failure, description: error.message, variant: 'destructive' }),
  });
}

export function useCreateCampaign() {
  return useCampaignWrite<CampaignDraft>(
    async (draft) => assertWrite(await callRpc('create_campaign', { _draft: draft }), 'تعذّر حفظ الحملة'),
    'تم حفظ الحملة',
    'تعذّر حفظ الحملة',
  );
}

export function useUpdateCampaign() {
  return useCampaignWrite<{ id: string; draft: CampaignDraft }>(
    async ({ id, draft }) =>
      assertWrite(await callRpc('update_campaign', { _id: id, _draft: draft }), 'تعذّر حفظ الحملة'),
    'تم حفظ الحملة',
    'تعذّر حفظ الحملة',
  );
}

export function useDeleteCampaign() {
  return useCampaignWrite<string>(
    async (id) => assertWrite(await callRpc('delete_campaign', { _id: id }), 'تعذّر حذف الحملة'),
    'تم حذف الحملة',
    'تعذّر حذف الحملة',
  );
}

export interface SendCampaignInput {
  /** null في المعاينة قبل الحفظ — لا يُسجَّل شيء حينها. */
  id: string | null;
  audience: AudienceKey;
  channel: 'sms' | 'whatsapp';
  body: string;
  couponCode: string | null;
  /** true = احسب الشريحة واعرض عيّنة بلا إرسال. */
  dryRun: boolean;
}

const EMPTY_RESULT: CampaignSendResult = {
  dryRun: true,
  recipients: 0,
  sent: 0,
  failed: 0,
  sample: '',
  results: [],
  blockedReason: 'خدمة الرسائل غير مُهيّأة على هذا الخادم.',
};

/**
 * تستدعي دالة الحافّة، ثم — للإرسال الحقيقي فقط — تسجّل النتيجة على الحملة.
 * `blockedReason` ليس خطأً: هو رفض متوقّع (خارج نافذة الإرسال، أو الإشعارات
 * موقوفة) ويُعرض كتنبيه لا كفشل.
 */
export function useSendCampaign() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: SendCampaignInput): Promise<CampaignSendResult> => {
      const { data, error } = await supabase.functions.invoke('send-campaign', {
        body: {
          audience: input.audience,
          channel: input.channel,
          body: input.body,
          couponCode: input.couponCode,
          dryRun: input.dryRun,
        },
      });
      if (error) throw error as Error;

      const result = (data ?? {}) as Partial<CampaignSendResult>;
      // دالة غير منشورة تردّ `{ success: true }` بلا حقول — نكشفها بدل أن
      // نعرض «أُرسلت إلى ٠» وكأن شيئاً جرى.
      if (typeof result.recipients !== 'number') return EMPTY_RESULT;

      const settled: CampaignSendResult = {
        dryRun: !!result.dryRun,
        recipients: result.recipients,
        sent: result.sent ?? 0,
        failed: result.failed ?? 0,
        sample: result.sample ?? '',
        results: result.results ?? [],
        blockedReason: result.blockedReason ?? null,
      };

      if (!input.dryRun && !settled.blockedReason && input.id) {
        await callRpc('record_campaign_send', {
          _id: input.id,
          _recipients: settled.recipients,
          _delivered: settled.sent,
          _failed: settled.failed,
        });
      }
      return settled;
    },
    onSuccess: (result, input) => {
      queryClient.invalidateQueries({ queryKey: CAMPAIGNS_KEY });
      queryClient.invalidateQueries({ queryKey: OVERVIEW_KEY });
      if (result.blockedReason) {
        toast({ title: 'لم تُرسل الحملة', description: result.blockedReason, variant: 'destructive' });
        return;
      }
      if (input.dryRun) return; // المعاينة تُعرض في اللوحة، لا في تنبيه
      toast({
        title: 'تم إرسال الحملة',
        description: `وصلت إلى ${result.sent} من ${result.recipients}`,
      });
    },
    onError: (error: Error) =>
      toast({ title: 'تعذّر الإرسال', description: error.message, variant: 'destructive' }),
  });
}
