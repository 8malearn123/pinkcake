import { describe, it, expect } from 'vitest';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { join, dirname } from 'node:path';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..', '..', '..', '..');

describe('notification core ↔ edge function mirror', () => {
  it('is in sync (run `npm run notify:sync` if this fails)', () => {
    // Exits non-zero when the generated Deno copy drifts from src.
    expect(() =>
      execFileSync('node', ['scripts/sync-notification-core.mjs', '--check'], {
        cwd: ROOT,
        stdio: 'pipe',
      })
    ).not.toThrow();
  });
});
