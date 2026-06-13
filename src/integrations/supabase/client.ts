// Supabase client. (Originally generated; the DEMO_MODE branch is the only edit —
// see src/lib/demo and HANDOFF.md. Remove that branch when wiring real Supabase.)
import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import type { Database } from './types';
import { DEMO_MODE } from '@/lib/demo/config';
import { createDemoClient } from '@/lib/demo/client';

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_PUBLISHABLE_KEY = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;

// Import the supabase client like this:
// import { supabase } from "@/integrations/supabase/client";

export const supabase: SupabaseClient<Database> = DEMO_MODE
  ? (createDemoClient() as unknown as SupabaseClient<Database>)
  : createClient<Database>(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, {
      auth: {
        storage: localStorage,
        persistSession: true,
        autoRefreshToken: true,
      },
    });