#!/usr/bin/env node
/**
 * One-shot RTL codemod (Track U / U3). Converts physical-direction Tailwind
 * utilities to logical ones using the CROSSED mapping that renders pixel-
 * identical under dir="rtl":
 *   mr→ms  ml→me   pr→ps  pl→pe   right→start  left→end
 *   text-right→text-start  text-left→text-end
 *   border-r→border-s  border-l→border-e
 *   rounded-r→rounded-s  rounded-l→rounded-e
 *   rounded-tr→rounded-ss  rounded-tl→rounded-se
 *   rounded-br→rounded-es  rounded-bl→rounded-ee
 *
 * Skips: test files, lines containing dir="ltr" (intentional LTR islands),
 * and tokens already carrying an rtl:/ltr: variant.
 */
import { readFileSync, writeFileSync, readdirSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';

const SRC = join(process.cwd(), 'src');

const TOKEN_RE = new RegExp(
  '(?<![\\w-])((?:[a-z0-9]+:)*-?(?:' +
    'm[lr]-[\\w./\\[\\]-]+|' +
    'p[lr]-[\\w./\\[\\]-]+|' +
    '(?:left|right)-[\\w./\\[\\]-]+|' +
    'text-(?:left|right)|' +
    'border-[lr](?:-[\\w./\\[\\]-]+)?|' +
    'rounded-(?:tl|tr|bl|br|l|r)(?:-[\\w./\\[\\]-]+)?' +
    '))(?![\\w-])',
  'g'
);

function convert(tok) {
  const m = tok.match(/^((?:[a-z0-9]+:)*)(-?)(.*)$/);
  const [, variants, neg] = m;
  let core = m[3];
  if (/\b(rtl|ltr):/.test(variants)) return tok; // explicit direction — leave
  const rules = [
    [/^ml-/, 'me-'], [/^mr-/, 'ms-'],
    [/^pl-/, 'pe-'], [/^pr-/, 'ps-'],
    [/^left-/, 'end-'], [/^right-/, 'start-'],
    [/^text-left$/, 'text-end'], [/^text-right$/, 'text-start'],
    [/^border-l/, 'border-e'], [/^border-r/, 'border-s'],
    [/^rounded-tl/, 'rounded-se'], [/^rounded-tr/, 'rounded-ss'],
    [/^rounded-br/, 'rounded-es'], [/^rounded-bl/, 'rounded-ee'],
    [/^rounded-l/, 'rounded-e'], [/^rounded-r/, 'rounded-s'],
  ];
  for (const [re, rep] of rules) {
    if (re.test(core)) { core = core.replace(re, rep); break; }
  }
  return variants + neg + core;
}

function walk(dir) {
  const out = [];
  for (const e of readdirSync(dir)) {
    const p = join(dir, e);
    const s = statSync(p);
    if (s.isDirectory()) out.push(...walk(p));
    else if (/\.(ts|tsx)$/.test(e) && !/\.(test|spec)\./.test(e)) out.push(p);
  }
  return out;
}

let filesChanged = 0;
let tokensChanged = 0;
for (const file of walk(SRC)) {
  const src = readFileSync(file, 'utf8');
  const out = src
    .split('\n')
    .map((line) => {
      if (/dir=["']ltr["']/.test(line)) return line; // LTR island — leave
      return line.replace(TOKEN_RE, (tok) => {
        const next = convert(tok);
        if (next !== tok) tokensChanged++;
        return next;
      });
    })
    .join('\n');
  if (out !== src) {
    writeFileSync(file, out);
    filesChanged++;
    console.log('  ' + relative(process.cwd(), file));
  }
}
console.log(`\n${tokensChanged} token(s) across ${filesChanged} file(s) converted.`);
