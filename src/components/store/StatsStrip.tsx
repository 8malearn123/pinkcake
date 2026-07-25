import { Users, Star, ShieldCheck, Truck } from 'lucide-react';
import { RiyalSymbol } from '@/components/ui/riyal';
import { cn } from '@/lib/utils';

/**
 * A quiet trust row. Every figure is real: the rating is the live store-wide
 * average (passed from Store, review-count weighted) shown ONLY when there are
 * reviews; the customer cell is a qualitative claim (no fabricated count); the
 * delivery cell states the real 200-﷼ free-delivery rule.
 */
export function StatsStrip({ average = 0 }: { average?: number }) {
  const hasRating = average > 0;
  const stats = [
    { Icon: Users, value: null as string | null, label: 'آلاف العملاء السعداء' },
    hasRating
      ? { Icon: Star, value: `${average} / 5`, label: 'متوسّط التقييم' }
      : { Icon: Star, value: null as string | null, label: 'جودة نثق بها' },
    { Icon: ShieldCheck, value: 'ضمان', label: 'طزاجة كل صباح' },
    { Icon: Truck, value: null as string | null, label: 'توصيل مجاني فوق 200', showRiyal: true },
  ];

  return (
    <section className="rounded-3xl bg-card border border-border/60 shadow-soft-lift">
      <ul className="grid grid-cols-2 md:grid-cols-4">
        {stats.map(({ Icon, value, label, showRiyal }, i) => (
          <li
            key={label}
            className={cn(
              'flex items-center gap-3 p-5 md:p-7',
              i > 0 && 'border-s border-border/60',
              i === 2 && 'border-s-0 md:border-s',
            )}
          >
            <span className="shrink-0 flex h-11 w-11 items-center justify-center rounded-full bg-primary/10 text-primary">
              <Icon className="w-5 h-5" strokeWidth={1.5} />
            </span>
            <div className="min-w-0">
              {value && <div className="font-wedding text-xl md:text-2xl leading-none text-foreground">{value}</div>}
              <div className={cn('text-xs text-muted-foreground', value ? 'mt-1' : 'font-display text-sm text-foreground leading-tight')}>
                {label} {showRiyal && <RiyalSymbol className="text-muted-foreground" />}
              </div>
            </div>
          </li>
        ))}
      </ul>
    </section>
  );
}
