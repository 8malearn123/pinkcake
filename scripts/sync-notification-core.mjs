#!/usr/bin/env node
/**
 * Mirror the canonical notification core (src/lib/notifications/*) into the
 * Supabase Edge Function, rewriting bare relative imports to the explicit `.ts`
 * specifiers Deno requires. The src copy is the single source of truth; the
 * generated copy is what actually deploys.
 *
 *   node scripts/sync-notification-core.mjs          # write the mirror
 *   node scripts/sync-notification-core.mjs --check   # exit 1 if out of sync
 *
 * A vitest test runs `--check`, so drift fails CI.
 */
import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const SRC_DIR = join(ROOT, 'src', 'lib', 'notifications');
const OUT_DIR = join(ROOT, 'supabase', 'functions', 'send-notification', '_core');
const FILES = ['types.ts', 'phone.ts', 'retry.ts', 'templates.ts', 'providers.ts', 'index.ts'];

const BANNER = (name) =>
  `// AUTO-GENERATED — do not edit by hand.\n` +
  `// Source: src/lib/notifications/${name} · regenerate: npm run notify:sync\n\n`;

/** Append `.ts` to extension-less relative import/export specifiers. */
function addTsExtensions(code) {
  return code.replace(
    /(from\s+|import\s+)(['"])(\.\.?\/[^'"]+?)\2/g,
    (full, kw, quote, spec) =>
      spec.endsWith('.ts') ? full : `${kw}${quote}${spec}.ts${quote}`
  );
}

function generate(name) {
  const src = readFileSync(join(SRC_DIR, name), 'utf8');
  return BANNER(name) + addTsExtensions(src);
}

const check = process.argv.includes('--check');
let drift = 0;

if (!check) mkdirSync(OUT_DIR, { recursive: true });

for (const name of FILES) {
  const expected = generate(name);
  const target = join(OUT_DIR, name);

  if (check) {
    const actual = existsSync(target) ? readFileSync(target, 'utf8') : null;
    if (actual !== expected) {
      console.error(`✗ out of sync: ${target.replace(ROOT + '/', '')}`);
      drift++;
    }
  } else {
    writeFileSync(target, expected);
    console.log(`  ✓ ${target.replace(ROOT + '/', '')}`);
  }
}

if (check) {
  if (drift) {
    console.error(`\n${drift} file(s) out of sync. Run: npm run notify:sync`);
    process.exit(1);
  }
  console.log('✓ notification core is in sync.');
} else {
  console.log(`\nSynced ${FILES.length} file(s) → ${OUT_DIR.replace(ROOT + '/', '')}`);
}
