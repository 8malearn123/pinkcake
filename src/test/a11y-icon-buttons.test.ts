import { describe, it, expect } from 'vitest';
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';

/**
 * P2 guardrail: an icon-only button (size="icon") has no visible text, so it
 * MUST carry an accessible name (aria-label / aria-labelledby / title), or
 * screen-reader users hear an unlabelled "button". Scans every opening
 * <Button …>/<button …> tag in src and fails on any icon button without one.
 */
const SRC = join(process.cwd(), 'src');

function walk(dir: string): string[] {
  return readdirSync(dir).flatMap((e) => {
    const p = join(dir, e);
    return statSync(p).isDirectory() ? walk(p) : [p];
  });
}

/** Extract the opening-tag text starting at `<`, respecting {…} so a `>` inside
 *  a JSX expression doesn't end the tag early. */
function openingTag(src: string, start: number): string {
  let depth = 0;
  for (let i = start; i < src.length; i++) {
    const c = src[i];
    if (c === '{') depth++;
    else if (c === '}') depth--;
    else if (c === '>' && depth === 0) return src.slice(start, i + 1);
  }
  return src.slice(start);
}

function findIconButtonsWithoutLabel(src: string): string[] {
  const offenders: string[] = [];
  const re = /<(Button|button)\b/g;
  let m: RegExpExecArray | null;
  while ((m = re.exec(src))) {
    const tag = openingTag(src, m.index);
    const isIcon = /size=("icon"|{['"]icon['"]})/.test(tag);
    if (!isIcon) continue;
    const labelled = /aria-label[=}]|aria-labelledby=|\btitle=/.test(tag);
    if (!labelled) offenders.push(tag.replace(/\s+/g, ' ').slice(0, 80));
  }
  return offenders;
}

describe('icon-only buttons have accessible names (P2)', () => {
  const files = walk(SRC).filter((f) => f.endsWith('.tsx') && !f.includes('__tests__') && !f.endsWith('.test.tsx'));

  it('every size="icon" button has aria-label / aria-labelledby / title', () => {
    const offenders: string[] = [];
    for (const f of files) {
      for (const tag of findIconButtonsWithoutLabel(readFileSync(f, 'utf8'))) {
        offenders.push(`${f.replace(SRC + '/', '')}: ${tag}`);
      }
    }
    expect(offenders, `Unlabelled icon buttons:\n${offenders.join('\n')}`).toEqual([]);
  });
});
