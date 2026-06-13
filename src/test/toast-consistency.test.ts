import { describe, it, expect } from 'vitest';
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';

/**
 * P4 guardrail: the app uses ONE toast system — the shadcn `use-toast`. This
 * test fails if the second system (sonner) creeps back in, keeping toast styling
 * and the success/error contract consistent across the app.
 */
const SRC = join(process.cwd(), 'src');

function walk(dir: string): string[] {
  return readdirSync(dir).flatMap((entry) => {
    const p = join(dir, entry);
    return statSync(p).isDirectory() ? walk(p) : [p];
  });
}

describe('toast consistency (P4)', () => {
  const files = walk(SRC).filter((f) => /\.(ts|tsx)$/.test(f) && !f.endsWith('.test.ts'));

  it('imports toast only from @/hooks/use-toast (no sonner)', () => {
    const offenders = files.filter((f) => /from ['"]sonner['"]/.test(readFileSync(f, 'utf8')));
    expect(offenders, `sonner imports found in:\n${offenders.join('\n')}`).toEqual([]);
  });

  it('uses the object form toast({…}), not toast.success/.error', () => {
    const offenders = files.filter((f) => /\btoast\.(success|error|info|warning)\s*\(/.test(readFileSync(f, 'utf8')));
    expect(offenders, `sonner-style toast calls found in:\n${offenders.join('\n')}`).toEqual([]);
  });
});
