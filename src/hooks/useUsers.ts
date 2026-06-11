import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Tables, Enums } from '@/integrations/supabase/types';
import { toast } from '@/hooks/use-toast';

type Profile = Tables<'profiles'>;
type UserRole = Tables<'user_roles'>;
type AppRole = Enums<'app_role'>;

export interface UserWithRole extends Profile {
  user_roles: UserRole[];
  user_branch_assignments: { branch_id: string; branch_name: string | null }[];
}

export function useUsers() {
  return useQuery({
    queryKey: ['users'],
    queryFn: async () => {
      // Use secure RPC function that handles admin check server-side
      // This function returns all profiles for admin users only
      
      // Fetch profiles via secure RPC - handles admin check internally
      // Note: phone is NOT returned - must use get_profile_phone_audited
      const { data: profiles, error: profilesError } = await supabase
        .rpc('get_all_profiles_for_admin');
      
      if (profilesError) throw profilesError;

      // Fetch all user roles - admin can see all
      const { data: roles, error: rolesError } = await supabase
        .from('user_roles')
        .select('*');
      
      if (rolesError) throw rolesError;

      // Fetch all branch assignments with branch names
      const { data: assignments, error: assignmentsError } = await supabase
        .from('user_branch_assignments')
        .select('user_id, branch_id, branches(name)');
      
      if (assignmentsError) throw assignmentsError;

      // Combine data - phone excluded entirely, must use audited function
      const usersWithRoles: UserWithRole[] = (profiles || []).map((profile) => ({
        ...profile,
        phone: null, // Phone access requires audited function: get_profile_phone_audited
        user_roles: (roles || []).filter((r) => r.user_id === profile.id),
        user_branch_assignments: (assignments || [])
          .filter((a) => a.user_id === profile.id)
          .map((a) => ({
            branch_id: a.branch_id,
            branch_name: (a.branches as { name: string } | null)?.name || null,
          })),
      }));

      return usersWithRoles;
    },
  });
}

export function useAssignRole() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ userId, role }: { userId: string; role: AppRole }) => {
      // First check if role already exists
      const { data: existing } = await supabase
        .from('user_roles')
        .select('id')
        .eq('user_id', userId)
        .eq('role', role)
        .maybeSingle();

      if (existing) {
        throw new Error('هذا الدور معين بالفعل لهذا المستخدم');
      }

      const { data, error } = await supabase
        .from('user_roles')
        .insert({ user_id: userId, role })
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      toast({
        title: 'تم التعيين',
        description: 'تم تعيين الدور بنجاح',
      });
    },
    onError: (error) => {
      toast({
        title: 'خطأ',
        description: error.message,
        variant: 'destructive',
      });
    },
  });
}

export function useRemoveRole() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ userId, role }: { userId: string; role: AppRole }) => {
      const { error } = await supabase
        .from('user_roles')
        .delete()
        .eq('user_id', userId)
        .eq('role', role);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      toast({
        title: 'تم الإزالة',
        description: 'تم إزالة الدور بنجاح',
      });
    },
    onError: (error) => {
      toast({
        title: 'خطأ',
        description: 'فشل في إزالة الدور: ' + error.message,
        variant: 'destructive',
      });
    },
  });
}

export function useAssignBranch() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ userId, branchId }: { userId: string; branchId: string }) => {
      // First remove any existing assignment
      await supabase
        .from('user_branch_assignments')
        .delete()
        .eq('user_id', userId);

      const { data, error } = await supabase
        .from('user_branch_assignments')
        .insert({ user_id: userId, branch_id: branchId })
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      toast({
        title: 'تم التعيين',
        description: 'تم تعيين الفرع بنجاح',
      });
    },
    onError: (error) => {
      toast({
        title: 'خطأ',
        description: 'فشل في تعيين الفرع: ' + error.message,
        variant: 'destructive',
      });
    },
  });
}

export function useRemoveBranchAssignment() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (userId: string) => {
      const { error } = await supabase
        .from('user_branch_assignments')
        .delete()
        .eq('user_id', userId);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      toast({
        title: 'تم الإزالة',
        description: 'تم إزالة تعيين الفرع بنجاح',
      });
    },
    onError: (error) => {
      toast({
        title: 'خطأ',
        description: 'فشل في إزالة تعيين الفرع: ' + error.message,
        variant: 'destructive',
      });
    },
  });
}

export const ROLE_LABELS: Record<AppRole, string> = {
  admin: 'مدير النظام',
  call_center: 'كول سنتر',
  kitchen: 'المطبخ',
  branch: 'فرع',
  customer: 'عميل',
  customer_support: 'خدمة العملاء',
  driver: 'سائق توصيل',
};

export const ROLE_COLORS: Record<AppRole, string> = {
  admin: 'bg-purple-100 text-purple-800',
  call_center: 'bg-blue-100 text-blue-800',
  kitchen: 'bg-orange-100 text-orange-800',
  branch: 'bg-green-100 text-green-800',
  customer: 'bg-pink-100 text-pink-800',
  customer_support: 'bg-teal-100 text-teal-800',
  driver: 'bg-cyan-100 text-cyan-800',
};
