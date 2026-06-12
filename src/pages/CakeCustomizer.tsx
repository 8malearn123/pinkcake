import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { toast } from '@/hooks/use-toast';
import {
  ChevronLeft,
  ChevronRight,
  Cake,
  Check,
  Palette,
  Sparkles,
  Type,
  Layers,
  ShoppingCart,
  ArrowRight,
  Receipt,
  Droplet,
  PenLine,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import CakeBase3DIcon from '@/components/cake/CakeBase3DIcon';
import OrderSummaryCanvas from '@/components/cake/OrderSummaryCanvas';

const FLAVOR_TONES: Record<string, string> = {
  vanilla: '#F5E6C4',
  chocolate: '#5D3A1F',
  'red-velvet': '#B33A3A',
  lotus: '#C9874A',
  pistachio: '#A8C97A',
  saffron: '#E8B23A',
  mango: '#F2B541',
  strawberry: '#E78AA0',
};

const BASES = [
  { id: 'classic', name: 'كيكة كلاسيكية', price: 85, hint: '6 أشخاص' },
  { id: 'tier-2', name: 'كيكة طابقين', price: 180, hint: '10 أشخاص' },
  { id: 'tier-3', name: 'ثلاث طوابق', price: 320, hint: '18 شخص' },
  { id: 'cupcakes', name: 'كاب كيك', price: 95, hint: '12 قطعة' },
  { id: 'number', name: 'شكل رقم', price: 145, hint: 'مناسبات' },
  { id: 'blank', name: 'ابدأ من الصفر', price: 0, hint: 'تخصيص كامل' },
];

const FLAVORS = [
  { id: 'vanilla', name: 'فانيلا', price: 0 },
  { id: 'chocolate', name: 'شوكولاتة', price: 10 },
  { id: 'red-velvet', name: 'ريد فيلفت', price: 15 },
  { id: 'lotus', name: 'لوتس', price: 20 },
  { id: 'pistachio', name: 'فستق', price: 25 },
  { id: 'saffron', name: 'زعفران', price: 25 },
  { id: 'mango', name: 'مانجو', price: 15 },
  { id: 'strawberry', name: 'فراولة', price: 10 },
];

const COLORS = [
  '#FCE4EC', '#F8BBD0', '#F48FB1', '#F06292',
  '#EC407A', '#D81B60', '#AD1457', '#880E4F',
  '#FFFFFF', '#FFF9C4', '#FFE082', '#FFB74D',
  '#A5D6A7', '#81C784', '#90CAF9', '#64B5F6',
  '#B39DDB', '#9575CD',
];

const DESIGNS = [
  { id: 'minimal', name: 'بسيط', price: 0 },
  { id: 'roses', name: 'ورود', price: 30 },
  { id: 'geometric', name: 'هندسي', price: 20 },
  { id: 'cartoon', name: 'كرتون', price: 40 },
  { id: 'luxury', name: 'فاخر بالذهب', price: 60 },
  { id: 'floral', name: 'زهور طبيعية', price: 45 },
];

const STEPS = [
  { id: 1, title: 'الشكل', icon: Cake },
  { id: 2, title: 'النكهة', icon: Sparkles },
  { id: 3, title: 'اللون', icon: Palette },
  { id: 4, title: 'التصميم', icon: Layers },
  { id: 5, title: 'الكتابة', icon: Type },
];

interface CustomizationState {
  baseId: string | null;
  flavorIds: string[];
  colors: string[];
  designId: string | null;
  hasText: boolean;
  text: string;
  notes: string;
}

const PRINT_PRICE = 15;

// ── Reusable design tokens ──────────────────────────────────────────────
const CARD_BASE =
  'group relative rounded-2xl border bg-card text-start transition-all duration-200 ' +
  'hover:border-primary/40 hover:shadow-[0_8px_24px_-12px_rgba(190,123,124,0.25)]';
const CARD_SELECTED =
  'border-primary ring-2 ring-primary/20 shadow-[0_8px_24px_-12px_rgba(190,123,124,0.4)] bg-primary/[0.03]';
const CARD_IDLE = 'border-border/60';

const SelectedTick = () => (
  <div className="absolute top-3 end-3 w-6 h-6 rounded-full bg-primary flex items-center justify-center shadow-sm z-10">
    <Check className="w-3.5 h-3.5 text-primary-foreground" strokeWidth={3} />
  </div>
);

export default function CakeCustomizer() {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [state, setState] = useState<CustomizationState>({
    baseId: null,
    flavorIds: [],
    colors: [],
    designId: null,
    hasText: false,
    text: '',
    notes: '',
  });

  const totalPrice = useMemo(() => {
    let price = 0;
    const base = BASES.find((b) => b.id === state.baseId);
    if (base) price += base.price;
    state.flavorIds.forEach((id) => {
      const f = FLAVORS.find((x) => x.id === id);
      if (f) price += f.price;
    });
    const design = DESIGNS.find((d) => d.id === state.designId);
    if (design) price += design.price;
    if (state.hasText && state.text.trim()) price += PRINT_PRICE;
    return price;
  }, [state]);

  const canProceed = useMemo(() => {
    switch (step) {
      case 1: return !!state.baseId;
      case 2: return state.flavorIds.length > 0;
      case 3: return state.colors.length > 0;
      case 4: return !!state.designId;
      case 5: return true;
      default: return false;
    }
  }, [step, state]);

  const next = () => {
    if (!canProceed) {
      toast({ title: 'الرجاء الإكمال', description: 'اختر خياراً للمتابعة', variant: 'destructive' });
      return;
    }
    if (step < 5) setStep(step + 1);
  };
  const prev = () => { if (step > 1) setStep(step - 1); };

  const handleSubmit = () => {
    toast({
      title: 'تم تجهيز كيكتك',
      description: `سيتم التواصل معك لتأكيد الطلب — السعر التقديري ${totalPrice} ر.س`,
    });
    setTimeout(() => navigate('/'), 1500);
  };

  const toggleFlavor = (id: string) =>
    setState((s) => ({
      ...s,
      flavorIds: s.flavorIds.includes(id) ? s.flavorIds.filter((x) => x !== id) : [...s.flavorIds, id],
    }));

  const toggleColor = (color: string) =>
    setState((s) => {
      if (s.colors.includes(color)) return { ...s, colors: s.colors.filter((c) => c !== color) };
      if (s.colors.length >= 3) {
        toast({ title: 'الحد الأقصى 3 ألوان', variant: 'destructive' });
        return s;
      }
      return { ...s, colors: [...s.colors, color] };
    });

  return (
    <div dir="rtl" className="min-h-screen bg-[hsl(var(--background))]">
      {/* ── Header ─────────────────────────────────────────────────────── */}
      <header className="sticky top-0 z-40 bg-background/85 backdrop-blur-xl border-b border-border/50">
        <div className="container mx-auto px-5 py-3.5 flex items-center justify-between gap-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate('/')}
            className="gap-1.5 rounded-full text-muted-foreground hover:text-foreground"
          >
            <ArrowRight className="w-4 h-4" />
            <span className="hidden sm:inline">رجوع</span>
          </Button>

          <div className="flex flex-col items-center">
            <h1 className="font-display text-base sm:text-lg font-bold tracking-tight">صمم كيكتك</h1>
            <span className="text-[10px] text-muted-foreground mt-0.5">
              الخطوة {step} من {STEPS.length}
            </span>
          </div>

          <div className="text-end min-w-[72px]">
            <div className="text-[10px] text-muted-foreground uppercase tracking-wider">الإجمالي</div>
            <div className="text-lg font-bold text-primary leading-tight">
              {totalPrice}<span className="text-xs font-medium text-muted-foreground ms-1">ر.س</span>
            </div>
          </div>
        </div>

        {/* Refined stepper */}
        <div className="container mx-auto px-5 pb-4">
          <div className="flex items-center justify-between gap-1.5">
            {STEPS.map((s, idx) => {
              const isActive = s.id === step;
              const isDone = s.id < step;
              return (
                <div key={s.id} className="flex items-center flex-1">
                  <button
                    onClick={() => s.id < step && setStep(s.id)}
                    disabled={s.id > step}
                    aria-label={s.title}
                    className={cn(
                      'flex flex-col items-center gap-1.5 transition-all p-1.5 -m-1.5',
                      s.id <= step ? 'cursor-pointer' : 'cursor-not-allowed'
                    )}
                  >
                    <div
                      className={cn(
                        'w-8 h-8 rounded-full flex items-center justify-center text-[11px] font-bold transition-all border',
                        isActive && 'bg-primary text-primary-foreground border-primary scale-110 shadow-[0_4px_12px_-2px_rgba(190,123,124,0.5)]',
                        isDone && 'bg-primary/10 text-primary border-primary/30',
                        !isActive && !isDone && 'bg-muted/40 text-muted-foreground border-transparent'
                      )}
                    >
                      {isDone ? <Check className="w-3.5 h-3.5" strokeWidth={3} /> : s.id}
                    </div>
                    <span
                      className={cn(
                        'text-[10px] sm:text-xs whitespace-nowrap transition-colors hidden sm:block',
                        isActive ? 'font-bold text-foreground' : 'text-muted-foreground'
                      )}
                    >
                      {s.title}
                    </span>
                  </button>
                  {idx < STEPS.length - 1 && (
                    <div
                      className={cn(
                        'flex-1 h-px mx-1.5 transition-colors',
                        s.id < step ? 'bg-primary/40' : 'bg-border'
                      )}
                    />
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </header>

      {/* ── Main ────────────────────────────────────────────────────────── */}
      <main className="container mx-auto px-5 py-6 pb-32">
        <div className="grid lg:grid-cols-5 gap-6">
          {/* ── Order Summary Canvas ────────────────────────────────── */}
          <aside className="lg:col-span-2 lg:sticky lg:top-[148px] h-fit">
            <OrderSummaryCanvas
              state={state}
              totalPrice={totalPrice}
              baseName={BASES.find((b) => b.id === state.baseId)?.name}
              flavorNames={state.flavorIds
                .map((id) => FLAVORS.find((f) => f.id === id)?.name)
                .filter(Boolean) as string[]}
              designName={DESIGNS.find((d) => d.id === state.designId)?.name}
            />
          </aside>

          {/* ── Step Content ───────────────────────────────────────── */}
          <section className="lg:col-span-3 animate-fade-in" key={step}>
            {/* Step header */}
            <div className="mb-6">
              <div className="text-[11px] font-medium uppercase tracking-[0.18em] text-primary mb-2">
                الخطوة {step}
              </div>
              <h2 className="font-display text-2xl sm:text-3xl font-bold tracking-tight">
                {step === 1 && 'اختر شكل كيكتك'}
                {step === 2 && 'اختر النكهات'}
                {step === 3 && 'اختر الألوان'}
                {step === 4 && 'اختر التصميم'}
                {step === 5 && 'الكتابة والملاحظات'}
              </h2>
              <p className="text-muted-foreground text-sm mt-1.5">
                {step === 1 && 'ابدأ بالقاعدة المناسبة لمناسبتك'}
                {step === 2 && 'يمكنك اختيار أكثر من نكهة معاً'}
                {step === 3 && `حتى 3 ألوان — ${state.colors.length}/3`}
                {step === 4 && 'اختر النمط الفني للكيكة'}
                {step === 5 && 'أضف لمستك الأخيرة'}
              </p>
            </div>

            {/* Step 1: Base */}
            {step === 1 && (
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 sm:gap-4">
                {BASES.map((base) => {
                  const selected = state.baseId === base.id;
                  return (
                    <button
                      key={base.id}
                      onClick={() => setState((s) => ({ ...s, baseId: base.id }))}
                      className={cn(CARD_BASE, selected ? CARD_SELECTED : CARD_IDLE, 'p-4')}
                    >
                      {selected && <SelectedTick />}
                      <div className="aspect-square rounded-xl bg-gradient-to-br from-[hsl(var(--blush))]/30 to-secondary/20 mb-3 flex items-center justify-center overflow-hidden">
                        <CakeBase3DIcon id={base.id} className="w-full h-full p-2" />
                      </div>
                      <div className="space-y-0.5">
                        <div className="font-bold text-sm leading-tight">{base.name}</div>
                        <div className="text-xs font-medium text-foreground/70">{base.hint}</div>
                      </div>
                      <div className="mt-2 text-xs font-semibold text-muted-foreground">
                        {base.price > 0 ? (
                          <>
                            من <span className="text-foreground">{base.price}</span> ر.س
                          </>
                        ) : (
                          'مجاناً'
                        )}
                      </div>
                    </button>
                  );
                })}
              </div>
            )}

            {/* Step 2: Flavor */}
            {step === 2 && (
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {FLAVORS.map((flavor) => {
                  const selected = state.flavorIds.includes(flavor.id);
                  const tone = FLAVOR_TONES[flavor.id] || '#E8C9A0';
                  return (
                    <button
                      key={flavor.id}
                      onClick={() => toggleFlavor(flavor.id)}
                      className={cn(CARD_BASE, selected ? CARD_SELECTED : CARD_IDLE, 'p-4 flex items-center gap-3')}
                    >
                      {selected && <SelectedTick />}
                      <div
                        className="w-11 h-11 rounded-full shrink-0 border border-border/60 shadow-inner"
                        style={{ background: `radial-gradient(circle at 35% 30%, #fff, ${tone})` }}
                      />
                      <div className="flex-1">
                        <div className="font-bold text-sm">{flavor.name}</div>
                        <div className="text-[11px] text-muted-foreground mt-0.5">
                          {flavor.price > 0 ? `+ ${flavor.price} ر.س` : 'مجاناً'}
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            )}

            {/* Step 3: Color */}
            {step === 3 && (
              <div className="rounded-2xl border border-border/60 bg-card p-5 sm:p-6">
                <div className="grid grid-cols-6 gap-3 sm:gap-4">
                  {COLORS.map((color) => {
                    const selected = state.colors.includes(color);
                    return (
                      <button
                        key={color}
                        onClick={() => toggleColor(color)}
                        className={cn(
                          'aspect-square rounded-full relative transition-all duration-200',
                          'hover:scale-105',
                          selected
                            ? 'ring-2 ring-primary ring-offset-2 ring-offset-background scale-105'
                            : 'ring-1 ring-border/60'
                        )}
                        style={{ backgroundColor: color }}
                        aria-label={color}
                      >
                        {selected && (
                          <div className="absolute inset-0 flex items-center justify-center">
                            <Check
                              className="w-5 h-5 drop-shadow-md"
                              style={{ color: color === '#FFFFFF' ? '#000' : '#fff' }}
                              strokeWidth={3}
                            />
                          </div>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Step 4: Design */}
            {step === 4 && (
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 sm:gap-4">
                {DESIGNS.map((design) => {
                  const selected = state.designId === design.id;
                  return (
                    <button
                      key={design.id}
                      onClick={() => setState((s) => ({ ...s, designId: design.id }))}
                      className={cn(CARD_BASE, selected ? CARD_SELECTED : CARD_IDLE, 'p-4')}
                    >
                      {selected && <SelectedTick />}
                      <div className="aspect-square rounded-xl bg-gradient-to-br from-[hsl(var(--blush))]/30 to-secondary/20 mb-3 flex items-center justify-center">
                        <CakeBase3DIcon id="classic" className="w-3/4 h-3/4" />
                      </div>
                      <div className="font-bold text-sm">{design.name}</div>
                      <div className="text-[11px] text-muted-foreground mt-0.5 font-medium">
                        {design.price > 0 ? `+ ${design.price} ر.س` : 'مجاناً'}
                      </div>
                    </button>
                  );
                })}
              </div>
            )}

            {/* Step 5: Text */}
            {step === 5 && (
              <div className="space-y-4">
                <div className="rounded-2xl border border-border/60 bg-card p-5 flex items-center justify-between gap-4">
                  <div className="space-y-0.5">
                    <Label className="text-base font-bold">كتابة على الكيكة</Label>
                    <p className="text-xs text-muted-foreground">+ {PRINT_PRICE} ر.س للطباعة</p>
                  </div>
                  <Switch
                    checked={state.hasText}
                    onCheckedChange={(v) => setState((s) => ({ ...s, hasText: v }))}
                  />
                </div>

                {state.hasText && (
                  <div className="rounded-2xl border border-border/60 bg-card p-5 space-y-2 animate-fade-in">
                    <Label className="text-sm font-semibold">النص المطبوع</Label>
                    <Input
                      value={state.text}
                      onChange={(e) => setState((s) => ({ ...s, text: e.target.value.slice(0, 40) }))}
                      placeholder="مثال: كل سنة وأنتِ طيبة"
                      className="text-base rounded-xl border-border/70 h-12"
                    />
                    <div className="text-[11px] text-muted-foreground text-end">{state.text.length}/40</div>
                  </div>
                )}

                <div className="rounded-2xl border border-border/60 bg-card p-5 space-y-2">
                  <Label className="text-sm font-semibold">ملاحظات للشيف <span className="font-normal text-muted-foreground">(اختياري)</span></Label>
                  <Textarea
                    value={state.notes}
                    onChange={(e) => setState((s) => ({ ...s, notes: e.target.value.slice(0, 200) }))}
                    placeholder="أي تفاصيل إضافية تريدنا أن نعرفها..."
                    rows={4}
                    className="rounded-xl border-border/70 resize-none"
                  />
                  <div className="text-[11px] text-muted-foreground text-end">{state.notes.length}/200</div>
                </div>
              </div>
            )}
          </section>
        </div>
      </main>

      {/* ── Sticky bottom navigation ──────────────────────────────────── */}
      <div className="fixed bottom-0 end-0 start-0 z-40 bg-background/90 backdrop-blur-xl border-t border-border/60">
        <div className="container mx-auto px-5 py-3 flex items-center justify-between gap-3">
          <Button
            variant="outline"
            onClick={prev}
            disabled={step === 1}
            className="gap-1.5 rounded-full h-12 px-5 border-border/70 font-semibold disabled:opacity-40"
          >
            <ChevronRight className="w-4 h-4" />
            السابق
          </Button>

          <div className="hidden sm:flex flex-col items-center text-center">
            <div className="text-[10px] text-muted-foreground uppercase tracking-wider">السعر التقديري</div>
            <div className="text-base font-bold text-primary">{totalPrice} ر.س</div>
          </div>

          {step < 5 ? (
            <Button
              onClick={next}
              disabled={!canProceed}
              className="gap-1.5 rounded-full h-12 px-7 font-semibold bg-primary text-primary-foreground hover:bg-primary/90 shadow-[0_8px_24px_-8px_rgba(190,123,124,0.6)] disabled:opacity-40 disabled:shadow-none"
            >
              التالي
              <ChevronLeft className="w-4 h-4" />
            </Button>
          ) : (
            <Button
              onClick={handleSubmit}
              className="gap-2 rounded-full h-12 px-7 font-semibold bg-primary text-primary-foreground hover:bg-primary/90 shadow-[0_8px_24px_-8px_rgba(190,123,124,0.6)]"
            >
              <ShoppingCart className="w-4 h-4" />
              إرسال الطلب
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
