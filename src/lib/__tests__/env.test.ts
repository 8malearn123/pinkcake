import { describe, it, expect } from 'vitest';
import { checkSupabaseEnv } from '../env';

describe('checkSupabaseEnv', () => {
  it('passes when both connection vars are set', () => {
    const status = checkSupabaseEnv({
      VITE_SUPABASE_URL: 'https://ref.supabase.co',
      VITE_SUPABASE_PUBLISHABLE_KEY: 'anon-key',
    });
    expect(status).toEqual({ ok: true, missing: [] });
  });

  it('reports each missing or blank var', () => {
    expect(checkSupabaseEnv({}).missing).toEqual([
      'VITE_SUPABASE_URL',
      'VITE_SUPABASE_PUBLISHABLE_KEY',
    ]);
    expect(
      checkSupabaseEnv({ VITE_SUPABASE_URL: 'https://x', VITE_SUPABASE_PUBLISHABLE_KEY: '   ' })
        .missing
    ).toEqual(['VITE_SUPABASE_PUBLISHABLE_KEY']);
  });
});
