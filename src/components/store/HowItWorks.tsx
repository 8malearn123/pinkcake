import { Wand2, ChefHat, Truck } from 'lucide-react';

const STEPS = [
  { icon: Wand2, num: '٠١', title: 'اختاري أو صمّمي', desc: 'تصفّحي مجموعتنا الجاهزة أو صمّمي كيكتكِ الخاصة بالحجم والنكهة التي تحبّين.' },
  { icon: ChefHat, num: '٠٢', title: 'نحضّرها بحُبّ', desc: 'يبدأ خبّازونا بتحضيرها طازجةً يدوياً بأجود المكوّنات المنتقاة بعناية.' },
  { icon: Truck, num: '٠٣', title: 'توصيل في الموعد', desc: 'نوصلها إلى بابكِ بعنايةٍ تامّة وفي الوقت المحدّد تماماً كما تتمنّين.' },
];

export function HowItWorks() {
  return (
    <section className="rounded-[2rem] bg-card border border-border/60 p-7 md:p-10 shadow-soft-lift">
      <div className="text-center max-w-xl mx-auto">
        <div className="text-xs text-primary tracking-widest uppercase font-medium">بكلِّ بساطة</div>
        <h2 className="font-display text-2xl sm:text-3xl md:text-4xl mt-1 leading-tight">من الفكرة إلى بابكِ في ٣ خطوات</h2>
      </div>
      <div className="grid md:grid-cols-3 gap-8 md:gap-6 mt-9">
        {STEPS.map(({ icon: Icon, num, title, desc }) => (
          <div key={num} className="text-center px-4">
            <div className="mx-auto w-14 h-14 rounded-2xl gradient-pink text-white flex items-center justify-center shadow-rose-glow">
              <Icon className="w-6 h-6" />
            </div>
            <div className="text-xs text-primary font-semibold tracking-[0.3em] mt-3">{num}</div>
            <h3 className="font-display text-xl mt-1">{title}</h3>
            <p className="text-sm text-muted-foreground mt-1.5 leading-relaxed">{desc}</p>
          </div>
        ))}
      </div>
    </section>
  );
}
