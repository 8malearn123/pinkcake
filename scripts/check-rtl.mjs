#!/usr/bin/env node
/**
 * RTL guardrail (Track U / §1.7). Fails when source introduces physical-
 * direction Tailwind utilities (which break under dir="rtl") or a <Sidebar>
 * without an explicit side=.
 *
 * Because the codebase predates this rule, a baseline of known pre-existing
 * violations (scripts/rtl-baseline.json) is tolerated; the sweep card (U3)
 * burns it down to empty. ANY violation not in the baseline fails.
 *
 * Usage:
 *   node scripts/check-rtl.mjs              # enforce (CI / pre-commit)
 *   node scripts/check-rtl.mjs --list       # print all current violations
 *   node scripts/check-rtl.mjs --update-baseline   # snapshot current as allowed
 *
 * Exempt a justified symmetric case with an inline `rtl-ok` comment on the line.
 */
import { readFileSync, writeFileSync, existsSync, readdirSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';

const ROOT = process.cwd();
const SRC = join(ROOT, 'src');
const BASELINE = join(ROOT, 'scripts', 'rtl-baseline.json');

/** Each rule: physical utility → logical replacement. */
const RULES = [
  { name: 'margin-x', re: /(?<![\w-])-?(?:[a-z]+:)*m[lr]-[\w./[\]-]+/g, fix: 'use ms-/me-' },
  { name: 'padding-x', re: /(?<![\w-])-?(?:[a-z]+:)*p[lr]-[\w./[\]-]+/g, fix: 'use ps-/pe-' },
  { name: 'inset-x', re: /(?<![\w-])-?(?:[a-z]+:)*(?:left|right)-[\w./[\]-]+/g, fix: 'use start-/end-' },
  { name: 'text-align', re: /(?<![\w-])(?:[a-z]+:)*text-(?:left|right)(?![\w-])/g, fix: 'use text-start/text-end' },
  { name: 'rounded-side', re: /(?<![\w-])(?:[a-z]+:)*rounded-(?:[lr]|[tb][lr])(?:-[\w./[\]-]+)?(?![\w-])/g, fix: 'use rounded-s/e (or -ss/-se/-es/-ee)' },
  { name: 'border-side', re: /(?<![\w-])(?:[a-z]+:)*border-[lr](?:-[\w./[\]-]+)?(?![\w-])/g, fix: 'use border-s/border-e' },
];

// Only the shadcn <Sidebar> primitive needs an explicit side=; the custom
// layout Sidebar component is a different thing. Gate on the shadcn import.
const SIDEBAR_RE = /<Sidebar(?![\w])(?![^>]*\bside=)/;
const SHADCN_SIDEBAR_IMPORT = /from\s+['"][^'"]*components\/ui\/sidebar['"]/;

function walk(dir) {
  const out = [];
  for (const entry of readdirSync(dir)) {
    const p = join(dir, entry);
    const s = statSync(p);
    if (s.isDirectory()) out.push(...walk(p));
    else if (/\.(ts|tsx)$/.test(entry) && !/\.(test|spec)\./.test(entry)) out.push(p);
  }
  return out;
}

function scan() {
  const violations = [];
  for (const file of walk(SRC)) {
    const rel = relative(ROOT, file);
    const content = readFileSync(file, 'utf8');
    const usesShadcnSidebar = SHADCN_SIDEBAR_IMPORT.test(content);
    content.split('\n').forEach((line, i) => {
      if (/rtl-ok/.test(line)) return; // justified symmetric exemption
      for (const rule of RULES) {
        rule.re.lastIndex = 0;
        let mtch;
        while ((mtch = rule.re.exec(line))) {
          violations.push({ file: rel, line: i + 1, rule: rule.name, token: mtch[0], fix: rule.fix, text: line.trim() });
        }
      }
      if (usesShadcnSidebar && SIDEBAR_RE.test(line)) {
        violations.push({ file: rel, line: i + 1, rule: 'sidebar-side', token: '<Sidebar>', fix: 'add side="right"', text: line.trim() });
      }
    });
  }
  return violations;
}

/** Signature ignores line numbers so unrelated edits don't churn the baseline. */
const sig = (v) => `${v.file}\t${v.rule}\t${v.token}\t${v.text}`;

const args = process.argv.slice(2);
const all = scan();

if (args.includes('--list')) {
  for (const v of all) console.log(`${v.file}:${v.line}  [${v.rule}] ${v.token}  → ${v.fix}`);
  console.log(`\n${all.length} physical-direction occurrence(s).`);
  process.exit(0);
}

if (args.includes('--update-baseline')) {
  const baseline = [...new Set(all.map(sig))].sort();
  writeFileSync(BASELINE, JSON.stringify(baseline, null, 2) + '\n');
  console.log(`Baseline updated: ${baseline.length} signature(s) → ${relative(ROOT, BASELINE)}`);
  process.exit(0);
}

// The <Sidebar side=> rule is NEVER baselined — it must always be zero.
const sidebarViolations = all.filter((v) => v.rule === 'sidebar-side');

const baseline = existsSync(BASELINE) ? new Set(JSON.parse(readFileSync(BASELINE, 'utf8'))) : new Set();
const novel = all.filter((v) => v.rule !== 'sidebar-side' && !baseline.has(sig(v)));

if (sidebarViolations.length || novel.length) {
  console.error('✗ RTL guardrail failed (§1.7).\n');
  for (const v of sidebarViolations) {
    console.error(`  ${v.file}:${v.line}  <Sidebar> is missing an explicit side= (use side="right").`);
  }
  for (const v of novel) {
    console.error(`  ${v.file}:${v.line}  [${v.rule}] "${v.token}" — ${v.fix}  (or add an "rtl-ok" comment if genuinely symmetric)`);
  }
  console.error(`\n${sidebarViolations.length + novel.length} new violation(s). Fix with logical utilities, or run --update-baseline only for an intentional, reviewed exception.`);
  process.exit(1);
}

console.log(`✓ RTL guardrail passed (${baseline.size} baselined, 0 new).`);
