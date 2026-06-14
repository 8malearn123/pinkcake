/**
 * Cake builder — pure functions that produce the live-preview cake markup for the
 * customizer (/customize). Ported from the Claude.design v2 rebuild. Returned HTML
 * is injected via dangerouslySetInnerHTML into the (namespaced) .cake-studio stage,
 * so the procedural garnish/decoration stays visually identical. Text is escaped.
 */

export interface Shape {
  id: string; name: string; serves: string; lead: string; price: number;
  form: 'tiers' | 'cupcake' | 'number'; tiers?: { w: number; h: number }[];
}
export interface Flavor { id: string; name: string; ds: string; add: number; dot: string; g: string }
export interface ColorOpt { id: string; name: string; c: string }
export interface Design { id: string; name: string; add: number; icon: string }
export interface Addon { id: string; name: string; ds: string; add: number; icon: string }

export interface CakeConfig {
  shape: Shape | null;
  flavor: Flavor | null;
  color: ColorOpt;
  design: Design;
  text: string;
  addons: { candle: boolean; topper: boolean };
}

export const STEPS = [
  { key: 'shape',  cap: 'الشكل',   kick: 'القاعدة',        title: 'اختاري شكل كيكتك',   sub: 'كل قاعدة بحجم وعدد أشخاص يناسب مناسبتك.' },
  { key: 'flavor', cap: 'النكهة',  kick: 'القلب اللذيذ',   title: 'اختاري نكهة الإسفنج', sub: 'النكهة التي تنتظرها أول قطعة.' },
  { key: 'color',  cap: 'اللون',   kick: 'التغليف',        title: 'اختاري لون الكريمة',  sub: 'لمسة اللون التي تطبع الأناقة.' },
  { key: 'design', cap: 'التزيين', kick: 'اللمسة',         title: 'أضيفي لمسة التزيين',  sub: 'تفصيل أنيق يجعلها تحفة.' },
  { key: 'finish', cap: 'الإهداء', kick: 'اللمسة الأخيرة', title: 'رسالتك وإضافاتك',     sub: 'كلمة من القلب وإضافات الاحتفال.' },
] as const;

export const SHAPES: Shape[] = [
  { id: 'bento',   name: 'بينتو ميني', serves: '2–3',   lead: '24 ساعة', price: 60,  form: 'tiers', tiers: [{ w: 128, h: 66 }] },
  { id: 'classic', name: 'كلاسيكية',   serves: '6–8',   lead: '24 ساعة', price: 85,  form: 'tiers', tiers: [{ w: 182, h: 70 }] },
  { id: 'tier2',   name: 'طابقين',     serves: '10–14', lead: '48 ساعة', price: 180, form: 'tiers', tiers: [{ w: 120, h: 52 }, { w: 184, h: 64 }] },
  { id: 'tier3',   name: 'ثلاث طوابق', serves: '20–25', lead: '48 ساعة', price: 320, form: 'tiers', tiers: [{ w: 90, h: 44 }, { w: 142, h: 54 }, { w: 196, h: 62 }] },
  { id: 'cupcake', name: 'كب كيك',     serves: '12 قطعة', lead: '24 ساعة', price: 95, form: 'cupcake' },
  { id: 'number',  name: 'شكل رقم',    serves: '8–10',  lead: '48 ساعة', price: 145, form: 'number' },
];

export const FLAVORS: Flavor[] = [
  { id: 'vanilla',   name: 'فانيليا بوربون',  ds: 'كلاسيكية ناعمة',    add: 0,  dot: 'linear-gradient(135deg,#fbf1da,#e7d0a0)', g: 'pearl' },
  { id: 'chocolate', name: 'شوكولاتة بلجيكية', ds: 'غنية ومركّزة',      add: 15, dot: 'linear-gradient(135deg,#6b4326,#3a2414)', g: 'choco' },
  { id: 'saffron',   name: 'زعفران وهيل',      ds: 'نكهة سعودية فاخرة', add: 30, dot: 'linear-gradient(135deg,#e7b54e,#bd7e1e)', g: 'saffron' },
  { id: 'lotus',     name: 'لوتس بسكوف',       ds: 'كراميل وبسكويت',    add: 22, dot: 'linear-gradient(135deg,#d39a5e,#9c6328)', g: 'crumble' },
  { id: 'pistachio', name: 'فستق حلبي',        ds: 'مكسّرات فاخرة',     add: 25, dot: 'linear-gradient(135deg,#a9c47a,#6f9243)', g: 'pistachio' },
  { id: 'redvelvet', name: 'ريد فيلفِت',       ds: 'مخملية بلمسة كاكاو', add: 20, dot: 'linear-gradient(135deg,#b8324a,#7d1f30)', g: 'crumb' },
];

export const COLORS: ColorOpt[] = [
  { id: 'ivory',  name: 'عاجي',      c: 'hsl(40 38% 90%)' },
  { id: 'blush',  name: 'وردي فاتح', c: 'hsl(350 46% 86%)' },
  { id: 'rose',   name: 'روز',       c: 'hsl(345 38% 73%)' },
  { id: 'nude',   name: 'نود',       c: 'hsl(28 32% 80%)' },
  { id: 'sage',   name: 'سيج',       c: 'hsl(135 16% 76%)' },
  { id: 'powder', name: 'أزرق هادئ', c: 'hsl(205 30% 81%)' },
  { id: 'lilac',  name: 'لافندر',    c: 'hsl(275 22% 81%)' },
  { id: 'cocoa',  name: 'كاكاو',     c: 'hsl(24 30% 44%)' },
];

export const DESIGNS: Design[] = [
  { id: 'minimal', name: 'مينيمال',  add: 0,  icon: 'minus' },
  { id: 'drip',    name: 'دريب',     add: 25, icon: 'droplet' },
  { id: 'pearls',  name: 'لؤلؤ',     add: 30, icon: 'sparkle2' },
  { id: 'berries', name: 'توت طازج', add: 28, icon: 'leaf2' },
  { id: 'floral',  name: 'ورد سكّري', add: 50, icon: 'flower' },
  { id: 'gold',    name: 'ورقة ذهب', add: 45, icon: 'flame' },
];

export const ADDONS: Addon[] = [
  { id: 'candle', name: 'شمعة رقم',   ds: 'شمعة على شكل الرقم', add: 10, icon: 'flame' },
  { id: 'topper', name: 'توبر مناسبة', ds: 'توبر أكريليك مذهّب', add: 20, icon: 'topper' },
];

export const QUICK_MESSAGES = ['كل عام وأنتِ بخير', 'مبروك', 'عيد ميلاد سعيد', 'بالتوفيق', 'ألف مبروك', 'أحبك'];

export function price(cfg: CakeConfig): number {
  let p = 0;
  if (cfg.shape) p += cfg.shape.price;
  if (cfg.flavor) p += cfg.flavor.add;
  if (cfg.design) p += cfg.design.add;
  ADDONS.forEach((a) => { if (cfg.addons[a.id as 'candle' | 'topper']) p += a.add; });
  return p;
}

const rnd = (a: number, b: number) => a + Math.random() * (b - a);
const esc = (s: string) =>
  s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
const scatter = (n: number, fn: (i: number) => string) => {
  let s = ''; for (let i = 0; i < n; i++) s += fn(i); return s;
};
const frosting = (cfg: CakeConfig) => cfg.color?.c || 'hsl(40 38% 90%)';
const at = (x: number, y: number, r?: number) =>
  `left:calc(50% + ${x}px);top:${y}px;transform:translate(-50%,-50%) ${r ? 'rotate(' + r + 'deg)' : ''}`;

function flavorGarnish(cfg: CakeConfig): string {
  if (!cfg.flavor) return '';
  const g = cfg.flavor.g;
  if (g === 'pearl') return scatter(3, (i) => `<div class="bit pearl" style="${at((i - 1) * 8, -2)};width:6px;height:6px;animation-delay:${i * 40}ms"></div>`);
  if (g === 'choco') return scatter(3, (i) => `<div class="bit choco" style="${at((i - 1) * 10, -3, rnd(-30, 30))};width:13px;height:5px;animation-delay:${i * 40}ms"></div>`);
  if (g === 'saffron') return scatter(5, (i) => `<div class="bit" style="${at(rnd(-14, 14), rnd(-6, 0), rnd(-40, 40))};width:11px;height:2px;border-radius:2px;background:linear-gradient(90deg,#e9b24a,#bd7e1e);animation-delay:${i * 30}ms"></div>`);
  if (g === 'crumb') return scatter(7, (i) => `<div class="bit sprinkle" style="left:calc(50% + ${rnd(-18, 18)}px);top:${rnd(-6, 1)}px;width:4px;height:4px;background:hsl(352 52% 44%);animation-delay:${i * 25}ms"></div>`);
  if (g === 'crumble') return scatter(8, (i) => `<div class="bit" style="left:calc(50% + ${rnd(-18, 18)}px);top:${rnd(-6, 1)}px;width:5px;height:4px;border-radius:2px;background:linear-gradient(120deg,#d8a865,#a06a2c);transform:rotate(${rnd(0, 180)}deg);animation-delay:${i * 25}ms"></div>`);
  if (g === 'pistachio') return scatter(6, (i) => `<div class="bit" style="left:calc(50% + ${rnd(-16, 16)}px);top:${rnd(-6, 0)}px;width:6px;height:5px;border-radius:40%;background:hsl(${rnd(80, 110)} 38% 50%);transform:rotate(${rnd(0, 180)}deg);animation-delay:${i * 25}ms"></div>`);
  return '';
}

function designDeco(cfg: CakeConfig, topW: number): string {
  const d = cfg.design ? cfg.design.id : 'minimal';
  let h = '';
  if (d === 'drip') {
    const lobes = Math.max(5, Math.round(topW / 18));
    let drops = '';
    for (let i = 0; i <= lobes; i++) {
      const x = -topW / 2 + (i * topW) / lobes;
      drops += `<div style="position:absolute;left:calc(50% + ${x}px);top:6px;width:12px;height:${rnd(10, 23)}px;transform:translateX(-50%);border-radius:0 0 7px 7px;background:hsl(345 46% 66%);box-shadow:inset 0 -3px 5px hsl(345 42% 46% / .4)"></div>`;
    }
    h += `<div class="drip" style="width:${topW}px"><div style="width:${topW}px;height:11px;border-radius:8px;background:hsl(345 46% 66%);box-shadow:inset 0 3px 4px hsl(0 0% 100% / .3)"></div>${drops}</div>`;
    h += scatter(3, (i) => `<div class="bit pearl gold" style="${at((i - 1) * 12, -3)};width:7px;height:7px;animation-delay:${300 + i * 60}ms"></div>`);
  } else if (d === 'pearls') {
    const n = Math.max(6, Math.round(topW / 13));
    h += scatter(n, (i) => { const x = -topW / 2 + 4 + (i * (topW - 8)) / (n - 1); return `<div class="bit pearl" style="left:calc(50% + ${x}px);top:7px;transform:translate(-50%,-50%);width:8px;height:8px;animation-delay:${i * 22}ms"></div>`; });
    h += scatter(4, (i) => `<div class="bit pearl gold" style="${at((i - 1.5) * 11, -3)};width:8px;height:8px;animation-delay:${200 + i * 45}ms"></div>`);
  } else if (d === 'berries') {
    h += scatter(5, (i) => { const ang = (i / 5) * 6.28; const x = Math.cos(ang) * 11, y = -3 + Math.sin(ang) * 6; return `<div class="bit berry" style="${at(x, y)};width:10px;height:11px;animation-delay:${i * 45}ms"></div>`; });
    h += scatter(3, (i) => `<div class="bit leaf" style="${at((i - 1) * 13, 2, i * 60 - 60)};width:10px;height:6px;animation-delay:${i * 50}ms"></div>`);
    h += `<div class="bit berry" style="${at(0, -3)};width:11px;height:12px;z-index:2"></div>`;
  } else if (d === 'floral') {
    const cols = ['hsl(350 46% 82%)', 'hsl(40 38% 90%)', 'hsl(345 40% 70%)', 'hsl(330 34% 78%)'];
    h += scatter(4, (i) => { const ang = (i / 4) * 6.28 + 0.4; const x = Math.cos(ang) * 13, y = -3 + Math.sin(ang) * 7;
      return `<div class="bit rose" style="${at(x, y)};--rc:${cols[i % cols.length]};width:18px;height:18px;animation-delay:${i * 55}ms"></div>` +
             `<div class="bit leaf" style="${at(x * 1.5, y + 6, ang * 57)};width:9px;height:5px;animation-delay:${i * 55 + 30}ms"></div>`; });
    h += `<div class="bit rose" style="${at(0, -4)};--rc:hsl(345 40% 66%);width:21px;height:21px;z-index:2"></div>`;
    h += scatter(2, (i) => `<div class="bit rose" style="left:calc(50% + ${topW * 0.36}px);top:${30 + i * 20}px;transform:translate(-50%,-50%);--rc:${cols[i % cols.length]};width:${15 - i * 2}px;height:${15 - i * 2}px;animation-delay:${260 + i * 70}ms"></div>`);
  } else if (d === 'gold') {
    h += scatter(11, (i) => `<div class="bit gold-fleck" style="left:calc(50% + ${rnd(-topW * 0.44, topW * 0.44)}px);top:${rnd(-8, 7)}px;width:${rnd(5, 9)}px;height:${rnd(4, 7)}px;border-radius:${rnd(20, 60)}%;transform:rotate(${rnd(0, 180)}deg);animation-delay:${i * 22}ms"></div>`);
    h += scatter(4, (i) => `<div class="bit pearl gold" style="${at((i - 1.5) * 11, -3)};width:8px;height:8px;animation-delay:${220 + i * 45}ms"></div>`);
  } else {
    h += scatter(3, (i) => `<div class="bit gold-fleck" style="${at((i - 1) * 9, -3)};width:6px;height:5px;border-radius:50%;animation-delay:${i * 60}ms"></div>`);
  }
  if (cfg.addons.candle) h += `<div class="candle" style="top:-${topW * 0.5}px"><div class="flame"></div><div class="stick"></div></div>`;
  if (cfg.addons.topper) h += `<div class="bit" style="left:50%;top:-${topW * 0.46}px;transform:translateX(-50%);font-family:'DM Serif Display',serif;font-size:15px;color:hsl(var(--gold-deep));text-shadow:0 1px 0 #fff">★</div>`;
  return h;
}

function messageHTML(cfg: CakeConfig, w: number): string {
  if (!cfg.text.trim()) return '';
  const len = cfg.text.trim().length;
  const fs = len > 16 ? 12 : len > 9 ? 14 : 16;
  const ink = cfg.color && cfg.color.id === 'cocoa' ? 'hsl(40 50% 88%)' : 'hsl(343 42% 44%)';
  return `<div class="msg" style="top:52%;font-size:${fs}px;--ink:${ink};max-width:${w - 22}px">${esc(cfg.text.trim())}</div>`;
}

function tiersHTML(cfg: CakeConfig, sh: Shape): string {
  const c = frosting(cfg); const tiers = sh.tiers!; const topW = tiers[0].w;
  let h = '';
  tiers.forEach((t, i) => {
    const th = Math.round(t.w * 0.25);
    const isTop = i === 0, isBottom = i === tiers.length - 1;
    const z = (tiers.length - i) * 10;
    const deco = isTop ? `<div class="deco">${flavorGarnish(cfg)}${designDeco(cfg, topW)}</div>` : '';
    const seam = isTop ? '' : `<div class="seam"></div>`;
    const msgHere = (tiers.length <= 2 && isBottom) ? messageHTML(cfg, t.w) : '';
    h += `<div class="tier" style="--w:${t.w}px;--h:${t.h}px;--th:${th}px;--c:${c};z-index:${z}">
            <div class="top"></div>${seam}
            <div class="body">${msgHere}</div>${deco}
          </div>`;
  });
  return h;
}

function cupcakeHTML(cfg: CakeConfig): string {
  return `<div class="cupcake"><div style="position:relative" class="tier">
    <div class="cup-swirl" style="--c:${frosting(cfg)}"><div class="deco" style="top:-6px">${flavorGarnish(cfg)}${designDeco(cfg, 100)}</div></div>
  </div><div class="cup-liner"></div></div>`;
}

function numberHTML(cfg: CakeConfig): string {
  let digit = '8'; const m = cfg.text.match(/[0-9]/); if (m) digit = m[0];
  return `<div style="position:relative" class="tier">
    <div class="numform" style="font-size:130px;color:transparent;background:${frosting(cfg)};-webkit-background-clip:text;background-clip:text">
      <span style="-webkit-text-stroke:1.5px hsl(345 20% 72% / .5)">${digit}</span></div>
    <div class="deco" style="top:-10px">${flavorGarnish(cfg)}${designDeco(cfg, 112)}</div></div>`;
}

function standHTML(pw: number): string {
  return `<div class="plate" style="--pw:${pw}px;width:${pw}px"></div><div class="stem"></div>
          <div class="base" style="--pw:${pw}px;width:${pw * 0.66}px"></div>
          <div class="contact" style="--pw:${pw}px;width:${pw * 0.92}px"></div>`;
}

/** Build the live cake preview (cake + stand inner HTML) for the current config. */
export function buildCake(cfg: CakeConfig): { cake: string; stand: string } {
  if (!cfg.shape) return { cake: '', stand: '' };
  const sh = cfg.shape;
  if (sh.form === 'cupcake') return { cake: cupcakeHTML(cfg), stand: standHTML(124) };
  if (sh.form === 'number') return { cake: numberHTML(cfg), stand: standHTML(150) };
  const cake = tiersHTML(cfg, sh);
  const stand = standHTML(sh.tiers![sh.tiers!.length - 1].w + 28);
  return { cake, stand };
}

/** Small cake illustration for the shape-selection card thumbnails. */
export function miniCakeHTML(sh: Shape): string {
  if (sh.form === 'cupcake') return `<div class="cupcake" style="transform:scale(.6)"><div class="cup-swirl" style="--c:hsl(40 38% 91%);width:74px;height:48px"></div><div class="cup-liner" style="width:70px;height:38px"></div></div>`;
  if (sh.form === 'number') return `<div class="numform" style="font-size:64px;color:hsl(40 36% 86%)">8</div>`;
  let t = ''; sh.tiers!.forEach((x) => { t += `<div class="mini-tier" style="width:${x.w * 0.42}px;height:${x.h * 0.42}px"></div>`; });
  const bw = sh.tiers![sh.tiers!.length - 1].w * 0.42 + 8;
  return `<div style="display:flex;flex-direction:column;align-items:center;justify-content:flex-end">${t}<div class="mini-plate" style="width:${bw}px"></div></div>`;
}
