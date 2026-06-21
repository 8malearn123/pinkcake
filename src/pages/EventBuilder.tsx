import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSettings } from '@/contexts/SettingsContext';
import { usePublicStoreBranches } from '@/hooks/usePublicStore';
import { useCreateEventOrder, payloadFromState } from '@/hooks/useEventOrder';
import { toast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import {
  planEvent, planSubtotal, type Occasion, type StationType, type EventLineItem,
} from '@/lib/eventPlanner';
import type { ServeStyle } from '@/lib/eventCatalog';
import {
  OccasionStep, GuestCountStep, ServeStylesStep, StationStep, ServersStep, WhenWhereStep,
} from '@/components/events/EventSteps';
import { OCCASIONS, SERVE_STYLES } from '@/components/events/eventOptions';
import { EventReadyCart } from '@/components/events/EventReadyCart';
import { EventStepper } from '@/components/events/EventStepper';
import {
  Cake, ArrowRight, ChevronLeft, ChevronRight, Sparkles, Users, CalendarCheck,
  PartyPopper, Check, Send,
} from 'lucide-react';

type Phase = 'wizard' | 'cart' | 'done';

interface WizardState {
  occasion: Occasion | null;
  guestCount: number;
  serveStyles: ServeStyle[];
  stationType: StationType;
  liveStationId: string | null;
  serversNeeded: boolean;
  serversCount: number;
  serviceHours: number;
  fulfillmentMode: 'delivery' | 'onsite_setup';
  branchId: string | null;
  eventDate: string | null;
}

const initial: WizardState = {
  occasion: null,
  guestCount: 0,
  serveStyles: [],
  stationType: 'none',
  liveStationId: null,
  serversNeeded: false,
  serversCount: 0,
  serviceHours: 3,
  fulfillmentMode: 'delivery',
  branchId: null,
  eventDate: null,
};

const STEPS = [
  { key: 'occasion', label: 'المناسبة' },
  { key: 'guests', label: 'الضيوف' },
  { key: 'serve', label: 'الأصناف' },
  { key: 'station', label: 'الركن' },
  { key: 'servers', label: 'الخدمة' },
  { key: 'when', label: 'الموعد' },
];

// Sensible serve-style defaults per occasion (the customer can change them).
const STYLE_DEFAULTS: Record<Occasion, ServeStyle[]> = {
  wedding: ['centerpiece_cake', 'assorted_mini'],
  corporate: ['trays', 'chocolate'],
  graduation: ['centerpiece_cake', 'assorted_mini'],
  newborn: ['centerpiece_cake', 'assorted_mini'],
  birthday: ['centerpiece_cake', 'cupcake'],
  family: ['assorted_mini', 'maamoul'],
  other: ['centerpiece_cake'],
};

export default function EventBuilder() {
  const navigate = useNavigate();
  const { settings } = useSettings();
  const { data: branches } = usePublicStoreBranches();
  const createOrder = useCreateEventOrder();

  const [phase, setPhase] = useState<Phase>('wizard');
  const [step, setStep] = useState(0);
  const [cfg, setCfg] = useState<WizardState>(initial);
  const [items, setItems] = useState<EventLineItem[]>([]);
  const [tracking, setTracking] = useState<string | null>(null);

  const minDate = useMemo(() => new Date(Date.now() + 3 * 86_400_000).toISOString().slice(0, 10), []);
  const set = (patch: Partial<WizardState>) => setCfg((c) => ({ ...c, ...patch }));

  const pickOccasion = (o: Occasion) =>
    setCfg((c) => ({ ...c, occasion: o, serveStyles: c.serveStyles.length ? c.serveStyles : STYLE_DEFAULTS[o] }));

  const canProceed = (s: number): boolean => {
    switch (s) {
      case 0: return !!cfg.occasion;
      case 1: return cfg.guestCount > 0;
      case 2: return cfg.serveStyles.length > 0;
      case 5: return !!cfg.eventDate && !!cfg.branchId;
      default: return true;
    }
  };

  const next = () => {
    if (!canProceed(step)) {
      toast({ title: 'الرجاء الإكمال', description: 'أكمل هذه الخطوة للمتابعة.', variant: 'destructive' });
      return;
    }
    if (step < STEPS.length - 1) {
      setStep((s) => s + 1);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } else {
      setItems(livePlan.items);
      setPhase('cart');
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const back = () => {
    if (phase === 'cart') { setPhase('wizard'); return; }
    if (step > 0) { setStep((s) => s - 1); window.scrollTo({ top: 0, behavior: 'smooth' }); }
    else navigate('/');
  };

  const setQty = (id: string, qty: number) =>
    setItems((list) => list.map((i) => (i.catalogId === id ? { ...i, qty } : i)));
  const removeItem = (id: string) => setItems((list) => list.filter((i) => i.catalogId !== id));

  const submit = () => {
    const payload = payloadFromState(cfg, items, planSubtotal(items));
    createOrder.mutate(payload, {
      onSuccess: ({ trackingCode }) => {
        setTracking(trackingCode);
        setPhase('done');
        window.scrollTo({ top: 0, behavior: 'smooth' });
        toast({ title: 'تم استلام طلب ضيافتك!', description: 'فريق المناسبات بيتواصل معك قريبًا لتأكيد التفاصيل.' });
      },
    });
  };

  // Live recommendation drives the running estimate shown while building.
  const livePlan = useMemo(() => planEvent(cfg), [cfg]);
  const liveEstimate = planSubtotal(livePlan.items);
  const showEstimate = cfg.guestCount > 0 && cfg.serveStyles.length > 0;
  const summarySubtotal = phase === 'cart' ? planSubtotal(items) : showEstimate ? liveEstimate : null;
  const progress = phase === 'wizard' ? ((step + 1) / STEPS.length) * 100 : 100;

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-background/85 backdrop-blur-xl border-b border-border/60">
        <div className="container mx-auto px-4 lg:px-6 h-16 flex items-center gap-3">
          <button
            onClick={back}
            aria-label="رجوع"
            className="press w-10 h-10 rounded-full border border-border bg-card flex items-center justify-center hover:border-primary/50 hover:bg-primary/5 transition-colors shrink-0"
          >
            <ArrowRight className="w-5 h-5" />
          </button>
          <button onClick={() => navigate('/')} className="flex items-center gap-2.5 press group">
            <div className="w-9 h-9 rounded-xl gradient-pink flex items-center justify-center shadow-rose-glow text-primary-foreground transition-transform duration-500 group-hover:-rotate-6 group-hover:scale-105">
              <Cake className="w-5 h-5" />
            </div>
            <div className="hidden sm:block text-start leading-tight">
              <div className="font-display text-lg">{settings.storeName}</div>
              <div className="text-[10px] text-muted-foreground tracking-widest uppercase">ضيافة المناسبات</div>
            </div>
          </button>
          <div className="ms-auto inline-flex items-center gap-2 text-xs text-primary font-medium">
            <PartyPopper className="w-4 h-4" /> جهّز مناسبتك
          </div>
        </div>
        {/* Progress */}
        <div className="h-1 bg-border/60">
          <div className="h-full gradient-pink transition-[width] duration-500" style={{ width: `${progress}%` }} />
        </div>
      </header>

      <main className="container mx-auto px-4 lg:px-6 py-7 lg:py-10">
        {phase === 'done' && (
          <SuccessView tracking={tracking} onTrack={() => navigate('/track')} onHome={() => navigate('/')} />
        )}

        {(phase === 'wizard' || phase === 'cart') && (
          <div className="grid lg:grid-cols-[1fr_320px] gap-8">
            {/* Main column */}
            <div className="min-w-0">
              {phase === 'wizard' && (
                <>
                  <EventStepper steps={STEPS} current={step} onStepClick={(i) => { setStep(i); window.scrollTo({ top: 0 }); }} />
                  <div className="text-xs text-primary tracking-widest uppercase font-medium mb-2 md:hidden">
                    الخطوة <bdi dir="ltr">{step + 1}</bdi> من <bdi dir="ltr">{STEPS.length}</bdi> — {STEPS[step].label}
                  </div>
                  <div key={step} className="cz-step">
                    {step === 0 && <OccasionStep value={cfg.occasion} onChange={pickOccasion} />}
                    {step === 1 && <GuestCountStep value={cfg.guestCount} onChange={(n) => set({ guestCount: n })} />}
                    {step === 2 && <ServeStylesStep value={cfg.serveStyles} onChange={(s) => set({ serveStyles: s })} />}
                    {step === 3 && <StationStep stationType={cfg.stationType} liveStationId={cfg.liveStationId} onChange={set} />}
                    {step === 4 && <ServersStep guests={cfg.guestCount} serversNeeded={cfg.serversNeeded} serversCount={cfg.serversCount} serviceHours={cfg.serviceHours} onChange={set} />}
                    {step === 5 && <WhenWhereStep eventDate={cfg.eventDate} branchId={cfg.branchId} fulfillmentMode={cfg.fulfillmentMode} branches={branches ?? []} minDate={minDate} onChange={set} />}
                  </div>

                  {/* Desktop nav */}
                  <div className="mt-8 hidden lg:flex items-center gap-3">
                    <button
                      onClick={back}
                      className="press rounded-full h-[52px] px-5 border border-border bg-card font-semibold hover:border-primary/50 transition-colors flex items-center justify-center gap-2"
                    >
                      <ChevronRight className="w-5 h-5" /> {step === 0 ? 'الرئيسية' : 'السابق'}
                    </button>
                    <button
                      onClick={next}
                      className="press sheen flex-1 rounded-full h-[52px] px-6 bg-foreground text-background font-semibold shadow-rose-glow hover:bg-foreground/90 transition-colors flex items-center justify-center gap-2"
                    >
                      {step === STEPS.length - 1 ? <>عرض الضيافة المقترحة <Sparkles className="w-5 h-5" /></> : <>التالي <ChevronLeft className="w-5 h-5" /></>}
                    </button>
                  </div>
                </>
              )}

              {phase === 'cart' && (
                <EventReadyCart
                  guestCount={cfg.guestCount}
                  items={items}
                  notes={livePlan.notes}
                  onQty={setQty}
                  onRemove={removeItem}
                  onSubmit={submit}
                  onBack={() => setPhase('wizard')}
                  submitting={createOrder.isPending}
                />
              )}
            </div>

            {/* Live summary (desktop) */}
            <aside className="hidden lg:block">
              <LiveSummary cfg={cfg} branchName={branches?.find((b) => b.id === cfg.branchId)?.name} subtotal={summarySubtotal} live={phase !== 'cart'} />
            </aside>
          </div>
        )}

        {/* Mobile sticky action bar */}
        {phase === 'wizard' && (
          <div className="lg:hidden sticky bottom-0 z-30 -mx-4 px-4 py-3 mt-4 bg-background/95 backdrop-blur border-t border-border/60 flex items-center gap-3">
            <button
              onClick={back}
              aria-label={step === 0 ? 'الرئيسية' : 'السابق'}
              className="press w-12 h-12 rounded-full border border-border bg-card grid place-items-center hover:border-primary/50 transition-colors shrink-0"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
            {showEstimate && (
              <div className="flex-1 min-w-0 text-center leading-tight">
                <div className="text-[10px] text-muted-foreground">تقديري مبدئي</div>
                <div className="font-display text-lg text-primary"><bdi dir="ltr">{liveEstimate}</bdi> <span className="text-[11px] text-muted-foreground">ر.س</span></div>
              </div>
            )}
            <button
              onClick={next}
              className={cn(
                'press sheen rounded-full h-12 px-6 bg-foreground text-background font-semibold shadow-rose-glow transition-colors flex items-center justify-center gap-2',
                showEstimate ? 'shrink-0' : 'flex-1',
              )}
            >
              {step === STEPS.length - 1 ? <>الضيافة المقترحة <Sparkles className="w-5 h-5" /></> : <>التالي <ChevronLeft className="w-5 h-5" /></>}
            </button>
          </div>
        )}
      </main>
    </div>
  );
}

function Row({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex items-start justify-between gap-3 py-2.5 border-t border-border/60 first:border-t-0">
      <span className="text-xs text-muted-foreground">{label}</span>
      <span className="text-[13px] font-semibold text-end">{value}</span>
    </div>
  );
}

function LiveSummary({ cfg, branchName, subtotal, live }: { cfg: WizardState; branchName?: string; subtotal: number | null; live?: boolean }) {
  const occ = OCCASIONS.find((o) => o.id === cfg.occasion);
  const styles = cfg.serveStyles.map((s) => SERVE_STYLES.find((x) => x.id === s)?.label).filter(Boolean);
  const stationLabel = cfg.stationType === 'none' ? null : cfg.stationType === 'ready_corner' ? 'ركن حلا جاهز' : 'محطة حية';
  const any = occ || cfg.guestCount > 0 || styles.length > 0;

  return (
    <div className="sticky top-24 rounded-2xl border border-border bg-card p-5 shadow-soft-lift">
      <div className="inline-flex items-center gap-2 text-xs text-primary tracking-widest uppercase font-medium">
        <CalendarCheck className="w-3.5 h-3.5" /> ملخّص مناسبتك
      </div>
      {!any ? (
        <p className="text-sm text-muted-foreground mt-4 leading-relaxed">
          راح يظهر هنا ملخّص اختياراتك خطوة بخطوة وأنت تجهّز ضيافتك.
        </p>
      ) : (
        <div className="mt-3">
          {occ && <Row label="المناسبة" value={<span className="inline-flex items-center gap-1.5"><occ.icon className="w-3.5 h-3.5 text-primary" /> {occ.label}</span>} />}
          {cfg.guestCount > 0 && <Row label="عدد الضيوف" value={<span><bdi dir="ltr">{cfg.guestCount}</bdi> ضيف</span>} />}
          {styles.length > 0 && <Row label="الأصناف" value={<span className="leading-relaxed">{styles.join(' · ')}</span>} />}
          {stationLabel && <Row label="ركن الضيافة" value={stationLabel} />}
          {cfg.serversNeeded && <Row label="الخدمة" value={<span><bdi dir="ltr">{cfg.serversCount || '—'}</bdi> مقدّم · <bdi dir="ltr">{cfg.serviceHours}</bdi> ساعات</span>} />}
          {cfg.eventDate && <Row label="التاريخ" value={<bdi dir="ltr">{cfg.eventDate}</bdi>} />}
          {branchName && <Row label="الفرع" value={branchName} />}
          {subtotal !== null && (
            <div className="mt-3 pt-3 border-t border-border flex items-end justify-between">
              <span className="text-xs text-muted-foreground">{live ? 'تقديري مبدئي' : 'تقديري'}</span>
              <span className="font-display text-2xl text-primary"><bdi dir="ltr">{subtotal}</bdi> <span className="text-xs text-muted-foreground">ر.س</span></span>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function SuccessView({ tracking, onTrack, onHome }: { tracking: string | null; onTrack: () => void; onHome: () => void }) {
  return (
    <div className="max-w-lg mx-auto text-center py-10">
      <div className="w-20 h-20 mx-auto rounded-full gradient-pink grid place-items-center text-primary-foreground shadow-rose-glow mb-6">
        <Check className="w-10 h-10" />
      </div>
      <h1 className="font-display text-3xl md:text-4xl leading-tight">تم استلام طلب ضيافتك!</h1>
      <p className="text-muted-foreground mt-3 leading-relaxed max-w-md mx-auto">
        فريق المناسبات بيراجع التفاصيل ويتواصل معك قريبًا لتأكيد الضيافة والسعر النهائي.
      </p>
      {tracking && (
        <div className="mt-5 inline-flex items-center gap-2 rounded-full border border-border bg-card px-5 py-2.5">
          <span className="text-xs text-muted-foreground">رقم المتابعة</span>
          <span className="font-display text-lg text-primary"><bdi dir="ltr">{tracking}</bdi></span>
        </div>
      )}
      <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
        <button onClick={onTrack} className="press rounded-full h-[52px] px-7 bg-foreground text-background font-semibold hover:bg-foreground/90 transition-colors flex items-center gap-2">
          <Send className="w-4 h-4" /> تتبّع الطلب
        </button>
        <button onClick={onHome} className="press rounded-full h-[52px] px-7 border border-border bg-card font-semibold hover:border-primary/50 transition-colors">
          العودة للرئيسية
        </button>
      </div>
    </div>
  );
}
