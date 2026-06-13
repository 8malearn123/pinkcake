/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_SUPABASE_URL: string;
  readonly VITE_SUPABASE_PROJECT_ID: string;
  readonly VITE_SUPABASE_PUBLISHABLE_KEY: string;
  /** Toggle the experimental Loza marketplace. Unset → on in dev, off in prod. */
  readonly VITE_ENABLE_LOZA?: string;
  /** Hide the order-notifications admin tab when "false". Shown otherwise. */
  readonly VITE_ENABLE_NOTIFICATIONS?: string;
  /** Demo/design mode on mock data. "true"|"false"; unset → on when no Supabase URL. */
  readonly VITE_DEMO_MODE?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
