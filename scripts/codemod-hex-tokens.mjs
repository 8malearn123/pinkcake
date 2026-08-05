#!/usr/bin/env node
/**
 * One-shot: convert the storefront's hardcoded Cake & Bloom hex literals to the
 * semantic tokens that now live in `:root`.
 *
 * The storefront was built against a design comp, so its palette was inlined as
 * Tailwind arbitrary values (`bg-[#9e3a5c]`) rather than tokens. That is why the
 * runtime color customizer never reached it, and why screens that merely *had*
 * the theme class still looked different. Every hex below already has an exact
 * token; this rewrites the class utilities to use it.
 *
 *   node scripts/codemod-hex-tokens.mjs --dry    # report only
 *   node scripts/codemod-hex-tokens.mjs          # write
 */
import { readFileSync, writeFileSync, readdirSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';

const SRC = join(process.cwd(), 'src');
const DRY = process.argv.includes('--dry');

const SKIP = [
  /pages\/loza\//, // separate sub-brand, deliberately untouched
  /components\/loza\//,
  /components\/cake\//, // SVG cake art, not theme color
  /pages\/DesignSystem\.tsx$/, // documents literals on purpose
  /\.(test|spec)\./,
];

/** hex → tailwind token suffix. Only exact, unambiguous brand matches. */
const HEX = {
  // Core surfaces + ink
  fffdfa: 'background',
  fffaf0: 'background',
  '2c2226': 'foreground',
  // Brand
  '9e3a5c': 'primary',
  '8a3251': 'pink-dark',
  b0506e: 'rose',
  ddbd75: 'gold',
  c9a55e: 'gold',
  '9a7a2c': 'gold-deep',
  '7a5f2a': 'gold-deep',
  fbeef2: 'blush',
  f2dbe2: 'blush-deep',
  f6ecef: 'secondary',
  // Lines
  f3e8ec: 'border',
  e8d3db: 'border',
  // Muted text ramp — five near-identical greys collapse to one token
  '7d6870': 'muted-foreground',
  '8a6570': 'muted-foreground',
  '857077': 'muted-foreground',
  a49d97: 'muted-foreground',
  '5f4d54': 'muted-foreground',
  '6f5b62': 'muted-foreground',
  '86736c': 'muted-foreground',
  a08a92: 'muted-foreground',
  c3adb5: 'muted-foreground',
  '8a827c': 'muted-foreground',
  '6a5b4a': 'muted-foreground',
  '6a5560': 'muted-foreground',
  '4a3a40': 'muted-foreground',
  // Feedback
  '2c7a5f': 'success',
  e8942f: 'seasonal',
  c97a1f: 'seasonal',
};

/**
 * Deliberately NOT mapped — these are dark-band gradient stops with no token.
 * They are replaced by the `.gradient-berry-deep` / `.gradient-footer-berry`
 * utilities by hand, because a stop-by-stop swap would lose the ramp.
 */
const UNMAPPED_OK = new Set(['7d2f49', '5f2338', '5e2137', '4a1f2e', '34121f', 'fff4e6', '25d366']);

const PROPS =
  'bg|text|border|ring|from|to|via|fill|stroke|divide|outline|decoration|caret|placeholder|shadow';
const RE = new RegExp(`\\b(${PROPS})-\\[#([0-9a-fA-F]{3,8})\\]`, 'g');

function walk(dir, out = []) {
  for (const name of readdirSync(dir)) {
    const p = join(dir, name);
    if (statSync(p).isDirectory()) walk(p, out);
    else if (/\.(tsx?|css)$/.test(p)) out.push(p);
  }
  return out;
}

let changed = 0;
let replaced = 0;
const missing = new Map();

for (const file of walk(SRC)) {
  const rel = relative(process.cwd(), file);
  if (SKIP.some((re) => re.test(rel))) continue;

  const before = readFileSync(file, 'utf8');
  let hits = 0;

  const after = before.replace(RE, (match, prop, rawHex) => {
    const hex = rawHex.toLowerCase();
    const token = HEX[hex];
    if (!token) {
      if (!UNMAPPED_OK.has(hex)) missing.set(hex, (missing.get(hex) ?? 0) + 1);
      return match;
    }
    hits++;
    return `${prop}-${token}`;
  });

  if (hits > 0) {
    changed++;
    replaced += hits;
    if (!DRY) writeFileSync(file, after);
    console.log(`${DRY ? 'would fix' : 'fixed'} ${String(hits).padStart(3)}  ${rel}`);
  }
}

console.log(`\n${replaced} replacement(s) across ${changed} file(s)${DRY ? ' (dry run)' : ''}.`);

if (missing.size) {
  console.log('\nUnmapped hex left in place (review by hand):');
  for (const [hex, n] of [...missing].sort((a, b) => b[1] - a[1])) {
    console.log(`  #${hex}  ×${n}`);
  }
}
