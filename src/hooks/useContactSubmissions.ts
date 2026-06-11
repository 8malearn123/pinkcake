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
      
      let submissions = (data || []) as ContactSubmission[];
      
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
    }: {
      id: string;
      status?: SubmissionStatus;
      internal_notes?: string;
    }) => {
      // Use secure RPC function for audited updates
      const { error } = await supabase.rpc('update_contact_submission_secure', {
        _submission_id: id,
        _status: status || null,
        _internal_notes: internal_notes !== undefined ? internal_notes : null,
      });

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
