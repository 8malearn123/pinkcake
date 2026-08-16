import { createContext, useContext, useState, useEffect, useRef, ReactNode } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import { forgetTrackCode } from '@/lib/orders/trackEntry';

interface AuthContextType {
  user: User | null;
  session: Session | null;
  isLoading: boolean;
  signIn: (email: string, password: string) => Promise<{ error: Error | null }>;
  signUp: (email: string, password: string, fullName: string) => Promise<{ error: Error | null }>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const queryClient = useQueryClient();
  // `undefined` = we have not seen an auth event yet, which is distinct from
  // `null` = definitely signed out.
  const lastUserId = useRef<string | null | undefined>(undefined);

  /**
   * Customer-scoped caches (`my-orders`, `my-order`, `my-pickup-code`,
   * `customer-profile`…) are keyed WITHOUT the user id, so on a shared browser
   * the next account would inherit the previous one's rows until each query
   * refetched. Drop them — and the remembered tracking code, which /track
   * replays automatically — whenever the signed-in identity actually changes.
   *
   * Guarded on the id so routine TOKEN_REFRESHED events don't churn the cache.
   */
  const resetCustomerCaches = (nextUserId: string | null) => {
    if (lastUserId.current === nextUserId) return;
    const isChange = lastUserId.current !== undefined;
    lastUserId.current = nextUserId;
    queryClient.removeQueries({
      predicate: (q) => {
        const root = q.queryKey[0];
        return typeof root === 'string' && (root.startsWith('my-') || root === 'customer-profile');
      },
    });
    // Not on first boot: a returning guest's own remembered code is the whole
    // point of the feature. Only a genuine sign-in/sign-out drops it.
    if (isChange) forgetTrackCode();
  };

  useEffect(() => {
    // Set up auth state listener FIRST
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        resetCustomerCaches(session?.user?.id ?? null);
        setSession(session);
        setUser(session?.user ?? null);
        setIsLoading(false);
      }
    );

    // THEN check for existing session
    supabase.auth
      .getSession()
      .then(({ data: { session } }) => {
        resetCustomerCaches(session?.user?.id ?? null);
        setSession(session);
        setUser(session?.user ?? null);
      })
      .catch((err) => {
        // Without this the rejection was unhandled and `isLoading` stayed true
        // forever, leaving every auth-gated screen on a permanent spinner.
        // Treat an unreadable session as signed out — recoverable, not stuck.
        console.error('Failed to restore session:', err);
      })
      .finally(() => setIsLoading(false));

    return () => subscription.unsubscribe();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    return { error: error ? new Error(error.message) : null };
  };

  const signUp = async (email: string, password: string, fullName: string) => {
    const redirectUrl = `${window.location.origin}/`;
    
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: redirectUrl,
        data: {
          full_name: fullName,
        },
      },
    });
    return { error: error ? new Error(error.message) : null };
  };

  const signOut = async () => {
    await supabase.auth.signOut();
  };

  return (
    <AuthContext.Provider value={{ user, session, isLoading, signIn, signUp, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
