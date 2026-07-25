import { Wand2, ChefHat, Truck } from 'lucide-react';

const STEPS = [
  { icon: Wand2, num: '1', title: 'اختر أو صمّم', desc: 'تصفّح مجموعتنا الجاهزة أو صمّم كيكتك الخاصة بالحجم والنكهة التي تحبّ.' },
  { icon: ChefHat, num: '2', title: 'نحضّرها بحُبّ', desc: 'يبدأ خبّازونا بتحضيرها طازجةً يدوياً بأجود المكوّنات المنتقاة بعناية.' },
  { icon: Truck, num: '3', title: 'توصيل في الموعد', desc: 'نوصلها إلى بابك بعنايةٍ تامّة وفي الوقت المحدّد تماماً كما تتمنّين.' },
];

export function HowItWorks() {
  return (
    <section className="rounded-[2rem] bg-card border border-border/60 p-7 md:p-12 shadow-soft-lift">
      <div className="text-center max-w-xl mx-auto">
        <div className="inline-flex items-center gap-3">
          <span className="h-px w-8" style={{ background: 'linear-gradient(90deg, transparent, hsl(var(--primary) / .6))' }} />
          <span className="text-xs text-primary tracking-[0.3em] uppercase font-medium">بكلِّ بساطة</span>
          <span className="h-px w-8" style={{ background: 'linear-gradient(90deg, hsl(var(--primary) / .6), transparent)' }} />
        </div>
        <h2 className="font-wedding text-2xl sm:text-3xl md:text-4xl mt-2 leading-[1.3]">من الفكرة إلى بابك في 3 خطوات</h2>
        <p className="text-muted-foreground text-sm mt-3 leading-relaxed">
          تجربة سلسة من أوّل نقرة حتى تصل كيكتك طازجةً إلى بابك.
        </p>
      </div>

      <div className="relative mt-12">
        {/* Journey connector (desktop) — the icon badges' card-ring cuts it cleanly */}
        <div aria-hidden className="hidden md:block absolute top-9 inset-x-[16%] border-t-2 border-dashed border-primary/25" />

        <div className="relative grid gap-10 md:grid-cols-3 md:gap-6">
          {STEPS.map(({ icon: Icon, num, title, desc }) => (
            <div key={num} className="text-center">
              <div className="relative mx-auto w-[72px]">
                <div className="group flex h-[72px] w-[72px] items-center justify-center rounded-2xl gradient-pink text-white shadow-rose-glow ring-4 ring-card transition-transform duration-300 hover:-translate-y-1">
                  <Icon className="w-7 h-7" />
                </div>
                <span className="font-display-latin absolute -top-2 -end-2 flex h-7 w-7 items-center justify-center rounded-full border-2 border-primary/30 bg-card text-base text-primary shadow-sm">
                  {num}
                </span>
              </div>
              <h3 className="font-display text-xl mt-5">{title}</h3>
              <p className="mx-auto mt-2 max-w-[16rem] text-sm leading-relaxed text-muted-foreground">{desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
