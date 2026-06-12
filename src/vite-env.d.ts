/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_SUPABASE_URL: string;
  readonly VITE_SUPABASE_PROJECT_ID: string;
  readonly VITE_SUPABASE_PUBLISHABLE_KEY: string;
  /** Toggle the experimental Loza marketplace. Unset → on in dev, off in prod. */
  readonly VITE_ENABLE_LOZA?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
