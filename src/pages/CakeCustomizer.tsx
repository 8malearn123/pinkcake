import { useState, useMemo, useEffect, useRef, useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { toast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import '@/components/cake/cakeStudio.css';
import {
  STEPS, SHAPES, FLAVORS, COLORS, DESIGNS, ADDONS, QUICK_MESSAGES,
  buildCake, miniCakeHTML, price, type CakeConfig,
} from '@/lib/cakeBuilder';
import {
  ArrowRight, ChevronLeft, ChevronRight, Users, Clock, Wand2, Minus, Droplet,
  Sparkles, Leaf, Flower2, Flame, PenLine, Cake, Paintbrush, Check, BadgeCheck,
  ShieldCheck, ShoppingBag, PartyPopper, type LucideIcon,
} from 'lucide-react';

const DESIGN_ICON: Record<string, LucideIcon> = {
  minus: Minus, droplet: Droplet, sparkle2: Sparkles, leaf2: Leaf, flower: Flower2, flame: Flame,
};
const ADDON_ICON: Record<string, LucideIcon> = { flame: Flame, topper: PartyPopper };

const initial: CakeConfig = {
  shape: null, flavor: null, color: COLORS[0], design: DESIGNS[0], text: '', addons: { candle: false, topper: false },
};
const rnd = (a: number, b: number) => a + Math.random() * (b - a);

export default function CakeCustomizer() {
  const navigate = useNavigate();
  const location = useLocation();
  // Continue a design started in the home "design your cake" section.
  const incoming = (location.state as { initial?: CakeConfig } | null)?.initial;
  const [step, setStep] = useState(incoming?.shape ? 3 : 0);
  const [cfg, setCfg] = useState<CakeConfig>(
    incoming
      ? { ...initial, ...incoming, addons: { ...initial.addons, ...incoming.addons } }
      : initial,
  );
  const [done, setDone] = useState(false);

  const wrapRef = useRef<HTMLDivElement>(null);
  const confettiRef = useRef<HTMLCanvasElement>(null);

  const total = price(cfg);
  const art = useMemo(() => buildCake(cfg), [cfg]);
  const s = STEPS[step];
  const last = step === STEPS.length - 1;
  const canProceed = step === 0 ? !!cfg.shape : step === 1 ? !!cfg.flavor : true;

  // Settle bounce whenever the cake changes.
  useEffect(() => {
    const w = wrapRef.current;
    if (!w) return;
    w.classList.remove('settle');
    void w.offsetWidth;
    w.classList.add('settle');
  }, [art]);

  const go = (n: number) => setStep(Math.max(0, Math.min(STEPS.length - 1, n)));
  const back = () => (step > 0 ? go(step - 1) : navigate('/'));
  const set = (patch: Partial<CakeConfig>) => setCfg((c) => ({ ...c, ...patch }));

  const runConfetti = useCallback(() => {
    if (window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) return;
    const cv = confettiRef.current;
    const frame = cv?.parentElement;
    if (!cv || !frame) return;
    cv.width = frame.clientWidth;
    cv.height = frame.clientHeight;
    const ctx = cv.getContext('2d');
    if (!ctx) return;
    const cols = ['#c98a98', '#b0556a', '#e3c184', '#f3e2d4', '#fff', '#d6a0b1'];
    const parts = Array.from({ length: 140 }, () => ({
      x: cv.width / 2 + rnd(-40, 40), y: cv.height * 0.42, vx: rnd(-6, 6), vy: rnd(-13, -4),
      g: rnd(0.22, 0.4), s: rnd(5, 10), rot: rnd(0, 6.28), vr: rnd(-0.3, 0.3),
      c: cols[(Math.random() * cols.length) | 0], sh: Math.random() < 0.5,
    }));
    let t = 0;
    const loop = () => {
      ctx.clearRect(0, 0, cv.width, cv.height);
      parts.forEach((p) => {
        p.vy += p.g; p.x += p.vx; p.y += p.vy; p.rot += p.vr; p.vx *= 0.99;
        ctx.save(); ctx.translate(p.x, p.y); ctx.rotate(p.rot);
        ctx.fillStyle = p.c; ctx.globalAlpha = Math.max(0, 1 - t / 150);
        if (p.sh) ctx.fillRect(-p.s / 2, -p.s / 2, p.s, p.s * 0.6);
        else { ctx.beginPath(); ctx.arc(0, 0, p.s / 2, 0, 6.28); ctx.fill(); }
        ctx.restore();
      });
      t++;
      if (t < 150) requestAnimationFrame(loop);
      else ctx.clearRect(0, 0, cv.width, cv.height);
    };
    loop();
  }, []);

  const onNext = () => {
    if (!canProceed) {
      toast({ title: 'الرجاء الإكمال', description: 'اختاري خياراً للمتابعة', variant: 'destructive' });
      return;
    }
    if (last) {
      runConfetti();
      setDone(true);
      toast({ title: 'أُضيفت كيكتكِ إلى العربة', description: `الإجمالي ${total} ر.س — سنتواصل معكِ لتأكيد التوصيل` });
    } else {
      go(step + 1);
    }
  };

  const reset = () => { setDone(false); setCfg(initial); setStep(0); };

  const addonNames = ADDONS.filter((a) => cfg.addons[a.id as 'candle' | 'topper']).map((a) => a.name).join(' • ');

  return (
    <div className="cake-studio" dir="rtl">
      <div className="cz-frame">
        {/* Header */}
        <header className="app">
          <div className="hrow">
            <button className="ghost-btn" onClick={back} aria-label="رجوع"><ArrowRight size={18} /></button>
            <div className="hmid">
              <div className="wm serif">Pink Cake</div>
              <div className="ttl">صمّمي كيكتك</div>
            </div>
            <div className="htotal">
              <div className="lbl">الإجمالي</div>
              <div className="val"><span className="num">{total}</span><span className="cur">ر.س</span></div>
            </div>
          </div>
          <div className="rail">
            <div className="count">
              <span className="num seq" dir="ltr"><span>{String(step + 1).padStart(2, '0')}</span> <span className="tot">/ 05</span></span>
              <span className="cap">{s.cap}</span>
            </div>
            <div className="segs">
              {STEPS.map((_, i) => (
                <div
                  key={i}
                  className={cn('seg', i < step && 'fill', i === step && 'active')}
                  onClick={() => { if (i < step || (i === step + 1 && canProceed)) go(i); }}
                ><i /></div>
              ))}
            </div>
          </div>
        </header>

        {/* Live preview stage */}
        <div className="stage">
          <div className="spot" />
          <div className="live-pill"><span className="ld" /> معاينة حيّة</div>
          <div className="scene">
            <div className="cake-wrap" ref={wrapRef}>
              <div className="cake" dangerouslySetInnerHTML={{ __html: art.cake }} />
              <div className="stand" dangerouslySetInnerHTML={{ __html: art.stand }} />
            </div>
          </div>
          {cfg.shape ? (
            <div className="stage-cap">
              <div className="pill">
                <Users size={14} /><span>تكفي <b><bdi dir="ltr">{cfg.shape.serves}</bdi></b></span>
                <span className="dot" /><span>جاهزة خلال <b>{cfg.shape.lead}</b></span>
              </div>
            </div>
          ) : (
            <div className="ph-hint">
              <div>
                <div className="serif" style={{ fontSize: 34, color: 'hsl(var(--primary)/.5)', marginBottom: 6 }}>✲</div>
                <div style={{ fontSize: 13, fontWeight: 500 }}>اختاري شكل البداية لتظهر كيكتك هنا</div>
              </div>
            </div>
          )}
        </div>

        {/* Options panel */}
        <div className="panel">
          <div key={step}>
            <div className="shead sect">
              <div className="kick"><Wand2 size={13} /> {s.kick}</div>
              <h2>{s.title}</h2>
              <p>{s.sub}</p>
            </div>

            {s.key === 'shape' && (
              <div className="grid cols-2 sect">
                {SHAPES.map((sh) => (
                  <button key={sh.id} className={cn('card', cfg.shape?.id === sh.id && 'sel')} onClick={() => set({ shape: sh })}>
                    <div className="tick"><Check size={12} /></div>
                    <div className="thumb" dangerouslySetInnerHTML={{ __html: miniCakeHTML(sh) }} />
                    <div className="nm">{sh.name}</div>
                    <div className="meta"><Users size={13} /><bdi dir="ltr">{sh.serves}</bdi><span className="d" /><span>{sh.lead}</span></div>
                    <div className="pr">من <span className="v num">{sh.price}</span> ر.س</div>
                  </button>
                ))}
              </div>
            )}

            {s.key === 'flavor' && (
              <div className="sect" style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {FLAVORS.map((f) => (
                  <button key={f.id} className={cn('frow', cfg.flavor?.id === f.id && 'sel')} onClick={() => set({ flavor: f })}>
                    <div className="fdot" style={{ background: f.dot }} />
                    <div className="fmeta"><div className="nm">{f.name}</div><div className="ds">{f.ds}</div></div>
                    <div className="pr">{f.add ? `+${f.add} ر.س` : 'مشمولة'}</div>
                    <div className="fradio"><i /></div>
                  </button>
                ))}
              </div>
            )}

            {s.key === 'color' && (
              <div className="swatches sect">
                {COLORS.map((col) => (
                  <button key={col.id} className={cn('sw', cfg.color.id === col.id && 'sel')} onClick={() => set({ color: col })}>
                    <div className="dot" style={{ background: col.c }} />
                    <div className="nm">{col.name}</div>
                  </button>
                ))}
              </div>
            )}

            {s.key === 'design' && (
              <div className="grid cols-3 sect">
                {DESIGNS.map((d) => {
                  const Ic = DESIGN_ICON[d.icon] ?? Sparkles;
                  return (
                    <button key={d.id} className={cn('design', cfg.design.id === d.id && 'sel')} onClick={() => set({ design: d })}>
                      <div className="tick"><Check size={12} /></div>
                      <div className="ic"><Ic size={22} /></div>
                      <div className="nm">{d.name}</div>
                      <div className="pr">{d.add ? `+${d.add}` : 'مشمول'}</div>
                    </button>
                  );
                })}
              </div>
            )}

            {s.key === 'finish' && (
              <div className="sect">
                <div className="flabel" style={{ marginTop: 2 }}><PenLine size={16} /> الرسالة على الكيكة <span className="opt">— اختياري</span></div>
                <input
                  className="msg-input" maxLength={28} placeholder="اكتبي رسالتك هنا…"
                  value={cfg.text} onChange={(e) => set({ text: e.target.value })}
                />
                <div className="cc"><span>{cfg.text.length}</span>/28</div>
                <div className="chips">
                  {QUICK_MESSAGES.map((m) => (
                    <button key={m} className={cn('chip', cfg.text === m && 'sel')} onClick={() => set({ text: m })}>{m}</button>
                  ))}
                </div>

                <div className="flabel"><Flame size={16} /> إضافات الاحتفال <span className="opt">— اختياري</span></div>
                <div className="addons">
                  {ADDONS.map((a) => {
                    const Ic = ADDON_ICON[a.icon] ?? Flame;
                    const on = cfg.addons[a.id as 'candle' | 'topper'];
                    return (
                      <button key={a.id} className={cn('addon', on && 'on')} onClick={() => set({ addons: { ...cfg.addons, [a.id]: !on } })}>
                        <div className="ac"><Ic size={19} /></div>
                        <div className="am"><div className="nm">{a.name}</div><div className="ds">{a.ds}</div></div>
                        <div className="ap">+{a.add} ر.س</div>
                        <div className="check"><Check size={13} /></div>
                      </button>
                    );
                  })}
                </div>

                {/* Summary — anxiety-first, pre-CTA */}
                <div className="flabel" style={{ marginTop: 24 }}><Check size={16} /> ملخّص الطلب</div>
                <div className="summary">
                  <div className="srow"><div className="k"><Cake size={15} /> الشكل</div><div className="v">{cfg.shape ? <>{cfg.shape.name} <span style={{ color: 'hsl(var(--muted-foreground))', fontWeight: 500 }}>· {cfg.shape.serves}</span></> : '—'}</div></div>
                  <div className="srow"><div className="k"><Sparkles size={15} /> النكهة</div><div className={cn('v', !cfg.flavor && 'muted')}>{cfg.flavor ? cfg.flavor.name : '—'}</div></div>
                  <div className="srow"><div className="k"><Droplet size={15} /> اللون</div><div className="v">{cfg.color.name}</div></div>
                  <div className="srow"><div className="k"><Paintbrush size={15} /> التزيين</div><div className="v">{cfg.design.name}</div></div>
                  {cfg.text.trim() && <div className="srow"><div className="k"><PenLine size={15} /> الرسالة</div><div className="v">«{cfg.text.trim()}»</div></div>}
                  {addonNames && <div className="srow"><div className="k"><Flame size={15} /> إضافات</div><div className="v">{addonNames}</div></div>}
                  {cfg.shape && <div className="srow"><div className="k"><Clock size={15} /> الجاهزية</div><div className="v muted">خلال {cfg.shape.lead}</div></div>}
                  <div className="stotal"><div className="k">الإجمالي</div><div className="v"><span className="big num">{total}</span><span className="cur">ر.س</span></div></div>
                </div>
                <div className="assure"><BadgeCheck size={14} /> تعديلات مجانية غير محدودة قبل التأكيد.</div>
                <div className="assure"><ShieldCheck size={14} /> تُحضّر طازجة في فرعكِ الأقرب — تفاصيل التوصيل في الخطوة التالية.</div>
              </div>
            )}
          </div>
        </div>

        {/* Bottom nav */}
        <div className="botnav">
          <button className={cn('btn', 'btn-prev', step === 0 && 'hide')} onClick={back} aria-label="السابق"><ChevronRight size={18} /></button>
          <button className={cn('btn', 'btn-next', last && 'commit')} disabled={!canProceed} onClick={onNext}>
            {last ? (
              <><ShoppingBag size={18} /> <span>أضيفي تصميمكِ إلى العربة</span></>
            ) : (
              <><span>التالي <span className="pp"><span className="num">{total}</span> <span className="cur">ر.س</span></span></span> <ChevronLeft size={18} /></>
            )}
          </button>
        </div>

        <canvas id="confetti" ref={confettiRef} />

        <div className={cn('success', done && 'show')}>
          <div>
            <div className="badge"><Check size={42} /></div>
            <h3>أُضيفت كيكتكِ إلى العربة</h3>
            <p>
              {cfg.shape?.name} · {cfg.flavor?.name} · {cfg.color.name}{cfg.text.trim() ? ` · «${cfg.text.trim()}»` : ''}
              <br /><b style={{ color: 'hsl(var(--foreground))' }}>الإجمالي {total} ر.س</b>
              {cfg.shape ? ` — تكفي ${cfg.shape.serves}، جاهزة خلال ${cfg.shape.lead}.` : ''}
            </p>
            <button className="again" onClick={reset}>صمّمي كيكة أخرى</button>
          </div>
        </div>
      </div>
    </div>
  );
}
