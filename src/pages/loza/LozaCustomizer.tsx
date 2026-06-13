import { useState, useMemo, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ChevronLeft, ChevronRight, Check, X, Cake, Sparkles, Palette, Layers, Type,
  ShoppingCart, Pipette,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { toast } from '@/hooks/use-toast';
import LozaShell from './LozaShell';
import Cake2DPreview from '@/components/loza/Cake2DPreview';
import { useLozaCart } from '@/contexts/LozaCartContext';

const STEPS = [
  { id: 1, title: 'الأساس', icon: Cake },
  { id: 2, title: 'النكهة', icon: Sparkles },
  { id: 3, title: 'اللون', icon: Palette },
  { id: 4, title: 'التصميم', icon: Layers },
  { id: 5, title: 'الكتابة', icon: Type },
];

const BASES = [
  { id: 'classic', name: 'كلاسيكية', desc: 'طابق واحد • 8-10 أشخاص', price: 95, emoji: '🎂' },
  { id: 'tier-2', name: 'طابقين', desc: '15-20 شخص', price: 195, emoji: '🍰' },
  { id: 'tier-3', name: 'ثلاث طوابق', desc: '25-35 شخص', price: 340, emoji: '🎂' },
  { id: 'cupcakes', name: 'كاب كيك', desc: '12 قطعة', price: 110, emoji: '🧁' },
  { id: 'number', name: 'بشكل رقم', desc: 'حسب العدد', price: 165, emoji: '🔢' },
  { id: 'blank', name: 'من الصفر', desc: 'تصميمك الخاص', price: 0, emoji: '✨' },
];

const FLAVORS = [
  { id: 'vanilla', name: 'فانيلا', price: 0, emoji: '🌼', tone: '#FAF6EE' },
  { id: 'chocolate', name: 'شوكولاتة', price: 10, emoji: '🍫', tone: '#5D3A1F' },
  { id: 'red-velvet', name: 'ريد فيلفت', price: 15, emoji: '❤️', tone: '#A52A2A' },
  { id: 'lotus', name: 'لوتس', price: 20, emoji: '🍪', tone: '#C68B4F' },
  { id: 'pistachio', name: 'فستق', price: 25, emoji: '🥜', tone: '#A8C97C' },
  { id: 'saffron', name: 'زعفران بيكان', price: 30, emoji: '🟡', tone: '#E5B84B' },
  { id: 'mango', name: 'مانجو', price: 15, emoji: '🥭', tone: '#FFC04D' },
  { id: 'caramel', name: 'كراميل', price: 18, emoji: '🍯', tone: '#C68642' },
  { id: 'date', name: 'تمر', price: 18, emoji: '🟤', tone: '#6B4423' },
];

const COLOR_PALETTES = [
  { name: 'الذهبي الفاخر', colors: ['#F0DFA0', '#C9A84C', '#8A6A1E'] },
  { name: 'الوردي الناعم', colors: ['#FCE4EC', '#F8BBD0', '#F06292'] },
  { name: 'الأبيض الكلاسيكي', colors: ['#FFFFFF', '#FAF6EE', '#E6DCC8'] },
  { name: 'الباستيل', colors: ['#FFE082', '#A5D6A7', '#90CAF9'] },
  { name: 'الأرضي', colors: ['#3D2B1A', '#8A6A1E', '#C9A84C'] },
];

const COLORS = [
  '#FFFFFF', '#FAF6EE', '#FCE4EC', '#F8BBD0', '#F06292', '#D81B60',
  '#FFE082', '#FFB74D', '#FFAB91', '#EF9A9A', '#E57373', '#C62828',
  '#A5D6A7', '#81C784', '#90CAF9', '#64B5F6', '#80DEEA', '#B39DDB',
  '#9575CD', '#F0DFA0', '#C9A84C', '#8A6A1E', '#5D3A1F', '#000000',
];

const DESIGNS = [
  { id: 'minimal', name: 'بسيط أنيق', price: 0, emoji: '⚪', desc: 'سطح ناعم بدون زخارف' },
  { id: 'roses', name: 'ورود طبيعية', price: 35, emoji: '🌹', desc: 'ورود كريمة على المحيط' },
  { id: 'geometric', name: 'هندسي', price: 25, emoji: '🔷', desc: 'أشكال هندسية حديثة' },
  { id: 'cartoon', name: 'كرتوني', price: 45, emoji: '🎈', desc: 'مثالي للأطفال' },
  { id: 'luxury', name: 'فاخر بالذهب', price: 75, emoji: '✨', desc: 'لمسات ذهبية أكلة' },
  { id: 'floral', name: 'زهور متنوعة', price: 50, emoji: '🌸', desc: 'تنسيق زهور موسمية' },
];

const PRINT_PRICE = 15;

interface State {
  baseId: string | null;
  flavors: string[];
  colors: string[];
  designId: string | null;
  hasText: boolean;
  text: string;
  hasPrint: boolean;
  notes: string;
}

export default function LozaCustomizer() {
  const navigate = useNavigate();
  const { add } = useLozaCart();
  const [step, setStep] = useState(1);
  const [dir, setDir] = useState<'next' | 'prev'>('next');
  const [s, setS] = useState<State>({
    baseId: null,
    flavors: [],
    colors: [],
    designId: null,
    hasText: false,
    text: '',
    hasPrint: false,
    notes: '',
  });

  // Auto-scroll to top on step change for clean UX
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [step]);

  const total = useMemo(() => {
    let t = 0;
    t += BASES.find((b) => b.id === s.baseId)?.price ?? 0;
    s.flavors.forEach((id) => (t += FLAVORS.find((f) => f.id === id)?.price ?? 0));
    t += DESIGNS.find((d) => d.id === s.designId)?.price ?? 0;
    if (s.hasText && s.text.trim()) t += PRINT_PRICE;
    if (s.hasPrint) t += PRINT_PRICE;
    return t;
  }, [s]);

  const canNext = useMemo(() => {
    switch (step) {
      case 1: return !!s.baseId;
      case 2: return s.flavors.length > 0;
      case 3: return s.colors.length > 0;
      case 4: return !!s.designId;
      case 5: return true;
    }
    return false;
  }, [step, s]);

  const next = () => {
    if (!canNext) {
      toast({ title: 'الرجاء إكمال الخطوة الحالية', variant: 'destructive' });
      return;
    }
    if (step < 5) { setDir('next'); setStep(step + 1); }
  };
  const prev = () => { if (step > 1) { setDir('prev'); setStep(step - 1); } };

  const toggleFlavor = (id: string) => {
    setS((p) => {
      if (p.flavors.includes(id)) return { ...p, flavors: p.flavors.filter((x) => x !== id) };
      if (p.flavors.length >= 2) {
        toast({ title: 'الحد الأقصى نكهتين', description: 'احذف نكهة لإضافة أخرى', variant: 'destructive' });
        return p;
      }
      return { ...p, flavors: [...p.flavors, id] };
    });
  };

  const toggleColor = (c: string) => {
    setS((p) => {
      if (p.colors.includes(c)) return { ...p, colors: p.colors.filter((x) => x !== c) };
      if (p.colors.length >= 3) {
        toast({ title: 'الحد الأقصى 3 ألوان', variant: 'destructive' });
        return p;
      }
      return { ...p, colors: [...p.colors, c] };
    });
  };

  const applyPalette = (colors: string[]) => {
    setS((p) => ({ ...p, colors: [...colors] }));
    toast({ title: 'تم تطبيق التركيبة 🎨' });
  };

  const submit = () => {
    const baseName = BASES.find((b) => b.id === s.baseId)?.name || 'كيكة';
    const flavorNames = s.flavors.map((id) => FLAVORS.find((f) => f.id === id)?.name).filter(Boolean).join(' + ');
    add({
      productId: `custom-${Date.now()}`,
      name: `كيكة مصمّمة • ${baseName}${flavorNames ? ` • ${flavorNames}` : ''}`,
      vendor: 'تصميم لوزا',
      emoji: '✨',
      unitPrice: total,
      quantity: 1,
      isCustom: true,
      notes: s.notes.trim() || undefined,
      customSpec: {
        base: s.baseId || '',
        flavors: s.flavors,
        colors: s.colors,
        designId: s.designId || undefined,
        text: s.hasText ? s.text : undefined,
        hasPrint: s.hasPrint,
        chefNote: s.notes,
      },
    });
    setTimeout(() => navigate('/loza/cart'), 600);
  };

  return (
    <LozaShell>
      {/* Sticky Header */}
      <header className="sticky top-0 z-40 bg-background/95 backdrop-blur-md border-b border-border">
        <div className="container mx-auto max-w-3xl px-4 py-3 flex items-center justify-between gap-3">
          <Button variant="ghost" size="icon" aria-label="إغلاق" onClick={() => navigate('/loza')} className="rounded-full hover:bg-muted">
            <X className="w-5 h-5" />
          </Button>
          <div className="text-center flex-1">
            <div className="text-[11px] text-muted-foreground">الخطوة {step} من 5</div>
            <h1 className="font-bold font-loza-display text-base leading-tight">{STEPS[step - 1].title}</h1>
          </div>
          <div className="text-end min-w-[80px]">
            <div className="text-[10px] text-muted-foreground">السعر</div>
            <div className="text-base font-extrabold text-gradient-loza">{total} ر.س</div>
          </div>
        </div>

        {/* Progress + step icons */}
        <div className="container mx-auto max-w-3xl px-4 pb-3">
          <div className="flex gap-1.5 mb-2.5">
            {STEPS.map((st) => (
              <div
                key={st.id}
                className={cn(
                  'h-1.5 flex-1 rounded-full transition-all duration-500',
                  st.id < step && 'bg-[hsl(var(--loza-brown))]',
                  st.id === step && 'gradient-loza-gold',
                  st.id > step && 'bg-border',
                )}
              />
            ))}
          </div>
          <div className="flex justify-between">
            {STEPS.map((st) => {
              const Icon = st.icon;
              const active = st.id === step;
              const done = st.id < step;
              return (
                <button
                  key={st.id}
                  onClick={() => st.id < step && (setDir('prev'), setStep(st.id))}
                  disabled={st.id > step}
                  className={cn(
                    'flex flex-col items-center gap-1 transition-all',
                    st.id <= step ? 'cursor-pointer' : 'cursor-not-allowed opacity-40',
                  )}
                >
                  <div
                    className={cn(
                      'w-8 h-8 rounded-full flex items-center justify-center transition-all',
                      active && 'gradient-loza-gold scale-110 shadow-loza',
                      done && 'bg-[hsl(var(--loza-brown))] text-background',
                      !active && !done && 'bg-muted text-muted-foreground',
                    )}
                  >
                    {done ? <Check className="w-4 h-4" strokeWidth={3} /> : <Icon className="w-4 h-4" />}
                  </div>
                  <span className={cn('text-[10px]', active && 'font-bold text-primary')}>{st.title}</span>
                </button>
              );
            })}
          </div>
        </div>
      </header>

      <main className="container mx-auto max-w-3xl px-4 py-5 pb-32 space-y-5">
        {/* 2D Live Preview */}
        <div className="relative h-80 rounded-3xl overflow-hidden shadow-loza-lift bg-gradient-to-br from-[hsl(var(--loza-cream))] via-white to-[hsl(var(--loza-gold-light)/0.3)]">
          {/* decorative blobs */}
          <div className="absolute -top-20 -start-20 w-56 h-56 rounded-full bg-[hsl(var(--loza-gold)/0.15)] blur-3xl" />
          <div className="absolute -bottom-20 -end-20 w-56 h-56 rounded-full bg-[hsl(var(--loza-brown)/0.1)] blur-3xl" />

          <Cake2DPreview
            baseId={s.baseId}
            colors={s.colors}
            flavorTones={s.flavors.map((id) => FLAVORS.find((f) => f.id === id)?.tone || '#E8C9A0')}
            designId={s.designId}
            text={s.hasText ? s.text : undefined}
            hasPrint={s.hasPrint}
          />

          {/* Top labels */}
          <div className="absolute top-3 start-3 flex gap-1.5">
            {s.designId && (
              <span className="bg-white/90 backdrop-blur px-2.5 py-1 rounded-full text-[10px] font-bold flex items-center gap-1 shadow">
                {DESIGNS.find((d) => d.id === s.designId)?.emoji}
                {DESIGNS.find((d) => d.id === s.designId)?.name}
              </span>
            )}
            {s.flavors.length > 0 && (
              <span className="bg-white/90 backdrop-blur px-2.5 py-1 rounded-full text-[10px] font-bold flex items-center gap-1 shadow">
                {s.flavors.map((id) => FLAVORS.find((f) => f.id === id)?.emoji).join(' ')}
              </span>
            )}
          </div>
          <div className="absolute top-3 end-3 bg-white/80 backdrop-blur px-2.5 py-1 rounded-full text-[10px] font-medium text-muted-foreground flex items-center gap-1">
            <span className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse" />
            معاينة مباشرة
          </div>
        </div>

        {/* Step content */}
        <div
          key={step}
          className={cn(
            'animate-in fade-in duration-300',
            dir === 'next' ? 'slide-in-from-right-4' : 'slide-in-from-left-4',
          )}
        >
          {step === 1 && (
            <section className="space-y-4">
              <StepHeader title="ابدأ باختيار قاعدة الكيكة المناسبة" subtitle="ستنعكس كل التعديلات اللاحقة على الكيكة المختارة" />
              <div className="grid grid-cols-2 gap-3">
                {BASES.map((b) => {
                  const sel = s.baseId === b.id;
                  const flavorTones = s.flavors.map((id) => FLAVORS.find((f) => f.id === id)?.tone || '#E8C9A0');
                  // Show the user's chosen colors on the selected card; neutral cream on others
                  const previewColors = sel && s.colors.length > 0 ? s.colors : ['#F5E6C4', '#E8D5A8', '#D4B97A'];
                  return (
                    <button
                      key={b.id}
                      onClick={() => setS((p) => ({ ...p, baseId: b.id }))}
                      className={cn(
                        'group relative p-3 rounded-2xl border-2 bg-card text-start transition-all duration-300 overflow-hidden',
                        'hover:-translate-y-1 hover:shadow-loza',
                        sel ? 'border-primary shadow-loza-lift bg-gradient-to-br from-card to-[hsl(var(--loza-gold-light)/0.25)]'
                            : 'border-border',
                      )}
                    >
                      {sel && (
                        <div className="absolute top-2 end-2 w-6 h-6 rounded-full gradient-loza-gold flex items-center justify-center shadow z-10">
                          <Check className="w-3.5 h-3.5 text-[hsl(var(--loza-brown))]" strokeWidth={3} />
                        </div>
                      )}
                      {/* Drawn cake thumbnail */}
                      <div className="relative h-28 -mx-1 mb-2 rounded-xl bg-gradient-to-b from-[hsl(var(--loza-cream))] to-white overflow-hidden">
                        <Cake2DPreview
                          baseId={b.id}
                          colors={previewColors}
                          flavorTones={sel ? flavorTones : []}
                          designId={sel ? s.designId : null}
                          className="!h-full"
                        />
                      </div>
                      <div className="font-bold text-sm">{b.name}</div>
                      <div className="text-[11px] text-muted-foreground mt-0.5">{b.desc}</div>
                      <div className="text-xs text-primary font-extrabold mt-1.5">
                        {b.price > 0 ? `من ${b.price} ر.س` : 'مجاناً'}
                      </div>
                    </button>
                  );
                })}
              </div>
            </section>
          )}

          {step === 2 && (
            <section className="space-y-4">
              <StepHeader
                title="اختر النكهة"
                subtitle={`نكهة واحدة أو نكهتين — ${s.flavors.length}/2`}
              />
              <div className="grid grid-cols-3 gap-3">
                {FLAVORS.map((f) => {
                  const sel = s.flavors.includes(f.id);
                  return (
                    <button
                      key={f.id}
                      onClick={() => toggleFlavor(f.id)}
                      className={cn(
                        'group relative p-3 rounded-2xl border-2 bg-card transition-all duration-300',
                        'hover:-translate-y-1',
                        sel ? 'border-primary shadow-loza scale-[1.04]' : 'border-border',
                      )}
                    >
                      {sel && (
                        <div className="absolute -top-1.5 -end-1.5 w-5 h-5 rounded-full gradient-loza-gold flex items-center justify-center shadow z-10">
                          <Check className="w-3 h-3 text-[hsl(var(--loza-brown))]" strokeWidth={3} />
                        </div>
                      )}
                      <div
                        className="w-12 h-12 mx-auto rounded-full mb-2 flex items-center justify-center text-2xl shadow-inner"
                        style={{ background: `radial-gradient(circle at 30% 30%, ${f.tone}ee, ${f.tone})` }}
                      >
                        {f.emoji}
                      </div>
                      <div className="font-bold text-xs">{f.name}</div>
                      {f.price > 0 && (
                        <div className="text-[10px] text-primary font-bold mt-0.5">+{f.price} ر.س</div>
                      )}
                    </button>
                  );
                })}
              </div>
            </section>
          )}

          {step === 3 && (
            <section className="space-y-4">
              <StepHeader title="اختر لون الكريمة" subtitle={`حتى 3 ألوان — ${s.colors.length}/3`} />

              {/* Curated palettes */}
              <div className="space-y-2">
                <div className="text-xs font-bold text-muted-foreground flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5" /> تركيبات جاهزة
                </div>
                <div className="flex gap-2 overflow-x-auto pb-2 -mx-1 px-1">
                  {COLOR_PALETTES.map((p) => (
                    <button
                      key={p.name}
                      onClick={() => applyPalette(p.colors)}
                      className="shrink-0 bg-card border border-border rounded-xl p-2 hover:shadow-loza hover:-translate-y-0.5 transition-all"
                    >
                      <div className="flex gap-1 mb-1.5">
                        {p.colors.map((c) => (
                          <span key={c} className="w-5 h-5 rounded-full border border-white shadow-sm" style={{ background: c }} />
                        ))}
                      </div>
                      <div className="text-[10px] font-bold text-foreground">{p.name}</div>
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-2">
                <div className="text-xs font-bold text-muted-foreground flex items-center gap-1.5">
                  <Pipette className="w-3.5 h-3.5" /> اختر يدوياً
                </div>
                <div className="grid grid-cols-8 gap-2.5 p-3 bg-card rounded-2xl border border-border">
                  {COLORS.map((c) => {
                    const sel = s.colors.includes(c);
                    const order = s.colors.indexOf(c) + 1;
                    return (
                      <button
                        key={c}
                        onClick={() => toggleColor(c)}
                        className={cn(
                          'aspect-square rounded-full transition-all relative',
                          'hover:scale-110',
                          sel ? 'scale-110 ring-2 ring-primary ring-offset-2 ring-offset-card' : 'shadow-sm',
                        )}
                        style={{ backgroundColor: c, border: c === '#FFFFFF' ? '1px solid #ddd' : 'none' }}
                        aria-label={c}
                      >
                        {sel && (
                          <div className="absolute inset-0 flex items-center justify-center">
                            <span className="w-4 h-4 rounded-full bg-white text-[10px] font-bold text-[hsl(var(--loza-brown))] flex items-center justify-center shadow">
                              {order}
                            </span>
                          </div>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>

              {s.colors.length > 0 && (
                <div className="bg-muted/40 rounded-xl p-3">
                  <div className="text-[10px] font-bold text-muted-foreground mb-2">الترتيب: من الأسفل للأعلى</div>
                  <div className="flex gap-2 items-center">
                    {s.colors.map((c, i) => (
                      <div key={c} className="flex items-center gap-2 bg-card px-2 py-1 rounded-full text-[10px] font-bold border border-border">
                        <span className="w-4 h-4 rounded-full border border-white shadow" style={{ background: c }} />
                        طابق {i + 1}
                        <button onClick={() => toggleColor(c)} className="text-muted-foreground hover:text-destructive">
                          <X className="w-3 h-3" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </section>
          )}

          {step === 4 && (
            <section className="space-y-4">
              <StepHeader title="اختر تصميم الزخرفة" subtitle="اختياري — يمكن تخطيه بدون رسوم" />
              <div className="grid grid-cols-2 gap-3">
                {DESIGNS.map((d) => {
                  const sel = s.designId === d.id;
                  return (
                    <button
                      key={d.id}
                      onClick={() => setS((p) => ({ ...p, designId: d.id }))}
                      className={cn(
                        'p-4 rounded-2xl border-2 bg-card text-start transition-all duration-300 relative',
                        'hover:-translate-y-1',
                        sel ? 'border-primary shadow-loza-lift bg-gradient-to-br from-card to-[hsl(var(--loza-gold-light)/0.2)]'
                            : 'border-border',
                      )}
                    >
                      {sel && (
                        <div className="absolute top-2 end-2 w-6 h-6 rounded-full gradient-loza-gold flex items-center justify-center shadow">
                          <Check className="w-3.5 h-3.5 text-[hsl(var(--loza-brown))]" strokeWidth={3} />
                        </div>
                      )}
                      <div className="text-4xl mb-2">{d.emoji}</div>
                      <div className="font-bold text-sm">{d.name}</div>
                      <div className="text-[11px] text-muted-foreground mt-0.5 leading-snug">{d.desc}</div>
                      <div className="text-[11px] text-primary font-bold mt-1.5">
                        {d.price > 0 ? `+${d.price} ر.س` : 'مجاناً'}
                      </div>
                    </button>
                  );
                })}
              </div>
            </section>
          )}

          {step === 5 && (
            <section className="space-y-5">
              <StepHeader title="الكتابة والطباعة" subtitle="أضف لمستك الأخيرة" />

              <div className="bg-card border-2 border-border rounded-2xl p-4 transition-all hover:border-primary/40">
                <div className="flex items-center justify-between gap-3">
                  <div className="flex-1">
                    <Label className="font-bold text-sm">كتابة على الكيكة</Label>
                    <p className="text-[11px] text-muted-foreground mt-0.5">
                      تكتب بالكريمة • +{PRINT_PRICE} ر.س
                    </p>
                  </div>
                  <Switch checked={s.hasText} onCheckedChange={(v) => setS((p) => ({ ...p, hasText: v }))} />
                </div>
                {s.hasText && (
                  <div className="mt-3 space-y-1.5 animate-in fade-in slide-in-from-top-2">
                    <Input
                      value={s.text}
                      onChange={(e) => setS((p) => ({ ...p, text: e.target.value.slice(0, 40) }))}
                      placeholder="مثال: كل عام وأنتي بخير"
                      className="text-base font-loza-display text-center"
                    />
                    <div className="flex justify-between text-[10px] text-muted-foreground">
                      <span>سيظهر النص في المعاينة فوراً</span>
                      <span>{s.text.length}/40</span>
                    </div>
                  </div>
                )}
              </div>

              <div className="bg-card border-2 border-border rounded-2xl p-4 transition-all hover:border-primary/40">
                <div className="flex items-center justify-between gap-3">
                  <div className="flex-1">
                    <Label className="font-bold text-sm">طباعة صورة على الكيكة</Label>
                    <p className="text-[11px] text-muted-foreground mt-0.5">
                      صورة أكلة • +{PRINT_PRICE} ر.س
                    </p>
                  </div>
                  <Switch checked={s.hasPrint} onCheckedChange={(v) => setS((p) => ({ ...p, hasPrint: v }))} />
                </div>
                {s.hasPrint && (
                  <p className="text-xs text-muted-foreground mt-2 bg-muted/40 rounded-lg p-2">
                    📷 سيتواصل معك الشيف عبر واتساب لاستلام الصورة
                  </p>
                )}
              </div>

              <div>
                <Label className="font-bold text-sm">ملاحظات للشيف <span className="text-muted-foreground text-[11px]">(اختياري)</span></Label>
                <Textarea
                  value={s.notes}
                  onChange={(e) => setS((p) => ({ ...p, notes: e.target.value.slice(0, 200) }))}
                  placeholder="أي تفاصيل إضافية، حساسية، تفضيلات..."
                  rows={3}
                  className="mt-2 resize-none"
                />
                <div className="text-[10px] text-muted-foreground text-end mt-1">{s.notes.length}/200</div>
              </div>

              {/* Summary */}
              <div className="rounded-2xl gradient-loza-header text-white p-5 shadow-loza-lift">
                <h4 className="font-bold font-loza-display mb-3 flex items-center gap-2 text-base">
                  <Sparkles className="w-4 h-4" /> ملخص طلبك
                </h4>
                <div className="space-y-2 text-sm">
                  {s.baseId && <Row label="الأساس" value={BASES.find((b) => b.id === s.baseId)?.name || ''} />}
                  {s.flavors.length > 0 && (
                    <Row label="النكهات" value={s.flavors.map((id) => FLAVORS.find((f) => f.id === id)?.name).join(' + ')} />
                  )}
                  {s.colors.length > 0 && (
                    <div className="flex justify-between items-center">
                      <span className="opacity-80">الألوان</span>
                      <div className="flex gap-1">
                        {s.colors.map((c) => (
                          <span key={c} className="w-4 h-4 rounded-full border border-white/40" style={{ background: c }} />
                        ))}
                      </div>
                    </div>
                  )}
                  {s.designId && <Row label="التصميم" value={DESIGNS.find((d) => d.id === s.designId)?.name || ''} />}
                  {s.hasText && s.text && <Row label="الكتابة" value={`"${s.text}"`} />}
                  {s.hasPrint && <Row label="طباعة" value="نعم" />}
                  <div className="flex justify-between font-bold text-lg pt-3 border-t border-white/20 mt-3">
                    <span>الإجمالي</span>
                    <span className="text-[hsl(var(--loza-gold-light))]">{total} ر.س</span>
                  </div>
                </div>
              </div>
            </section>
          )}
        </div>
      </main>

      {/* Sticky bottom bar */}
      <div className="fixed bottom-0 inset-x-0 z-40 bg-card/95 backdrop-blur-md border-t border-border shadow-loza-lift">
        <div className="container mx-auto max-w-3xl px-4 py-3 flex items-center gap-3">
          <Button
            variant="outline"
            onClick={prev}
            disabled={step === 1}
            className="rounded-full border-border hover:bg-muted"
          >
            <ChevronRight className="w-4 h-4 me-1" />
            السابق
          </Button>
          <div className="flex-1 text-center">
            <div className="text-[10px] text-muted-foreground">المجموع</div>
            <div className="font-extrabold text-gradient-loza text-base leading-tight">{total} ر.س</div>
          </div>
          {step < 5 ? (
            <Button
              onClick={next}
              disabled={!canNext}
              className="rounded-full gradient-loza-gold text-[hsl(var(--loza-brown))] border-0 font-bold hover:opacity-90 disabled:opacity-50 px-6"
            >
              التالي
              <ChevronLeft className="w-4 h-4 ms-1" />
            </Button>
          ) : (
            <Button
              onClick={submit}
              className="rounded-full gradient-loza-gold text-[hsl(var(--loza-brown))] border-0 font-bold hover:opacity-90 px-5"
            >
              <ShoppingCart className="w-4 h-4 me-1" />
              أضف للسلة
            </Button>
          )}
        </div>
      </div>
    </LozaShell>
  );
}

function StepHeader({ title, subtitle }: { title: string; subtitle: string }) {
  return (
    <div>
      <h2 className="text-2xl font-bold font-loza-display text-foreground">{title}</h2>
      <p className="text-sm text-muted-foreground mt-1">{subtitle}</p>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between gap-3">
      <span className="opacity-80 shrink-0">{label}</span>
      <span className="font-medium text-end truncate">{value}</span>
    </div>
  );
}
