import { describe, it, expect } from 'vitest';
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';

/**
 * Retirement gate: the procedural CSS cake art is gone EVERYWHERE — the studio,
 * the cart, the kitchen's order brief. This test fails if any of the retired
 * builder's identifiers or CSS class names creep back into src.
 */
const SRC = join(process.cwd(), 'src');

function walk(dir: string): string[] {
  return readdirSync(dir).flatMap((entry) => {
    const p = join(dir, entry);
    return statSync(p).isDirectory() ? walk(p) : [p];
  });
}

const FORBIDDEN = [
  'cakeBuilder',
  'buildCake(',
  'miniCakeHTML',
  'resolveCakeConfig',
  'cz-embed',
  'cake-wrap',
  'cup-swirl',
  'numform',
] as const;

// cakeStudio.ts's doc comment memorializes the deleted `cakeBuilder.ts` by
// name — that prose is the retirement, not a regression of it.
const ALLOWED = new Set([`${join(SRC, 'lib', 'cakeStudio.ts')} → cakeBuilder`]);

describe('cake art retirement', () => {
  const files = walk(SRC).filter(
    (f) => /\.(ts|tsx|css)$/.test(f) && !f.endsWith('no-cake-art.test.ts'),
  );

  it('no file references the retired CSS cake art', () => {
    const offenders = files
      .flatMap((f) => {
        const content = readFileSync(f, 'utf8');
        return FORBIDDEN.filter((token) => content.includes(token)).map((token) => `${f} → ${token}`);
      })
      .filter((hit) => !ALLOWED.has(hit));
    expect(offenders, `retired cake-art references found:\n${offenders.join('\n')}`).toEqual([]);
  });
});
