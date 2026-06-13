/* Lightweight accessibility audit: flags interactive elements with no
 * accessible name, images without alt, and inputs without a label, on the
 * public pages. Run against the production preview build. */
import { chromium } from 'playwright';

const EXE = '/opt/pw-browsers/chromium_headless_shell-1194/chrome-linux/headless_shell';
const BASE = process.argv[2] || 'http://127.0.0.1:4173';
const PAGES = ['/', '/customize', '/track', '/login'];

const browser = await chromium.launch({ executablePath: EXE });
const findings = [];

for (const path of PAGES) {
  const ctx = await browser.newContext({ viewport: { width: 1024, height: 900 }, locale: 'ar' });
  const page = await ctx.newPage();
  await page.goto(BASE + path, { waitUntil: 'networkidle' }).catch(() => {});
  await page.waitForTimeout(700);

  const issues = await page.evaluate(() => {
    const out = [];
    const visible = (el) => {
      const r = el.getBoundingClientRect();
      const s = getComputedStyle(el);
      return r.width > 0 && r.height > 0 && s.visibility !== 'hidden' && s.display !== 'none';
    };
    const accName = (el) => {
      const al = el.getAttribute('aria-label');
      if (al && al.trim()) return al.trim();
      const lb = el.getAttribute('aria-labelledby');
      if (lb) {
        const t = lb.split(/\s+/).map((id) => document.getElementById(id)?.textContent || '').join(' ').trim();
        if (t) return t;
      }
      const text = (el.textContent || '').replace(/\s+/g, ' ').trim();
      if (text) return text;
      const img = el.querySelector('img[alt]');
      if (img && img.getAttribute('alt').trim()) return img.getAttribute('alt').trim();
      const title = el.getAttribute('title');
      if (title && title.trim()) return title.trim();
      return '';
    };
    const desc = (el) => {
      const cls = (typeof el.className === 'string' ? el.className : '').split(' ').filter(Boolean).slice(0, 2).join('.');
      return `${el.tagName.toLowerCase()}${cls ? '.' + cls : ''}`;
    };

    // Interactive elements without an accessible name.
    for (const el of document.querySelectorAll('button, a[href], [role="button"]')) {
      if (!visible(el)) continue;
      if (!accName(el)) out.push({ kind: 'no-accessible-name', el: desc(el), html: el.outerHTML.slice(0, 90) });
    }
    // Images missing an alt attribute (alt="" is allowed = decorative).
    for (const img of document.querySelectorAll('img')) {
      if (visible(img) && !img.hasAttribute('alt')) out.push({ kind: 'img-no-alt', el: desc(img), html: img.outerHTML.slice(0, 90) });
    }
    // Inputs/selects/textareas with no associated label.
    for (const el of document.querySelectorAll('input:not([type="hidden"]), select, textarea')) {
      if (!visible(el)) continue;
      const id = el.getAttribute('id');
      const hasFor = id && document.querySelector(`label[for="${id}"]`);
      const wrapped = el.closest('label');
      const al = el.getAttribute('aria-label') || el.getAttribute('aria-labelledby') || el.getAttribute('placeholder');
      if (!hasFor && !wrapped && !al) out.push({ kind: 'input-no-label', el: desc(el), html: el.outerHTML.slice(0, 90) });
    }
    return out;
  });

  for (const i of issues) findings.push({ page: path, ...i });
  await ctx.close();
}

await browser.close();

if (!findings.length) {
  console.log('✓ a11y audit: 0 issues across', PAGES.join(', '));
} else {
  const byKind = {};
  for (const f of findings) byKind[f.kind] = (byKind[f.kind] || 0) + 1;
  console.log('a11y findings:', JSON.stringify(byKind));
  for (const f of findings) console.log(`  [${f.page}] ${f.kind}: ${f.el}  ${f.html}`);
}
