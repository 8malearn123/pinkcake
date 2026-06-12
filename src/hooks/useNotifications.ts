import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import type { SupabaseClient, PostgrestError } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import type { NotificationProviderName, NotificationChannel } from '@/lib/notifications';

/**
 * The notification tables are created by a migration that may not be applied to
 * every environment yet, so they are not in the generated Supabase types. We use
 * an untyped client view and degrade gracefully (return null/[]) when the tables
 * are absent, rather than crashing the Settings page.
 */
const db = supabase as unknown as SupabaseClient;

export interface NotificationSettings {
  enabled: boolean;
  provider: NotificationProviderName;
  channel: NotificationChannel;
  base_url: string | null;
}

export interface NotificationLogEntry {
  id: string;
  order_number: string | null;
  status: string | null;
  channel: string;
  provider: string;
  recipient: string | null;
  send_status: 'pending' | 'sent' | 'failed' | 'skipped';
  attempts: number;
  error: string | null;
  created_at: string;
}

/** True when the failure is "relation does not exist" (migration not applied). */
function isMissingTable(error: PostgrestError | null): boolean {
  if (!error) return false;
  return (
    error.code === '42P01' ||
    error.code === 'PGRST205' ||
    /does not exist|schema cache/i.test(error.message ?? '')
  );
}

export const NOTIFICATIONS_NOT_PROVISIONED = Symbol('notifications-not-provisioned');

export function useNotificationSettings() {
  return useQuery({
    queryKey: ['notification-settings'],
    queryFn: async (): Promise<NotificationSettings | null> => {
      const { data, error } = await db
        .from('notification_settings')
        .select('enabled, provider, channel, base_url')
        .eq('id', true)
        .maybeSingle();
      if (error) {
        if (isMissingTable(error)) return null; // not provisioned yet
        throw error;
      }
      return (data as NotificationSettings | null) ?? null;
    },
    retry: false,
  });
}

export function useUpdateNotificationSettings() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (patch: Partial<NotificationSettings>) => {
      const { error } = await db
        .from('notification_settings')
        .update({ ...patch, updated_at: new Date().toISOString() })
        .eq('id', true);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notification-settings'] });
      toast({ title: 'تم الحفظ', description: 'تم تحديث إعدادات الإشعارات' });
    },
    onError: (error: Error) => {
      toast({ title: 'تعذّر الحفظ', description: error.message, variant: 'destructive' });
    },
  });
}

export function useNotificationLog(limit = 50) {
  return useQuery({
    queryKey: ['notification-log', limit],
    queryFn: async (): Promise<NotificationLogEntry[]> => {
      const { data, error } = await db
        .from('notification_log')
        .select('id, order_number, status, channel, provider, recipient, send_status, attempts, error, created_at')
        .order('created_at', { ascending: false })
        .limit(limit);
      if (error) {
        if (isMissingTable(error)) return [];
        throw error;
      }
      return (data as NotificationLogEntry[] | null) ?? [];
    },
    retry: false,
  });
}
