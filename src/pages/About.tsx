import { Link } from 'react-router-dom';
import { Cake, Sparkles, ChefHat, Gift, type LucideIcon } from 'lucide-react';
import { InfoPageLayout } from '@/components/store/InfoPageLayout';

interface Value {
  icon: LucideIcon;
  title: string;
  description: string;
}

const VALUES: Value[] = [
  {
    icon: Sparkles,
    title: 'مكوّنات فاخرة',
    description:
      'ننتقي أجود المكونات الطبيعية الطازجة، من الشوكولاتة البلجيكية إلى الفواكه الموسمية، لنمنح كل قطعة طعماً استثنائياً.',
  },
  {
    icon: ChefHat,
    title: 'صناعة يدوية',
    description:
      'كل كيكة تُصنع بأيدي طهاتنا المهرة وتُزيّن بعناية وشغف، فلا قطعة تشبه الأخرى وكل تفصيلة مصنوعة بحب.',
  },
  {
    icon: Gift,
    title: 'لكل مناسبة',
    description:
      'من أعياد الميلاد إلى حفلات الزفاف والتخرّج، نصمّم لكِ الكيكة التي تليق بلحظاتكِ المميزة وتجعلها لا تُنسى.',
  },
];

const STATS: { value: string; label: string }[] = [
  { value: '+10', label: 'سنوات خبرة' },
  { value: '+50 ألف', label: 'كيكة صُنعت بحب' },
  { value: '3', label: 'فروع' },
];

export default function About() {
  return (
    <InfoPageLayout
      eyebrow="قصتنا"
      title="من نحن"
      subtitle="كيكات وحلويات مصنوعة يدوياً بحب، نُحضّرها بأجود المكونات لنُحوّل مناسباتكِ إلى ذكريات حلوة لا تُنسى."
      icon={Cake}
    >
      <div className="space-y-12">
        {/* Brand story */}
        <section className="max-w-3xl space-y-4">
          <p className="text-lg text-foreground leading-relaxed">
            بدأت بينك كيك من شغفٍ بسيط بصناعة الحلويات، ومن حلمٍ بأن يكون لكل احتفال نكهته الخاصة التي
            تبقى في الذاكرة. ما كان مطبخاً صغيراً مليئاً بالأحلام تحوّل اليوم إلى وجهة محبوبة لعشّاق
            الكيك في الرياض.
          </p>
          <p className="text-muted-foreground leading-relaxed">
            نؤمن أن الكيكة ليست مجرّد حلوى، بل هي جزء من اللحظة وتفصيل يصنع البهجة. لذلك نحرص على أن
            تكون كل قطعة تخرج من مطبخنا تحفة فنية في مذاقها وشكلها، مصنوعة بمكونات طازجة وأيدٍ ماهرة
            تضع في عملها كل الحب والاهتمام.
          </p>
          <p className="text-muted-foreground leading-relaxed">
            رحلتنا مستمرة في الابتكار وتقديم نكهات جديدة وتصاميم مبهرة، لكن يبقى هدفنا واحداً منذ اليوم
            الأول: أن نرسم البسمة على وجهكِ ووجوه من تحبّين في كل مناسبة.
          </p>
        </section>

        {/* Values grid */}
        <section className="grid sm:grid-cols-3 gap-5">
          {VALUES.map((value) => {
            const Icon = value.icon;
            return (
              <div
                key={value.title}
                className="rounded-3xl border border-border/60 bg-card p-6"
              >
                <div className="w-12 h-12 rounded-2xl bg-primary/10 text-primary flex items-center justify-center mb-4">
                  <Icon className="w-6 h-6" />
                </div>
                <h3 className="font-display text-xl mb-2">{value.title}</h3>
                <p className="text-muted-foreground leading-relaxed">{value.description}</p>
              </div>
            );
          })}
        </section>

        {/* Stats row */}
        <section className="grid grid-cols-3 gap-4">
          {STATS.map((stat) => (
            <div key={stat.label} className="text-center">
              <div className="font-display text-4xl text-primary">{stat.value}</div>
              <div className="text-muted-foreground mt-1 text-sm">{stat.label}</div>
            </div>
          ))}
        </section>

        {/* Closing CTA */}
        <section
          className="rounded-3xl p-8 text-center"
          style={{ background: 'linear-gradient(135deg, hsl(var(--blush)), hsl(var(--card)))' }}
        >
          <h2 className="font-display text-3xl">جاهزة لتذوّقي الفرق؟</h2>
          <p className="text-muted-foreground leading-relaxed mt-3 max-w-xl mx-auto">
            تصفّحي تشكيلتنا من الكيكات والحلويات، أو صمّمي كيكتكِ الخاصة بنفسكِ لتناسب مناسبتكِ تماماً.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 mt-6">
            <Link
              to="/store"
              className="inline-flex items-center justify-center rounded-full h-11 px-6 bg-foreground text-background text-sm font-semibold hover:bg-foreground/90 transition-colors"
            >
              تسوّقي الآن
            </Link>
            <Link
              to="/customize"
              className="inline-flex items-center justify-center rounded-full h-11 px-6 border border-border bg-card text-sm font-semibold hover:border-primary/50 hover:bg-primary/5 transition-colors"
            >
              صمّمي كيكتك
            </Link>
          </div>
        </section>
      </div>
    </InfoPageLayout>
  );
}
