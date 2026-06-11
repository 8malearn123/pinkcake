import { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';

export type AppRole = 'admin' | 'call_center' | 'kitchen' | 'branch' | 'customer' | 'customer_support' | 'driver';

interface ImpersonatedUser {
  id: string;
  fullName: string;
  roles: AppRole[];
  branchId?: string | null;
  branchName?: string | null;
}

interface ImpersonationContextType {
  isImpersonating: boolean;
  impersonatedUser: ImpersonatedUser | null;
  originalAdminId: string | null;
  startImpersonation: (targetUserId: string, secretCode: string) => Promise<boolean>;
  endImpersonation: () => Promise<void>;
  getEffectiveRoles: () => AppRole[];
  getEffectiveBranch: () => { id: string; name: string } | null;
}

const ImpersonationContext = createContext<ImpersonationContextType | undefined>(undefined);

// Session storage keys - not localStorage to prevent persistence across sessions
const IMPERSONATION_KEY = 'admin_impersonation';

// Get role-based landing page for redirect
const getRoleLandingPage = (roles: AppRole[]): string => {
  if (roles.includes('admin')) return '/dashboard';
  if (roles.includes('call_center')) return '/dashboard';
  if (roles.includes('customer_support')) return '/submissions';
  if (roles.includes('kitchen')) return '/kitchen';
  if (roles.includes('branch')) return '/branch-orders';
  if (roles.includes('driver')) return '/driver';
  if (roles.includes('customer')) return '/my-orders';
  return '/store';
};

export function ImpersonationProvider({ children }: { children: ReactNode }) {
  const [isImpersonating, setIsImpersonating] = useState(false);
  const [impersonatedUser, setImpersonatedUser] = useState<ImpersonatedUser | null>(null);
  const [originalAdminId, setOriginalAdminId] = useState<string | null>(null);

  // Restore impersonation state from session on mount
  useEffect(() => {
    const stored = sessionStorage.getItem(IMPERSONATION_KEY);
    if (stored) {
      try {
        const data = JSON.parse(stored);
        setIsImpersonating(true);
        setImpersonatedUser(data.impersonatedUser);
        setOriginalAdminId(data.originalAdminId);
      } catch (e) {
        sessionStorage.removeItem(IMPERSONATION_KEY);
      }
    }
  }, []);

  const getEffectiveRoles = useCallback((): AppRole[] => {
    if (isImpersonating && impersonatedUser) {
      return impersonatedUser.roles;
    }
    return [];
  }, [isImpersonating, impersonatedUser]);

  const getEffectiveBranch = useCallback(() => {
    if (isImpersonating && impersonatedUser && impersonatedUser.branchId) {
      return {
        id: impersonatedUser.branchId,
        name: impersonatedUser.branchName || ''
      };
    }
    return null;
  }, [isImpersonating, impersonatedUser]);

  const startImpersonation = useCallback(async (targetUserId: string, secretCode: string): Promise<boolean> => {
    try {
      const { data: sessionData } = await supabase.auth.getSession();
      if (!sessionData.session) {
        toast({
          title: 'خطأ',
          description: 'يجب تسجيل الدخول أولاً',
          variant: 'destructive',
        });
        return false;
      }

      const { data, error } = await supabase.functions.invoke('admin-impersonate', {
        body: {
          action: 'start',
          targetUserId,
          secretCode,
        },
      });

      if (error) {
        console.error('Impersonation error:', error);
        toast({
          title: 'خطأ',
          description: error.message || 'فشل في بدء التحكم الإداري',
          variant: 'destructive',
        });
        return false;
      }

      if (data?.error) {
        toast({
          title: 'خطأ',
          description: data.error,
          variant: 'destructive',
        });
        return false;
      }

      if (data?.success) {
        const userRoles = (data.impersonatedUser.roles || []) as AppRole[];
        
        const impersonationData = {
          impersonatedUser: {
            id: data.impersonatedUser.id,
            fullName: data.impersonatedUser.fullName,
            roles: userRoles,
            branchId: data.impersonatedUser.branchId || null,
            branchName: data.impersonatedUser.branchName || null,
          },
          originalAdminId: data.adminId,
        };

        // Store in session storage (cleared when browser closes)
        sessionStorage.setItem(IMPERSONATION_KEY, JSON.stringify(impersonationData));

        toast({
          title: 'تم بدء التحكم الإداري',
          description: `أنت الآن داخل حساب ${data.impersonatedUser.fullName}`,
        });

        // Get the landing page for the impersonated user's role
        const landingPage = getRoleLandingPage(userRoles);

        // Force full page reload to reset all state and redirect
        window.location.href = landingPage;

        return true;
      }

      return false;
    } catch (err) {
      console.error('Impersonation error:', err);
      toast({
        title: 'خطأ',
        description: 'حدث خطأ غير متوقع',
        variant: 'destructive',
      });
      return false;
    }
  }, []);

  const endImpersonation = useCallback(async () => {
    try {
      if (impersonatedUser) {
        // Log the end of impersonation
        await supabase.functions.invoke('admin-impersonate', {
          body: {
            action: 'end',
            targetUserId: impersonatedUser.id,
          },
        });
      }

      // Clear session storage
      sessionStorage.removeItem(IMPERSONATION_KEY);

      toast({
        title: 'تم إنهاء التحكم الإداري',
        description: 'تم العودة لحسابك الأصلي',
      });

      // Force full page reload to reset to admin state
      window.location.href = '/dashboard';
    } catch (err) {
      console.error('End impersonation error:', err);
      // Still clear local state and reload even if server call fails
      sessionStorage.removeItem(IMPERSONATION_KEY);
      window.location.href = '/dashboard';
    }
  }, [impersonatedUser]);

  return (
    <ImpersonationContext.Provider
      value={{
        isImpersonating,
        impersonatedUser,
        originalAdminId,
        startImpersonation,
        endImpersonation,
        getEffectiveRoles,
        getEffectiveBranch,
      }}
    >
      {children}
    </ImpersonationContext.Provider>
  );
}

export function useImpersonation() {
  const context = useContext(ImpersonationContext);
  if (context === undefined) {
    throw new Error('useImpersonation must be used within an ImpersonationProvider');
  }
  return context;
}
