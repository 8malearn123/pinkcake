/**
 * نداء دوال الصفحة الرئيسية.
 *
 * عبر عرض غير مُنمَّط لأن `src/integrations/supabase/types.ts` مولَّد وقديم
 * (تنقصه جداول الولاء والإشعارات أصلاً)، وهو نفس ما تفعله `useLoyaltyAdmin.ts`.
 * الحارس الحقيقي على شكل البيانات هو مخطّطات zod في `./schema.ts`.
 */
import { supabase } from '@/integrations/supabase/client';

type UntypedRpc = {
  rpc: (fn: string, args?: Record<string, unknown>) => Promise<{ data: unknown; error: unknown }>;
};

export async function callHomepageRpc<T>(fn: string, args?: Record<string, unknown>): Promise<T> {
  const { data, error } = await (supabase as unknown as UntypedRpc).rpc(fn, args);
  if (error) throw error as Error;
  return data as T;
}
