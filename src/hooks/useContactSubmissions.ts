import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';

export type SubmissionType = 'contact' | 'custom_order' | 'complaint';
export type SubmissionStatus = 'new' | 'in_progress' | 'closed';

export interface ContactSubmission {
  id: string;
  submission_type: SubmissionType;
  customer_name: string;
  phone: string;
  email: string | null;
  message: string;
  status: SubmissionStatus;
  internal_notes: string | null;
  resolution_type?: string | null;
  linked_order_id?: string | null;
  assigned_to: string | null;
  created_at: string;
  updated_at: string;
}

export function useContactSubmissions(type?: SubmissionType) {
  return useQuery({
    queryKey: ['contact-submissions', type],
    queryFn: async () => {
      // Use secure RPC function that enforces role checks and data masking
      const { data, error } = await supabase.rpc('get_contact_submissions_secure');

      if (error) throw error;
      
      // Copy each row: the demo mutates SUBMISSIONS in place, so returning the
      // live reference would make React Query miss status/notes/resolution edits.
      let submissions = ((data || []) as ContactSubmission[]).map((s) => ({ ...s }));

      // Filter by type if specified
      if (type) {
        submissions = submissions.filter(s => s.submission_type === type);
      }
      
      return submissions;
    },
    staleTime: 30 * 1000, // 30 seconds
  });
}

export function useUpdateSubmission() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      id,
      status,
      internal_notes,
      resolution_type,
      linked_order_id,
    }: {
      id: string;
      status?: SubmissionStatus;
      internal_notes?: string;
      resolution_type?: string | null;
      linked_order_id?: string | null;
    }) => {
      // Only send the fields being changed. Called through an untyped view since
      // the resolution/linked-order args aren't in the generated RPC types yet.
      const args: Record<string, unknown> = { _submission_id: id };
      if (status !== undefined) args._status = status;
      if (internal_notes !== undefined) args._internal_notes = internal_notes;
      if (resolution_type !== undefined) args._resolution_type = resolution_type;
      if (linked_order_id !== undefined) args._linked_order_id = linked_order_id;

      const client = supabase as unknown as {
        rpc: (fn: string, a?: Record<string, unknown>) => Promise<{ data: unknown; error: unknown }>;
      };
      const { error } = await client.rpc('update_contact_submission_secure', args);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['contact-submissions'] });
      toast({
        title: 'تم التحديث',
        description: 'تم تحديث الطلب بنجاح',
      });
    },
    onError: (error) => {
      console.error('Update error:', error);
      toast({
        title: 'خطأ',
        description: 'فشل تحديث الطلب',
        variant: 'destructive',
      });
    },
  });
}
