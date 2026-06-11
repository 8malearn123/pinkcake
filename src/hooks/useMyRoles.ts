import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useImpersonation } from '@/contexts/ImpersonationContext';

export type AppRole = 'admin' | 'call_center' | 'kitchen' | 'branch' | 'customer' | 'customer_support' | 'driver';

export function useMyRoles() {
  const { user } = useAuth();
  const { isImpersonating, impersonatedUser } = useImpersonation();

  return useQuery({
    queryKey: ['my-roles', user?.id, isImpersonating, impersonatedUser?.id],
    queryFn: async () => {
      // If impersonating, return the impersonated user's roles directly
      if (isImpersonating && impersonatedUser) {
        return impersonatedUser.roles as AppRole[];
      }

      if (!user) return [];

      // Use secure function to get own roles
      const { data, error } = await supabase.rpc('get_my_roles');

      if (error) throw error;
      return (data || []) as AppRole[];
    },
    enabled: !!user || isImpersonating,
    staleTime: 5 * 60 * 1000, // Cache for 5 minutes
  });
}

export function useHasRole(role: AppRole) {
  const { data: roles = [], isLoading } = useMyRoles();
  return {
    hasRole: roles.includes(role),
    isLoading,
  };
}

export function useIsAdmin() {
  const { isImpersonating } = useImpersonation();
  const { hasRole, isLoading } = useHasRole('admin');
  
  // When impersonating, we use the impersonated roles - never grant admin
  // unless the impersonated user is actually an admin
  return {
    hasRole: hasRole,
    isLoading,
    // Expose whether the REAL user (not impersonated) is admin
    isRealAdmin: !isImpersonating && hasRole,
  };
}

export function useMyBranch() {
  const { user } = useAuth();
  const { isImpersonating, impersonatedUser, getEffectiveBranch } = useImpersonation();

  return useQuery({
    queryKey: ['my-branch', user?.id, isImpersonating, impersonatedUser?.id],
    queryFn: async () => {
      // If impersonating, return the impersonated user's branch directly
      if (isImpersonating && impersonatedUser) {
        const branch = getEffectiveBranch();
        return branch;
      }

      if (!user) return null;

      const { data, error } = await supabase.rpc('get_my_branch');

      if (error) throw error;
      return data && data.length > 0 ? data[0] : null;
    },
    enabled: !!user || isImpersonating,
    staleTime: 5 * 60 * 1000,
  });
}

// Hook to get the effective user ID (impersonated or real)
export function useEffectiveUserId() {
  const { user } = useAuth();
  const { isImpersonating, impersonatedUser } = useImpersonation();
  
  if (isImpersonating && impersonatedUser) {
    return impersonatedUser.id;
  }
  
  return user?.id || null;
}
