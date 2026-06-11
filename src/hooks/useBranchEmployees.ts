import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';

export interface BranchEmployeeCount {
  branch_id: string;
  count: number;
}

export interface BranchEmployee {
  user_id: string;
  full_name: string | null;
  phone: string | null;
  avatar_url: string | null;
  roles: string[];
}

export function useBranchEmployeeCounts() {
  return useQuery({
    queryKey: ['branch-employee-counts'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('user_branch_assignments')
        .select('branch_id');

      if (error) throw error;

      // Count employees per branch
      const counts: Record<string, number> = {};
      (data || []).forEach((assignment) => {
        counts[assignment.branch_id] = (counts[assignment.branch_id] || 0) + 1;
      });

      return counts;
    },
  });
}

export function useBranchEmployees(branchId: string | null) {
  return useQuery({
    queryKey: ['branch-employees', branchId],
    queryFn: async () => {
      if (!branchId) return [];

      // Get all assignments for this branch
      const { data: assignments, error: assignmentsError } = await supabase
        .from('user_branch_assignments')
        .select('user_id')
        .eq('branch_id', branchId);

      if (assignmentsError) throw assignmentsError;
      if (!assignments || assignments.length === 0) return [];

      const userIds = assignments.map((a) => a.user_id);

      // Get profiles for these users
      const { data: profiles, error: profilesError } = await supabase
        .from('profiles')
        .select('id, full_name, phone, avatar_url')
        .in('id', userIds);

      if (profilesError) throw profilesError;

      // Get roles for these users
      const { data: roles, error: rolesError } = await supabase
        .from('user_roles')
        .select('user_id, role')
        .in('user_id', userIds);

      if (rolesError) throw rolesError;

      // Combine data
      const employees: BranchEmployee[] = (profiles || []).map((profile) => ({
        user_id: profile.id,
        full_name: profile.full_name,
        phone: profile.phone,
        avatar_url: profile.avatar_url,
        roles: (roles || [])
          .filter((r) => r.user_id === profile.id)
          .map((r) => r.role),
      }));

      return employees;
    },
    enabled: !!branchId,
  });
}

export function useAvailableEmployees(branchId: string | null) {
  return useQuery({
    queryKey: ['available-employees', branchId],
    queryFn: async () => {
      // Get all profiles
      const { data: profiles, error: profilesError } = await supabase
        .from('profiles')
        .select('id, full_name, phone');

      if (profilesError) throw profilesError;

      // Get all current assignments
      const { data: assignments, error: assignmentsError } = await supabase
        .from('user_branch_assignments')
        .select('user_id');

      if (assignmentsError) throw assignmentsError;

      const assignedUserIds = new Set((assignments || []).map((a) => a.user_id));

      // Filter to only unassigned employees
      return (profiles || []).filter((p) => !assignedUserIds.has(p.id));
    },
    enabled: !!branchId,
  });
}

export function useAssignEmployeeToBranch() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ userId, branchId }: { userId: string; branchId: string }) => {
      const { data, error } = await supabase
        .from('user_branch_assignments')
        .insert({ user_id: userId, branch_id: branchId })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['branch-employees', variables.branchId] });
      queryClient.invalidateQueries({ queryKey: ['available-employees'] });
      queryClient.invalidateQueries({ queryKey: ['users'] });
      toast({
        title: 'تم التعيين',
        description: 'تم تعيين الموظف للفرع بنجاح',
      });
    },
    onError: (error) => {
      toast({
        title: 'خطأ',
        description: 'فشل في تعيين الموظف: ' + error.message,
        variant: 'destructive',
      });
    },
  });
}

export function useRemoveEmployeeFromBranch() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ userId, branchId }: { userId: string; branchId: string }) => {
      const { error } = await supabase
        .from('user_branch_assignments')
        .delete()
        .eq('user_id', userId)
        .eq('branch_id', branchId);

      if (error) throw error;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['branch-employees', variables.branchId] });
      queryClient.invalidateQueries({ queryKey: ['available-employees'] });
      queryClient.invalidateQueries({ queryKey: ['users'] });
      toast({
        title: 'تم الإزالة',
        description: 'تم إزالة الموظف من الفرع بنجاح',
      });
    },
    onError: (error) => {
      toast({
        title: 'خطأ',
        description: 'فشل في إزالة الموظف: ' + error.message,
        variant: 'destructive',
      });
    },
  });
}
