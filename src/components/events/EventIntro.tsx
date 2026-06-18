import { PartyPopper, Wand2, SlidersHorizontal, BadgeCheck, ArrowLeft, Clock, Users } from 'lucide-react';
import { OCCASIONS } from './eventOptions';
import type { Occasion } from '@/lib/eventPlanner';

const VALUES = [
  { icon: Wand2, title: 'اقتراح ذكي', desc: 'نحسب لكِ الكميات المناسبة حسب عدد ضيوفك.' },
  { icon: SlidersHorizontal, title: 'تحكّم كامل', desc: 'عدّلي الأصناف والكميات بكل حرية قبل الإرسال.' },
  { icon: BadgeCheck, title: 'تأكيد احترافي', desc: 'فريق المناسبات يراجع التفاصيل ويثبّت السعر النهائي.' },
];

interface Props {
  onStart: () => void;
  onQuickStart: (o: Occasion) => void;
}

export function EventIntro({ onStart, onQuickStart }: Props) {
  return (
    <div className="max-w-3xl mx-auto">
      {/* Hero */}
      <div
        className="relative rounded-[2rem] border border-border/60 shadow-soft-lift overflow-hidden p-8 sm:p-12 text-center"
        style={{ background: 'linear-gradient(135deg, hsl(var(--blush)), hsl(var(--card)))' }}
      >
        <div className="absolute inset-0 noise-overlay opacity-30" />
        <div className="relative z-10">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-primary/10 text-primary text-xs tracking-widest uppercase font-medium">
            <PartyPopper className="w-3.5 h-3.5" /> ضيافة المناسبات والأعراس
          </div>
          <h1 className="font-display text-3xl sm:text-4xl md:text-5xl mt-5 leading-tight">جهّزي ضيافة مناسبتك في دقائق</h1>
          <p className="text-sm sm:text-base text-muted-foreground mt-4 leading-relaxed max-w-xl mx-auto">
            أعراس، فعاليات الشركات، والمناسبات الكبيرة — أجيبي على بضعة أسئلة، ونجهّز لكِ ضيافة متكاملة تعدّلينها كما تحبّين.
          </p>
          <button
            onClick={onStart}
            className="group press sheen mt-7 inline-flex items-center gap-2 rounded-full h-[56px] px-9 bg-foreground text-background font-semibold shadow-rose-glow hover:bg-foreground/90 transition-colors"
          >
            ابدئي تجهيز مناسبتك <ArrowLeft className="cta-arrow w-5 h-5" />
          </button>
          <div className="mt-6 flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-muted-foreground text-xs">
            <span className="inline-flex items-center gap-1.5"><Clock className="w-4 h-4 text-primary" /> أقل من دقيقتين</span>
            <span className="inline-flex items-center gap-1.5"><Users className="w-4 h-4 text-primary" /> من ١٠ إلى ٥٠٠+ ضيف</span>
          </div>
        </div>
      </div>

      {/* Value props */}
      <div className="grid sm:grid-cols-3 gap-3 mt-4">
        {VALUES.map((v) => (
          <div key={v.title} className="rounded-2xl border border-border/60 bg-card p-5 text-center">
            <div className="w-11 h-11 mx-auto rounded-full bg-primary/10 text-primary grid place-items-center mb-3">
              <v.icon className="w-5 h-5" />
            </div>
            <div className="font-bold text-sm">{v.title}</div>
            <div className="text-xs text-muted-foreground mt-1.5 leading-relaxed">{v.desc}</div>
          </div>
        ))}
      </div>

      {/* Quick start by occasion */}
      <div className="mt-8 text-center">
        <div className="text-sm font-bold mb-3">أو ابدئي مباشرة باختيار مناسبتك</div>
        <div className="flex flex-wrap items-center justify-center gap-2.5">
          {OCCASIONS.map((o) => (
            <button
              key={o.id}
              onClick={() => onQuickStart(o.id)}
              className="press inline-flex items-center gap-2 rounded-full border border-border bg-card ps-3 pe-4 h-11 hover:border-primary/50 hover:bg-primary/5 transition-colors font-medium text-sm"
            >
              <span className="text-lg" aria-hidden>{o.emoji}</span>
              {o.label}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
