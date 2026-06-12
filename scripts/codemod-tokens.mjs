#!/usr/bin/env node
/**
 * U5 one-shot: convert raw Tailwind palette classes to semantic tokens.
 * Mapping: green/emerald→success, blue/cyan/teal/indigo→info,
 * amber/orange/yellow→warning, red→destructive, pink→primary,
 * purple→primary (variety color on stat tiles), gray/slate→muted.
 * Skips: loza pages (parked), SVG-art components, DesignSystem (documents
 * the forbidden classes), index.css status-* utilities (canonical).
 */
import { readFileSync, writeFileSync, readdirSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';

const SRC = join(process.cwd(), 'src');
const SKIP = [
  /pages\/loza\//,
  /components\/loza\//,
  /components\/cake\//,
  /pages\/DesignSystem\.tsx$/,
  /\.(test|spec)\./,
];

const FAMILY = {
  green: 'success', emerald: 'success',
  blue: 'info', cyan: 'info', teal: 'info', indigo: 'info',
  amber: 'warning', orange: 'warning', yellow: 'warning',
  red: 'destructive',
  pink: 'primary', purple: 'primary',
  gray: 'muted', slate: 'muted', zinc: 'muted',
};

// kind+shade → token suffix. Light shades become /10 tints; borders /30.
function mapClass(kind, family, shade, alpha) {
  const token = FAMILY[family];
  if (!token) return null;
  if (token === 'muted') {
    if (kind === 'text') return shade >= 400 ? 'text-muted-foreground' : 'text-muted-foreground/70';
    if (kind === 'bg') return shade <= 200 ? 'bg-muted' : 'bg-muted-foreground/20';
    return 'border-border';
  }
  if (kind === 'text') return `text-${token}`;
  if (kind === 'bg') {
    if (alpha) return `bg-${token}/${alpha}`;
    return shade <= 200 ? `bg-${token}/10` : `bg-${token}`;
  }
  if (kind === 'border') return shade <= 300 ? `border-${token}/30` : `border-${token}`;
  return null;
}

const RE = /\b(text|bg|border)-(red|blue|green|yellow|amber|orange|purple|pink|indigo|teal|cyan|emerald|gray|slate|zinc)-([0-9]{2,3})(?:\/([0-9]{1,3}))?\b/g;

function walk(dir) {
  const out = [];
  for (const e of readdirSync(dir)) {
    const p = join(dir, e);
    const s = statSync(p);
    if (s.isDirectory()) out.push(...walk(p));
    else if (/\.tsx?$/.test(e)) out.push(p);
  }
  return out;
}

let total = 0;
for (const file of walk(SRC)) {
  const rel = relative(process.cwd(), file);
  if (SKIP.some((re) => re.test(rel))) continue;
  const src = readFileSync(file, 'utf8');
  const out = src.replace(RE, (full, kind, family, shadeS, alpha) => {
    const next = mapClass(kind, family, Number(shadeS), alpha);
    if (!next || next === full) return full;
    total++;
    return next;
  });
  if (out !== src) {
    writeFileSync(file, out);
    console.log('  ' + rel);
  }
}
console.log(`\n${total} class(es) tokenized.`);
