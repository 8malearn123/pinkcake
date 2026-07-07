import { Cake, Sparkles, Droplet, Layers, PenLine, Receipt } from 'lucide-react';
import { cn } from '@/lib/utils';
import { RiyalSymbol } from '@/components/ui/riyal';

interface Props {
  state: {
    baseId: string | null;
    flavorIds: string[];
    colors: string[];
    designId: string | null;
    hasText: boolean;
    text: string;
  };
  totalPrice: number;
  baseName?: string;
  flavorNames: string[];
  designName?: string;
}

// ── Premium minimalist cake mark (line-art, no cartoon) ──────────────
const CakeMark = ({ tint = 'hsl(var(--primary))' }: { tint?: string }) => (
  <svg viewBox="0 0 120 120" className="w-full h-full" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <linearGradient id="cmStroke" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stopColor="hsl(var(--primary))" stopOpacity="1" />
        <stop offset="100%" stopColor="hsl(var(--primary))" stopOpacity="0.75" />
      </linearGradient>
      <radialGradient id="cmGlow" cx="50%" cy="50%" r="50%">
        <stop offset="0%" stopColor={tint} stopOpacity="0.22" />
        <stop offset="100%" stopColor={tint} stopOpacity="0" />
      </radialGradient>
    </defs>

    {/* Soft glow */}
    <circle cx="60" cy="60" r="56" fill="url(#cmGlow)" />

    <g
      fill="none"
      stroke="url(#cmStroke)"
      strokeWidth="2.2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      {/* Plate line */}
      <line x1="18" y1="100" x2="102" y2="100" />

      {/* Bottom tier */}
      <ellipse cx="60" cy="78" rx="34" ry="6" />
      <path d="M26,78 L26,94 A34,6 0 0 0 94,94 L94,78" />

      {/* Top tier */}
      <ellipse cx="60" cy="48" rx="22" ry="5" />
      <path d="M38,48 L38,64 A22,5 0 0 0 82,64 L82,48" />

      {/* Candle */}
      <line x1="60" y1="28" x2="60" y2="44" />
      {/* Flame */}
      <path d="M60,20 C56,24 56,28 60,28 C64,28 64,24 60,20 Z" fill="hsl(var(--primary))" fillOpacity="0.95" stroke="none" />
    </g>
  </svg>
);

const Row = ({
  icon: Icon,
  label,
  value,
  empty,
}: {
  icon: React.ElementType;
  label: string;
  value: React.ReactNode;
  empty?: boolean;
}) => (
  <div className="flex items-center justify-between gap-3 py-3 border-b border-border/40 last:border-0">
    <div className="flex items-center gap-2.5 min-w-0">
      <div className="w-7 h-7 rounded-lg bg-primary/8 flex items-center justify-center shrink-0">
        <Icon className="w-3.5 h-3.5 text-primary" strokeWidth={2} />
      </div>
      <span className="text-xs font-medium text-muted-foreground tracking-wide">{label}</span>
    </div>
    <div
      className={cn(
        'text-sm font-semibold text-end truncate max-w-[60%]',
        empty ? 'text-muted-foreground/60 font-normal italic text-xs' : 'text-foreground'
      )}
    >
      {value}
    </div>
  </div>
);

export default function OrderSummaryCanvas({
  state,
  totalPrice,
  baseName,
  flavorNames,
  designName,
}: Props) {
  const accent = state.colors[0] || '#be7b7c';

  return (
    <div className="rounded-2xl border border-border/60 bg-card overflow-hidden shadow-[0_8px_30px_-12px_rgba(0,0,0,0.08)]">
      {/* ── Header label ──────────────────────────────────────────── */}
      <div className="px-6 pt-6 pb-3 flex items-center justify-between">
        <div>
          <div className="text-[10px] font-semibold uppercase tracking-[0.18em] text-primary">
            Order Summary
          </div>
          <h3 className="font-display text-lg font-bold mt-0.5">لوحة ملخص الطلب</h3>
        </div>
      </div>

      {/* ── Cake hero canvas ──────────────────────────────────────── */}
      <div className="mx-6 mb-5 relative rounded-2xl overflow-hidden aspect-[5/4] bg-gradient-to-br from-[hsl(var(--blush))]/35 via-card to-secondary/25 border border-border/40">
        {/* Soft blurred orbs */}
        <div
          className="absolute -top-10 -start-10 w-40 h-40 rounded-full blur-3xl opacity-50"
          style={{ background: accent }}
        />
        <div
          className="absolute -bottom-10 -end-10 w-32 h-32 rounded-full blur-3xl opacity-30"
          style={{ background: state.colors[1] || accent }}
        />

        {/* Centered minimalist mark */}
        <div className="absolute inset-0 flex items-center justify-center p-8">
          <div className="w-full h-full max-w-[260px] max-h-[260px] relative">
            <CakeMark tint={accent} />
          </div>
        </div>

        {/* Optional engraved text */}
        {state.hasText && state.text.trim() && (
          <div className="absolute bottom-4 inset-x-4 text-center">
            <div className="inline-block px-3 py-1 rounded-full bg-background/70 backdrop-blur-sm border border-border/40">
              <span className="text-xs font-display font-bold text-foreground">
                "{state.text}"
              </span>
            </div>
          </div>
        )}
      </div>

      {/* ── Details list ──────────────────────────────────────────── */}
      <div className="px-6 pb-2">
        <Row
          icon={Cake}
          label="الأساس"
          value={baseName || 'لم يُحدد بعد'}
          empty={!baseName}
        />
        <Row
          icon={Sparkles}
          label="النكهات"
          value={flavorNames.length > 0 ? flavorNames.join('، ') : 'اختر نكهة'}
          empty={flavorNames.length === 0}
        />
        <Row
          icon={Droplet}
          label="الألوان"
          value={
            state.colors.length > 0 ? (
              <div className="flex items-center gap-1.5 justify-end">
                {state.colors.map((c) => (
                  <div
                    key={c}
                    className="w-5 h-5 rounded-full border border-border/60 shadow-sm"
                    style={{ backgroundColor: c }}
                  />
                ))}
              </div>
            ) : (
              'اختر لوناً'
            )
          }
          empty={state.colors.length === 0}
        />
        <Row
          icon={Layers}
          label="التصميم"
          value={designName || 'بدون تصميم'}
          empty={!designName}
        />
        {state.hasText && state.text.trim() && (
          <Row icon={PenLine} label="الكتابة" value={state.text} />
        )}
      </div>

      {/* ── Total ─────────────────────────────────────────────────── */}
      <div className="mx-6 mb-6 mt-2 rounded-xl bg-gradient-to-br from-primary/8 to-primary/4 border border-primary/15 px-5 py-4 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-full bg-primary/15 flex items-center justify-center">
            <Receipt className="w-4 h-4 text-primary" />
          </div>
          <div>
            <div className="text-[10px] uppercase tracking-wider text-muted-foreground font-medium">
              الإجمالي التقديري
            </div>
            <div className="text-[10px] text-muted-foreground">شامل الضريبة</div>
          </div>
        </div>
        <div className="text-2xl font-display font-bold text-primary tabular-nums">
          {totalPrice}
          <RiyalSymbol className="text-xs font-medium text-muted-foreground ms-1" />
        </div>
      </div>
    </div>
  );
}
