import { Truck, ShieldCheck, Cake, Clock } from 'lucide-react';

const ITEMS = [
  { icon: Cake, title: 'خبزٌ طازج يومياً', sub: 'دفعات محدودة كل صباح' },
  { icon: Truck, title: 'توصيل سريع', sub: 'لجميع فروعنا في المدينة' },
  { icon: ShieldCheck, title: 'مكونات فاخرة', sub: 'منتقاة بعناية موثوقة' },
  { icon: Clock, title: 'حجز مسبق', sub: 'احجز موعدك بضغطة' },
];

export function PromoStrip() {
  return (
    <section className="rounded-2xl border border-border/60 bg-card/60 backdrop-blur px-4 py-4">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {ITEMS.map(({ icon: Icon, title, sub }) => (
          <div key={title} className="flex items-center gap-3 rounded-xl p-1.5 transition-colors hover:bg-primary/5">
            <div className="w-10 h-10 rounded-full bg-primary/10 text-primary flex items-center justify-center shrink-0">
              <Icon className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <div className="text-sm font-semibold leading-tight">{title}</div>
              <div className="text-xs text-muted-foreground truncate">{sub}</div>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
