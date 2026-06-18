import { Trash2, Send, Info, Sparkles, ArrowRight } from 'lucide-react';
import { Stepper } from './EventSteps';
import { lineTotal, planSubtotal, type EventLineItem } from '@/lib/eventPlanner';

interface Props {
  guestCount: number;
  items: EventLineItem[];
  notes: string[];
  onQty: (catalogId: string, qty: number) => void;
  onRemove: (catalogId: string) => void;
  onSubmit: () => void;
  onBack: () => void;
  submitting: boolean;
}

export function EventReadyCart({ guestCount, items, notes, onQty, onRemove, onSubmit, onBack, submitting }: Props) {
  const subtotal = planSubtotal(items);

  return (
    <div>
      <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-primary/10 text-primary text-xs tracking-widest uppercase font-medium">
        <Sparkles className="w-3.5 h-3.5" /> ضيافة مقترحة
      </div>
      <h2 className="font-display text-2xl md:text-3xl mt-3 leading-tight">
        جهّزنا لكِ ضيافة مقترحة لـ <bdi dir="ltr">{guestCount}</bdi> ضيف
      </h2>
      <p className="text-sm text-muted-foreground mt-2">تقدرين تعدّلين الكميات أو تحذفين أي صنف قبل الإرسال.</p>

      {/* Line items */}
      <div className="mt-6 space-y-2.5">
        {items.length === 0 && (
          <div className="text-center py-12 rounded-2xl border border-dashed border-border/70 bg-secondary/30">
            <p className="text-sm text-muted-foreground">حذفتِ كل الأصناف — ارجعي وعدّلي اختياراتك.</p>
          </div>
        )}
        {items.map((it) => (
          <div key={it.catalogId} className="flex items-center gap-3 rounded-2xl border border-border bg-card p-3">
            <div className="w-12 h-12 rounded-xl grid place-items-center text-2xl shrink-0 bg-gradient-to-br from-blush to-card border border-border/40" aria-hidden>{it.emoji}</div>
            <div className="min-w-0 flex-1">
              <div className="font-bold text-sm leading-tight">{it.name}</div>
              <div className="text-[11px] text-muted-foreground mt-0.5 flex flex-wrap items-center gap-x-2 gap-y-0.5">
                {it.servesHint && <span>{it.servesHint}</span>}
                {it.meta && <><span className="w-1 h-1 rounded-full bg-muted-foreground/40" /><span>{it.meta}</span></>}
              </div>
              <div className="text-[11px] text-primary font-semibold mt-1">
                <bdi dir="ltr">{lineTotal(it)}</bdi> ر.س
              </div>
            </div>
            <Stepper value={it.qty} min={1} max={99} onChange={(n) => onQty(it.catalogId, n)} />
            <button
              onClick={() => onRemove(it.catalogId)}
              aria-label={`حذف ${it.name}`}
              className="press w-9 h-9 rounded-full grid place-items-center text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors shrink-0"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        ))}
      </div>

      {notes.length > 0 && (
        <div className="mt-4 space-y-2">
          {notes.map((n, i) => (
            <div key={i} className="flex items-start gap-2 text-[12.5px] text-muted-foreground rounded-xl bg-secondary/40 px-3 py-2.5">
              <Info className="w-4 h-4 text-primary shrink-0 mt-0.5" /> <span>{n}</span>
            </div>
          ))}
        </div>
      )}

      {/* Estimate */}
      <div className="mt-6 rounded-2xl border border-border bg-card p-5">
        <div className="flex items-end justify-between">
          <div className="text-sm font-semibold">الإجمالي التقديري</div>
          <div className="font-display text-3xl text-primary leading-none">
            <bdi dir="ltr">{subtotal}</bdi> <span className="text-sm text-muted-foreground">ر.س</span>
          </div>
        </div>
        <div className="flex items-start gap-2 text-[12px] text-muted-foreground mt-3 border-t border-border/60 pt-3">
          <Info className="w-4 h-4 text-primary shrink-0 mt-0.5" />
          <span>هذي أسعار تقديرية. فريق المناسبات بيأكّد التفاصيل والسعر النهائي خلال ٢٤ ساعة.</span>
        </div>
      </div>

      {/* Actions */}
      <div className="mt-6 flex flex-col-reverse sm:flex-row items-stretch sm:items-center gap-3">
        <button
          onClick={onBack}
          className="press rounded-full h-[52px] px-6 border border-border bg-card font-semibold hover:border-primary/50 transition-colors flex items-center justify-center gap-2"
        >
          <ArrowRight className="w-4 h-4" /> تعديل الخيارات
        </button>
        <button
          onClick={onSubmit}
          disabled={submitting || items.length === 0}
          className="press sheen flex-1 rounded-full h-[52px] px-6 bg-foreground text-background font-semibold shadow-rose-glow hover:bg-foreground/90 transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
        >
          <Send className="w-5 h-5" /> {submitting ? 'جارٍ الإرسال…' : 'أرسلي الطلب لفريق المناسبات'}
        </button>
      </div>
    </div>
  );
}
