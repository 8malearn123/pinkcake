/* U4 mobile audit: screenshots + horizontal-scroll + touch-target checks. */
import { chromium } from 'playwright';
import { mkdirSync } from 'node:fs';

const EXE = '/opt/pw-browsers/chromium_headless_shell-1194/chrome-linux/headless_shell';
const BASE = 'http://127.0.0.1:4173';
const OUT = '/tmp/ux-audit';
mkdirSync(OUT, { recursive: true });

const PAGES = [
  { name: 'store', path: '/' },
  { name: 'customize', path: '/customize' },
  { name: 'track', path: '/track' },
  { name: 'login', path: '/login' },
  { name: 'loza-flag-off', path: '/loza' },
];
const WIDTHS = [360, 390, 414];

const browser = await chromium.launch({ executablePath: EXE });
const report = [];

for (const pg of PAGES) {
  for (const w of WIDTHS) {
    const ctx = await browser.newContext({ viewport: { width: w, height: 800 }, locale: 'ar' });
    const page = await ctx.newPage();
    const errors = [];
    page.on('pageerror', (e) => errors.push(e.message));
    await page.goto(BASE + pg.path, { waitUntil: 'networkidle' }).catch(() => {});
    await page.waitForTimeout(900);

    const metrics = await page.evaluate(() => {
      const doc = document.documentElement;
      const hScroll = doc.scrollWidth - doc.clientWidth;
      // interactive elements visible in first 2 viewports with tiny hit areas
      const small = [];
      for (const el of document.querySelectorAll('button, a, [role="button"], input, select')) {
        const r = el.getBoundingClientRect();
        if (r.width === 0 || r.height === 0 || r.top > window.innerHeight * 2) continue;
        if (r.height < 36 && r.width < 36) {
          small.push(`${el.tagName.toLowerCase()}.${String(el.className).split(' ')[0]} ${Math.round(r.width)}x${Math.round(r.height)}`);
        }
      }
      return { hScroll, small: small.slice(0, 8), title: document.title, dir: doc.dir };
    });

    await page.screenshot({ path: `${OUT}/${pg.name}-${w}.jpg`, quality: 60, type: 'jpeg' });
    if (w === 390) {
      await page.screenshot({ path: `${OUT}/${pg.name}-390-full.jpg`, quality: 55, type: 'jpeg', fullPage: true }).catch(() => {});
    }
    report.push({ page: pg.name, width: w, ...metrics, jsErrors: errors.slice(0, 2) });
    await ctx.close();
  }
}

await browser.close();
console.log(JSON.stringify(report, null, 1));
