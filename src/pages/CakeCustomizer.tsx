import { useState, useMemo, useEffect, useRef, useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { toast } from '@/hooks/use-toast';
import { useStoreCart } from '@/contexts/StoreCartContext';
import { cn } from '@/lib/utils';
import { RiyalSymbol } from '@/components/ui/riyal';
import '@/components/cake/cakeStudio.css';
import { ADDONS, QUICK_MESSAGES, PHOTO_PRINT_PRICE, type CartCakeDesign } from '@/lib/cakeStudio';
import { imageStorageKey } from '@/lib/cakeCatalog/catalog';
import { priceStudio } from '@/lib/cakePricing';
import {
  applyPick, availableValues, contiguousPath, deepestMatch, galleryCakes, nodeKey,
  pathLabels, seedPicks, stageCaption,
} from '@/lib/cakeSelect';
import { useCatalogSession } from '@/hooks/useCatalogSession';
import { CakeGallery } from '@/components/cake/CakeGallery';
import { CakeStage } from '@/components/cake/CakeStage';
import { LevelStep } from '@/components/cake/LevelStep';
import {
  ArrowRight, ChevronLeft, ChevronRight, Clock, Wand2, Flame, PenLine, Cake,
  Check, BadgeCheck, ShieldCheck, ShoppingBag, PartyPopper, ImagePlus, X, type LucideIcon,
} from 'lucide-react';

const ADDON_ICON: Record<string, LucideIcon> = { flame: Flame, topper: PartyPopper };
const rnd = (a: number, b: number) => a + Math.random() * (b - a);

/** The photo-driven studio: gallery → one step per catalog level → the finish step. */
export default function CakeCustomizer() {
  const navigate = useNavigate();
  const location = useLocation();
  const { addToCart } = useStoreCart();
  const { status, catalog, urlFor, byKey } = useCatalogSession();
  const levels = catalog.levels;

  const [screen, setScreen] = useState<'gallery' | 'design'>('gallery');
  const [cakeId, setCakeId] = useState<string | null>(null);
  const [rawPicks, setRawPicks] = useState<(string | null)[]>([]);
  const [step, setStep] = useState(0);
  const [text, setText] = useState('');
  const [addons, setAddons] = useState<Record<string, boolean>>({});
  const [done, setDone] = useState(false);
  // Edible photo print. Held client-side for pricing only; the actual upload is
  // wired on the backend later (kept out of the cart type).
  const [photo, setPhoto] = useState<string | null>(null);

  const confettiRef = useRef<HTMLCanvasElement>(null);

  // Continue a design started elsewhere ({initial: {cakeId, path}}). Consumed
  // once the catalog is ready; a stale deep-link (deleted cake, unphotographed
  // path) falls back to the gallery instead of rendering a dead studio.
  const consumedInitial = useRef(false);
  useEffect(() => {
    if (status !== 'ready' || consumedInitial.current) return;
    consumedInitial.current = true;
    const incoming = (location.state as { initial?: { cakeId?: string; path?: string[] } } | null)
      ?.initial;
    if (!incoming?.cakeId) return;
    const cake = catalog.cakes.find((c) => c.id === incoming.cakeId);
    if (!cake) return;
    const path = incoming.path ?? [];
    const photoBacked = path.every((_, i) => byKey.has(nodeKey(cake.id, path.slice(0, i + 1))));
    const usable = photoBacked ? path : [];
    setCakeId(cake.id);
    setRawPicks(seedPicks(catalog.levels, usable));
    setStep(usable.length);
    setScreen('design');
  }, [status, catalog, byKey, location.state]);

  const cake = cakeId ? catalog.cakes.find((c) => c.id === cakeId) ?? null : null;
  const inDesign = screen === 'design' && !!cake;

  // The catalog can change under us (admin edits in another tab); a stale-length
  // picks array must never index into the wrong level.
  const picks = rawPicks.length === levels.length ? rawPicks : seedPicks(levels);
  const path = contiguousPath(picks);
  const labels = pathLabels(levels, path);
  const stepCount = levels.length + 1;
  const last = step === levels.length;
  const level = !last ? levels[step] : null;

  // Options for this step exist only when every earlier level was picked; a gap
  // means the whole deeper subtree is unphotographed anyway.
  const stepPrefix = useMemo(() => {
    const prefix = picks.slice(0, step);
    return prefix.every(Boolean) ? (prefix as string[]) : null;
  }, [picks, step]);

  const values = useMemo(
    () => (inDesign && level && stepPrefix ? availableValues(catalog, byKey, urlFor, cake!.id, stepPrefix) : []),
    [inDesign, level, stepPrefix, catalog, byKey, urlFor, cake],
  );

  const gallery = useMemo(() => galleryCakes(catalog, urlFor), [catalog, urlFor]);

  const match = useMemo(
    () =>
      inDesign
        ? deepestMatch(catalog, byKey, urlFor, cake!, path)
        : { url: null, imageId: null, depth: -1 },
    [inDesign, catalog, byKey, urlFor, cake, path],
  );
  const caption = inDesign ? stageCaption(cake!, labels, match) : null;

  const pricing = useMemo(
    () => priceStudio({ cake, levels, path, addons, hasPhoto: !!photo }),
    [cake, levels, path, addons, photo],
  );
  const total = pricing.total;

  const canProceed = last || values.length === 0 || picks[step] != null;

  const go = (n: number) => setStep(Math.max(0, Math.min(stepCount - 1, n)));
  const backToGallery = () => {
    setScreen('gallery');
    setCakeId(null);
    setRawPicks([]);
    setStep(0);
  };
  const back = () => {
    if (!inDesign) return navigate('/store');
    if (step > 0) return go(step - 1);
    backToGallery();
  };
  const pick = (valueId: string) => setRawPicks(applyPick(picks, step, valueId));
  const openCake = (id: string) => {
    setCakeId(id);
    setRawPicks(seedPicks(levels));
    setStep(0);
    setScreen('design');
  };

  const onPhoto = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => setPhoto(typeof reader.result === 'string' ? reader.result : null);
    reader.readAsDataURL(file);
    e.target.value = '';
  };

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
      toast({ title: 'الرجاء الإكمال', description: 'اختر خياراً للمتابعة', variant: 'destructive' });
      return;
    }
    if (last) {
      if (!cake || path.length === 0) {
        toast({ title: 'الرجاء الإكمال', description: 'اختر خياراً للمتابعة', variant: 'destructive' });
        return;
      }
      // Ids AND Arabic labels: photos are per-browser, so labels are what the
      // kitchen can always read. Object URLs never enter this payload.
      const design: CartCakeDesign = {
        v: 2,
        cakeId: cake.id,
        cakeName: cake.name,
        path,
        pathLabels: labels,
        levelLabels: levels.slice(0, path.length).map((l) => l.name),
        photoKey: imageStorageKey(cake.id, path),
        photoImageId: match.imageId ?? undefined,
        text: text.trim() || undefined,
        addons: ADDONS.filter((a) => addons[a.id]).map((a) => a.id),
        photoPrint: !!photo,
      };
      addToCart({
        id: `custom-${Date.now()}`,
        name: `كيكة مخصّصة — ${cake.name}`,
        description:
          [cake.name, ...labels].join(' · ') +
          (text.trim() ? ` · «${text.trim()}»` : '') +
          (photo ? ' · مع صورة مطبوعة' : ''),
        price: total,
        category: 'تصميم خاص',
        image_url: null,
        cake_design: design,
      });
      runConfetti();
      setDone(true);
    } else {
      go(step + 1);
    }
  };

  const reset = () => {
    setDone(false);
    setText('');
    setAddons({});
    setPhoto(null);
    backToGallery();
  };

  const addonNames = ADDONS.filter((a) => addons[a.id]).map((a) => a.name).join(' • ');
  const prevLevelName = step > 0 ? levels[step - 1]?.name : undefined;

  return (
    <div className="cake-studio" dir="rtl">
      <div className="cz-frame">
        {/* Header */}
        <header className="app">
          <div className="hrow">
            <button className="ghost-btn" onClick={back} aria-label="رجوع"><ArrowRight size={18} /></button>
            <div className="hmid">
              <div className="wm serif">Pink Cake</div>
              <div className="ttl">صمّم كيكتك</div>
            </div>
            <div className="htotal">
              <div className="lbl">الإجمالي</div>
              <div className="val"><span className="num">{total}</span><RiyalSymbol className="cur" /></div>
            </div>
          </div>
          {inDesign && (
            <div className="rail">
              <div className="count">
                <span className="num seq" dir="ltr">
                  <span>{String(step + 1).padStart(2, '0')}</span>{' '}
                  <span className="tot">/ {String(stepCount).padStart(2, '0')}</span>
                </span>
                <span className="cap">{level ? level.name : 'الإهداء'}</span>
              </div>
              <div className="segs">
                {Array.from({ length: stepCount }, (_, i) => (
                  <div
                    key={i}
                    className={cn('seg', i < step && 'fill', i === step && 'active')}
                    onClick={() => { if (i < step || (i === step + 1 && canProceed)) go(i); }}
                  ><i /></div>
                ))}
              </div>
            </div>
          )}
        </header>

        {/* Live preview stage */}
        {inDesign && (
          <div className="stage">
            <div className="spot" />
            <CakeStage
              url={match.url}
              alt={[cake!.name, ...labels].join(' · ')}
              caption={caption}
              serves={cake!.serves}
              leadTime={cake!.leadTime}
              empty={match.url == null}
            />
          </div>
        )}

        {/* Options panel */}
        <div className="panel">
          {!inDesign ? (
            status === 'loading' ? (
              <div className="ph-hint" style={{ position: 'relative', minHeight: 220 }}>
                <div style={{ fontSize: 13, fontWeight: 500 }}>جارٍ تحضير الاستوديو…</div>
              </div>
            ) : (
              <CakeGallery items={gallery} onPick={openCake} onBrowse={() => navigate('/shop')} />
            )
          ) : (
            <div key={step}>
              <div className="shead sect">
                <div className="kick"><Wand2 size={13} /> {level ? 'اختيارك' : 'اللمسة الأخيرة'}</div>
                <h2>{level ? `اختر ${level.name}` : 'رسالتك وإضافاتك'}</h2>
                <p>{level ? 'كل ما تراه متوفر فعلاً — مصوّر في مطبخنا.' : 'كلمة من القلب وإضافات الاحتفال.'}</p>
              </div>

              {level && (
                <LevelStep
                  level={level}
                  values={values}
                  selectedId={picks[step]}
                  onPick={pick}
                  onBack={step > 0 ? () => go(step - 1) : undefined}
                  prevLevelName={prevLevelName}
                />
              )}

              {last && (
                <div className="sect">
                  <div className="flabel" style={{ marginTop: 2 }}><PenLine size={16} /> الرسالة على الكيكة <span className="opt">— اختياري</span></div>
                  <input
                    className="msg-input" maxLength={28} placeholder="اكتب رسالتك هنا…"
                    value={text} onChange={(e) => setText(e.target.value)}
                  />
                  <div className="cc"><span>{text.length}</span>/28</div>
                  <div className="chips">
                    {QUICK_MESSAGES.map((m) => (
                      <button key={m} className={cn('chip', text === m && 'sel')} onClick={() => setText(m)}>{m}</button>
                    ))}
                  </div>

                  <div className="flabel"><ImagePlus size={16} /> اطبع صورتك على الكيكة <span className="opt">— اختياري</span></div>
                  {photo ? (
                    <div className="photo-prev">
                      <img src={photo} alt="الصورة المرفقة" />
                      <button className="rm" onClick={() => setPhoto(null)} aria-label="إزالة الصورة"><X size={15} /></button>
                    </div>
                  ) : (
                    <label className="photo-drop">
                      <div className="pic"><ImagePlus size={20} /></div>
                      <div className="t">أرفقي صورة للطباعة</div>
                      <div className="h">صورة بصيغة JPG أو PNG — نضعها على كيكتك بأفضل شكل</div>
                      <input type="file" accept="image/*" hidden onChange={onPhoto} />
                    </label>
                  )}
                  <div className="photo-note"><BadgeCheck size={14} /> طباعة صالحة للأكل <span className="add">+{PHOTO_PRINT_PRICE} <RiyalSymbol /></span></div>

                  <div className="flabel"><Flame size={16} /> إضافات الاحتفال <span className="opt">— اختياري</span></div>
                  <div className="addons">
                    {ADDONS.map((a) => {
                      const Ic = ADDON_ICON[a.icon] ?? Flame;
                      const on = !!addons[a.id];
                      return (
                        <button key={a.id} className={cn('addon', on && 'on')} onClick={() => setAddons((prev) => ({ ...prev, [a.id]: !prev[a.id] }))}>
                          <div className="ac"><Ic size={19} /></div>
                          <div className="am"><div className="nm">{a.name}</div><div className="ds">{a.ds}</div></div>
                          <div className="ap">+{a.add} <RiyalSymbol /></div>
                          <div className="check"><Check size={13} /></div>
                        </button>
                      );
                    })}
                  </div>

                  {/* Summary — anxiety-first, pre-CTA */}
                  <div className="flabel" style={{ marginTop: 24 }}><Check size={16} /> ملخّص الطلب</div>
                  <div className="summary">
                    <div className="srow"><div className="k"><Cake size={15} /> الكيكة</div><div className="v">{cake!.name} <span style={{ color: 'hsl(var(--muted-foreground))', fontWeight: 500 }}>· تكفي <bdi dir="ltr">{cake!.serves}</bdi></span></div></div>
                    {path.map((valueId, i) => (
                      <div className="srow" key={valueId}>
                        <div className="k"><Check size={15} /> {levels[i]?.name}</div>
                        <div className="v">{labels[i]}</div>
                      </div>
                    ))}
                    {text.trim() && <div className="srow"><div className="k"><PenLine size={15} /> الرسالة</div><div className="v">«{text.trim()}»</div></div>}
                    {addonNames && <div className="srow"><div className="k"><Flame size={15} /> إضافات</div><div className="v">{addonNames}</div></div>}
                    {photo && <div className="srow"><div className="k"><ImagePlus size={15} /> صورة</div><div className="v">مطبوعة على الكيكة</div></div>}
                    <div className="srow"><div className="k"><Clock size={15} /> الجاهزية</div><div className="v muted">خلال {cake!.leadTime}</div></div>
                    <div className="stotal"><div className="k">الإجمالي</div><div className="v"><span className="big num">{total}</span><RiyalSymbol className="cur" /></div></div>
                  </div>
                  <div className="assure"><BadgeCheck size={14} /> تعديلات مجانية غير محدودة قبل التأكيد.</div>
                  <div className="assure"><ShieldCheck size={14} /> تُحضّر طازجة في فرعك الأقرب — تفاصيل التوصيل في الخطوة التالية.</div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Bottom nav */}
        {inDesign && (
          <div className="botnav">
            <button className="btn btn-prev" onClick={back} aria-label="السابق"><ChevronRight size={18} /></button>
            <button className={cn('btn', 'btn-next', last && 'commit')} disabled={!canProceed} onClick={onNext}>
              {last ? (
                <><ShoppingBag size={18} /> <span>أضِف تصميمك إلى العربة</span></>
              ) : (
                <><span>التالي <span className="pp"><span className="num">{total}</span> <RiyalSymbol className="cur" /></span></span> <ChevronLeft size={18} /></>
              )}
            </button>
          </div>
        )}

        <canvas id="confetti" ref={confettiRef} />

        <div className={cn('success', done && 'show')}>
          <div>
            <div className="badge"><Check size={42} /></div>
            <h3>أُضيفت كيكتك إلى العربة</h3>
            <p>
              {cake ? [cake.name, ...labels].join(' · ') : ''}{text.trim() ? ` · «${text.trim()}»` : ''}
              <br /><b style={{ color: 'hsl(var(--foreground))' }}>الإجمالي {total} <RiyalSymbol /></b>
              {cake ? ` — تكفي ${cake.serves}، جاهزة خلال ${cake.leadTime}.` : ''}
            </p>
            <div style={{ display: 'flex', gap: 10, justifyContent: 'center', flexWrap: 'wrap' }}>
              <button
                className="again"
                style={{ background: 'hsl(var(--foreground))', color: 'hsl(var(--background))', border: 'none' }}
                onClick={() => navigate('/store', { state: { openCart: true } })}
              >
                إتمام الطلب
              </button>
              <button className="again" onClick={reset}>صمّم كيكة أخرى</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
