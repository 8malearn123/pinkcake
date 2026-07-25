import { Sparkles, ChefHat, Crown, Truck } from 'lucide-react';

// A floating white "credentials" card that overlaps the bottom of the hero
// (inspired by luxury-boutique feature strips). Each column: a rose line-icon in
// a soft rose disc, a bold title, and a short muted description. Tokens only.
const CREDENTIALS = [
  { Icon: Sparkles, title: 'مكوّنات فاخرة', desc: 'نختار أجود المكوّنات الطازجة لكل وصفة.' },
  { Icon: ChefHat, title: 'تحضير يدوي', desc: 'تُصنع طازجةً يدوياً بعناية حرفيّينا.' },
  { Icon: Crown, title: 'تصاميم مخصّصة', desc: 'كيكاتٌ تُصمَّم حسب مناسبتك وذوقك.' },
  { Icon: Truck, title: 'توصيل في الموعد', desc: 'توصيلٌ مبرّد يصل طازجاً وفي وقته.' },
];

export function CraftBar() {
  return (
    <section className="container mx-auto px-4 lg:px-6">
      <div className="relative z-10 -mt-8 md:-mt-14 rounded-3xl bg-card border border-border/60 shadow-soft-lift">
        <ul className="grid grid-cols-2 md:grid-cols-4 gap-y-6 p-6 md:p-8">
          {CREDENTIALS.map(({ Icon, title, desc }) => (
            <li key={title} className="flex items-start gap-3 px-2 md:px-4 text-start">
              <span className="shrink-0 flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-primary">
                <Icon className="w-5 h-5" strokeWidth={1.5} />
              </span>
              <div className="min-w-0">
                <div className="font-display text-sm sm:text-base leading-tight">{title}</div>
                <p className="mt-1 text-xs text-muted-foreground leading-relaxed">{desc}</p>
              </div>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
