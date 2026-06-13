/**
 * Startup environment check.
 *
 * The Supabase client (src/integrations/supabase/client.ts) calls createClient()
 * at import time and throws "supabaseUrl is required." when these vars are
 * missing — which, with no error boundary, blanks the whole app. We check for
 * them in main.tsx BEFORE importing the app, so a missing .env shows a helpful
 * setup screen instead of a white page.
 */
const REQUIRED_ENV = ['VITE_SUPABASE_URL', 'VITE_SUPABASE_PUBLISHABLE_KEY'] as const;

export interface EnvStatus {
  ok: boolean;
  missing: string[];
}

export function checkSupabaseEnv(
  env: Record<string, unknown> = import.meta.env as unknown as Record<string, unknown>
): EnvStatus {
  const missing = REQUIRED_ENV.filter((key) => {
    const value = env[key];
    return value === undefined || value === null || String(value).trim() === '';
  });
  return { ok: missing.length === 0, missing };
}
