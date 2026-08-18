import { useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { MainLayout } from '@/components/layout/MainLayout';
import { PageHeader, SectionCard } from '@/components/ds';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { RiyalSymbol } from '@/components/ui/riyal';
import { CustomerLookup, type CustomerLookupStatus } from '@/components/orders/CustomerLookup';
import {
  OccasionStep, GuestCountStep, ServeStylesStep, StationStep, ServersStep, WhenWhereStep,
} from '@/components/events/EventSteps';
import { EventStepper } from '@/components/events/EventStepper';
import { EventReadyCart } from '@/components/events/EventReadyCart';
import { OCCASIONS, SERVE_STYLES } from '@/components/events/eventOptions';
import { useBranches } from '@/hooks/useBranches';
import { useCreateEventOrder, payloadFromState } from '@/hooks/useEventOrder';
import { toast } from '@/hooks/use-toast';
import { planEvent, planSubtotal, type Occasion, type StationType, type EventLineItem } from '@/lib/eventPlanner';
import type { ServeStyle } from '@/lib/eventCatalog';
import {
  ArrowLeft, ArrowRight, PartyPopper, Sparkles, User, CalendarCheck, Check, StickyNote,
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

/* Same wizard as the storefront's /events, with the staff customer lookup in
   front of it — the one thing a customer building their own order doesn't need. */
const STEPS = [
  { key: 'customer', label: 'العميل' },
  { key: 'occasion', label: 'المناسبة' },
  { key: 'guests', label: 'الضيوف' },
  { key: 'serve', label: 'الأصناف' },
  { key: 'station', label: 'الركن' },
  { key: 'servers', label: 'الخدمة' },
  { key: 'when', label: 'الموعد' },
];

/** Sensible serve-style defaults per occasion (staff can change them). */
const STYLE_DEFAULTS: Record<Occasion, ServeStyle[]> = {
  wedding: ['centerpiece_cake', 'assorted_mini'],
  corporate: ['trays', 'chocolate'],
  graduation: ['centerpiece_cake', 'assorted_mini'],
  newborn: ['centerpiece_cake', 'assorted_mini'],
  birthday: ['centerpiece_cake', 'cupcake'],
  family: ['assorted_mini', 'maamoul'],
  other: ['centerpiece_cake'],
};

/**
 * Staff-side ضيافة المناسبات builder — the storefront event package flow made
 * available to the office, so a call that comes in by phone becomes the same
 * order (same planner, same catalogue, same estimate) instead of a free-text
 * custom request.
 */
export default function NewEventOrder() {
  const navigate = useNavigate();
  const { data: branches = [] } = useBranches();
  const createOrder = useCreateEventOrder();

  const [phase, setPhase] = useState<Phase>('wizard');
  const [step, setStep] = useState(0);
  const [cfg, setCfg] = useState<WizardState>(initial);
  const [items, setItems] = useState<EventLineItem[]>([]);
  const [notes, setNotes] = useState('');
  const [tracking, setTracking] = useState<string | null>(null);

  const [customer, setCustomer] = useState({ name: '', phone: '', address: '' });
  const [customerStatus, setCustomerStatus] = useState<CustomerLookupStatus>('idle');

  const minDate = useMemo(() => new Date(Date.now() + 3 * 86_400_000).toISOString().slice(0, 10), []);
  const set = (patch: Partial<WizardState>) => setCfg((c) => ({ ...c, ...patch }));

  // The storefront branch picker takes the public shape; the admin hook returns
  // the full row, so hand it just the three fields the step reads.
  const branchOptions = useMemo(
    () => branches.map((b) => ({ id: b.id, name: b.name, address: b.address ?? null })),
    [branches],
  );

  const pickOccasion = (o: Occasion) =>
    setCfg((c) => ({ ...c, occasion: o, serveStyles: c.serveStyles.length ? c.serveStyles : STYLE_DEFAULTS[o] }));

  /** Per-step gate → the message shown when it isn't met (null = step is done). */
  const blocker = (s: number): string | null => {
    switch (s) {
      case 0:
        if (customerStatus === 'idle') return 'استعلم برقم الجوال ثم اختر العميل المسجّل أو أضِفه كعميل جديد.';
        if (!customer.name.trim()) return 'اسم العميل مطلوب.';
        return null;
      case 1: return cfg.occasion ? null : 'اختر نوع المناسبة.';
      case 2: return cfg.guestCount > 0 ? null : 'حدد عدد الضيوف.';
      case 3: return cfg.serveStyles.length > 0 ? null : 'اختر صنفاً واحداً على الأقل.';
      case 6: return cfg.eventDate && cfg.branchId ? null : 'حدد تاريخ المناسبة والفرع.';
      default: return null;
    }
  };

  const next = () => {
    const message = blocker(step);
    if (message) {
      toast({ title: 'أكمل هذه الخطوة', description: message, variant: 'destructive' });
      return;
    }
    if (step < STEPS.length - 1) {
      setStep((s) => s + 1);
      return;
    }
    setItems(livePlan.items);
    setPhase('cart');
  };

  const back = () => {
    if (phase === 'cart') { setPhase('wizard'); return; }
    if (step > 0) setStep((s) => s - 1);
    else navigate('/orders');
  };

  const setQty = (id: string, qty: number) =>
    setItems((list) => list.map((i) => (i.catalogId === id ? { ...i, qty } : i)));
  const removeItem = (id: string) => setItems((list) => list.filter((i) => i.catalogId !== id));

  const submit = () => {
    const payload = payloadFromState(cfg, items, planSubtotal(items), {
      name: customer.name,
      phone: customer.phone,
      address: customer.address,
      notes,
    });
    createOrder.mutate(payload, {
      onSuccess: ({ trackingCode }) => {
        setTracking(trackingCode);
        setPhase('done');
        toast({
          title: 'تم إنشاء طلب الضيافة',
          description: 'تم إرسال الطلب لفريق المناسبات لتأكيد التفاصيل والسعر النهائي.',
        });
      },
    });
  };

  const startAnother = () => {
    setCfg(initial);
    setItems([]);
    setNotes('');
    setTracking(null);
    setCustomer({ name: '', phone: '', address: '' });
    setCustomerStatus('idle');
    setStep(0);
    setPhase('wizard');
  };

  // Live recommendation drives the running estimate shown while building.
  const livePlan = useMemo(() => planEvent(cfg), [cfg]);
  const liveEstimate = planSubtotal(livePlan.items);
  const showEstimate = cfg.guestCount > 0 && cfg.serveStyles.length > 0;
  const summarySubtotal = phase === 'cart' ? planSubtotal(items) : showEstimate ? liveEstimate : null;

  return (
    <MainLayout>
      <div className="mx-auto max-w-5xl space-y-6">
        <Link to="/orders">
          <Button variant="ghost" size="sm" className="-ms-2 text-muted-foreground hover:text-foreground">
            <ArrowRight className="me-2 h-4 w-4" />
            العودة للطلبات
          </Button>
        </Link>

        <PageHeader
          title="طلب ضيافة مناسبة"
          description="جهّز باقة ضيافة كاملة للعميل — نفس مخطّط المناسبات في المتجر"
          icon={PartyPopper}
        />

        {phase === 'done' ? (
          <SuccessCard tracking={tracking} onAnother={startAnother} onOrders={() => navigate('/orders')} />
        ) : (
          <div className="grid gap-6 lg:grid-cols-[1fr_300px]">
            <div className="min-w-0 space-y-6">
              {phase === 'wizard' && (
                <>
                  <div className="glass-card rounded-2xl px-6 pb-8 pt-6 md:pb-10">
                    <EventStepper steps={STEPS} current={step} onStepClick={setStep} />
                  </div>

                  <SectionCard
                    title={step === 0 ? 'معلومات العميل' : STEPS[step].label}
                    icon={step === 0 ? User : Sparkles}
                    className="animate-fade-in"
                  >
                    {step === 0 && (
                      <CustomerLookup
                        value={customer}
                        onChange={(patch) => setCustomer((c) => ({ ...c, ...patch }))}
                        status={customerStatus}
                        onStatusChange={setCustomerStatus}
                      />
                    )}
                    {step === 1 && <OccasionStep value={cfg.occasion} onChange={pickOccasion} />}
                    {step === 2 && <GuestCountStep value={cfg.guestCount} onChange={(n) => set({ guestCount: n })} />}
                    {step === 3 && <ServeStylesStep value={cfg.serveStyles} onChange={(s) => set({ serveStyles: s })} />}
                    {step === 4 && <StationStep stationType={cfg.stationType} liveStationId={cfg.liveStationId} onChange={set} />}
                    {step === 5 && (
                      <ServersStep
                        guests={cfg.guestCount}
                        serversNeeded={cfg.serversNeeded}
                        serversCount={cfg.serversCount}
                        serviceHours={cfg.serviceHours}
                        onChange={set}
                      />
                    )}
                    {step === 6 && (
                      <WhenWhereStep
                        eventDate={cfg.eventDate}
                        branchId={cfg.branchId}
                        fulfillmentMode={cfg.fulfillmentMode}
                        branches={branchOptions}
                        minDate={minDate}
                        onChange={set}
                      />
                    )}
                  </SectionCard>

                  <div className="flex items-center justify-between gap-4">
                    <Button type="button" variant="outline" onClick={back}>
                      <ArrowRight className="me-2 h-4 w-4" />
                      {step === 0 ? 'إلغاء' : 'السابق'}
                    </Button>
                    <Button type="button" onClick={next} className="min-w-[150px]">
                      {step === STEPS.length - 1 ? (
                        <>
                          الضيافة المقترحة
                          <Sparkles className="ms-2 h-4 w-4" />
                        </>
                      ) : (
                        <>
                          التالي
                          <ArrowLeft className="ms-2 h-4 w-4" />
                        </>
                      )}
                    </Button>
                  </div>
                </>
              )}

              {phase === 'cart' && (
                <>
                  <SectionCard title="ملاحظات الطلب" icon={StickyNote}>
                    <Textarea
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                      placeholder="تفاصيل يذكرها العميل: موقع القاعة، وقت التجهيز، حساسية من المكسرات…"
                      className="min-h-[90px]"
                      maxLength={1000}
                    />
                  </SectionCard>

                  <div className="glass-card rounded-2xl p-6">
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
                  </div>
                </>
              )}
            </div>

            <aside className="lg:block">
              <OrderSummary
                cfg={cfg}
                customer={customer}
                branchName={branches.find((b) => b.id === cfg.branchId)?.name}
                subtotal={summarySubtotal}
                live={phase !== 'cart'}
              />
            </aside>
          </div>
        )}
      </div>
    </MainLayout>
  );
}

function Row({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex items-start justify-between gap-3 border-t border-border/60 py-2.5 first:border-t-0">
      <span className="text-xs text-muted-foreground">{label}</span>
      <span className="text-end text-[13px] font-semibold">{value}</span>
    </div>
  );
}

function OrderSummary({
  cfg,
  customer,
  branchName,
  subtotal,
  live,
}: {
  cfg: WizardState;
  customer: { name: string; phone: string };
  branchName?: string;
  subtotal: number | null;
  live?: boolean;
}) {
  const occ = OCCASIONS.find((o) => o.id === cfg.occasion);
  const styles = cfg.serveStyles.map((s) => SERVE_STYLES.find((x) => x.id === s)?.label).filter(Boolean);
  const stationLabel =
    cfg.stationType === 'none' ? null : cfg.stationType === 'ready_corner' ? 'ركن حلا جاهز' : 'محطة حية';
  const any = customer.name || occ || cfg.guestCount > 0 || styles.length > 0;

  return (
    <div className="glass-card sticky top-24 rounded-2xl p-5">
      <div className="inline-flex items-center gap-2 text-xs font-medium uppercase tracking-widest text-primary">
        <CalendarCheck className="h-3.5 w-3.5" /> ملخّص الطلب
      </div>
      {!any ? (
        <p className="mt-4 text-sm leading-relaxed text-muted-foreground">
          يظهر هنا ملخّص الطلب خطوة بخطوة أثناء تجهيز الضيافة.
        </p>
      ) : (
        <div className="mt-3">
          {customer.name && <Row label="العميل" value={customer.name} />}
          {customer.phone && <Row label="الجوال" value={<bdi dir="ltr">{customer.phone}</bdi>} />}
          {occ && (
            <Row
              label="المناسبة"
              value={
                <span className="inline-flex items-center gap-1.5">
                  <occ.icon className="h-3.5 w-3.5 text-primary" /> {occ.label}
                </span>
              }
            />
          )}
          {cfg.guestCount > 0 && <Row label="عدد الضيوف" value={<span><bdi dir="ltr">{cfg.guestCount}</bdi> ضيف</span>} />}
          {styles.length > 0 && <Row label="الأصناف" value={<span className="leading-relaxed">{styles.join(' · ')}</span>} />}
          {stationLabel && <Row label="ركن الضيافة" value={stationLabel} />}
          {cfg.serversNeeded && (
            <Row
              label="الخدمة"
              value={<span><bdi dir="ltr">{cfg.serversCount || '—'}</bdi> مقدّم · <bdi dir="ltr">{cfg.serviceHours}</bdi> ساعات</span>}
            />
          )}
          {cfg.eventDate && <Row label="التاريخ" value={<bdi dir="ltr">{cfg.eventDate}</bdi>} />}
          {branchName && <Row label="الفرع" value={branchName} />}
          {subtotal !== null && (
            <div className="mt-3 flex items-end justify-between border-t border-border pt-3">
              <span className="text-xs text-muted-foreground">{live ? 'تقديري مبدئي' : 'تقديري'}</span>
              <span className="font-display text-2xl text-primary">
                <bdi dir="ltr">{subtotal}</bdi> <RiyalSymbol className="text-xs text-muted-foreground" />
              </span>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function SuccessCard({
  tracking,
  onAnother,
  onOrders,
}: {
  tracking: string | null;
  onAnother: () => void;
  onOrders: () => void;
}) {
  return (
    <div className="glass-card rounded-2xl p-10 text-center">
      <div className="gradient-pink mx-auto mb-6 grid size-20 place-items-center rounded-full text-primary-foreground shadow-warm">
        <Check className="h-10 w-10" />
      </div>
      <h2 className="text-2xl font-semibold">تم إنشاء طلب الضيافة</h2>
      <p className="mx-auto mt-3 max-w-md leading-relaxed text-muted-foreground">
        وصل الطلب لفريق المناسبات — يراجع التفاصيل ويؤكّد السعر النهائي مع العميل.
      </p>
      {tracking && (
        <div className="mt-5 inline-flex items-center gap-2 rounded-full border border-border bg-card px-5 py-2.5">
          <span className="text-xs text-muted-foreground">رقم المتابعة</span>
          <span className="font-display text-lg text-primary"><bdi dir="ltr">{tracking}</bdi></span>
        </div>
      )}
      <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
        <Button onClick={onAnother}>
          <PartyPopper className="me-2 h-4 w-4" />
          طلب ضيافة آخر
        </Button>
        <Button variant="outline" onClick={onOrders}>
          عرض الطلبات
        </Button>
      </div>
    </div>
  );
}
