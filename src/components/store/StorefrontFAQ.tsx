import { useState } from 'react';
import { ChevronDown } from 'lucide-react';

const FAQS = [
  { q: 'كم يحتاج تجهيز الطلب من وقت؟', a: 'الطلبات الجاهزة نوصّلها في نفس اليوم إذا طلبتِ قبل 3 عصراً. التورتات المخصّصة تحتاج من 24 إلى 48 ساعة.' },
  { q: 'هل التوصيل متاح خارج الرياض؟', a: 'حالياً نوصّل داخل مدينة الرياض، ونعمل على التوسّع لمدنٍ أخرى قريباً.' },
  { q: 'هل أقدر أطلب تورتة بنكهة أو تصميم خاص؟', a: 'أكيد! من قسم «صمّمي تورتتك» أرسلي لنا التفاصيل ونتواصل معك لتأكيد التصميم والسعر.' },
  { q: 'ما هي طرق الدفع المتاحة؟', a: 'نقبل مدى، فيزا، ماستركارد، وآبل باي، بالإضافة إلى الدفع عند الاستلام.' },
  { q: 'هل التورتات مناسبة للحساسية الغذائية؟', a: 'نوفّر خياراتٍ خالية من المكسرات عند الطلب. يرجى ذكر أي حساسية في ملاحظات الطلب.' },
];

export function StorefrontFAQ() {
  const [open, setOpen] = useState<number | null>(0);
  return (
    <section id="faq" className="max-w-[820px] mx-auto">
      <div className="text-center">
        <p className="text-xs font-bold tracking-[.08em] text-primary">قبل ما تطلبي</p>
        <h2 className="font-display mt-2 text-3xl sm:text-4xl leading-tight text-foreground">الأسئلة الشائعة</h2>
      </div>
      <div className="mt-8 divide-y divide-border/70 border-y border-border/70">
        {FAQS.map((f, i) => {
          const isOpen = open === i;
          return (
            <div key={f.q}>
              <button
                onClick={() => setOpen(isOpen ? null : i)}
                aria-expanded={isOpen}
                className="flex w-full items-center justify-between gap-4 py-4 text-start"
              >
                <span className="text-sm font-semibold text-foreground">{f.q}</span>
                <ChevronDown className={`w-4 h-4 shrink-0 text-primary transition-transform ${isOpen ? 'rotate-180' : ''}`} />
              </button>
              {isOpen && <p className="pb-4 text-sm leading-7 text-muted-foreground">{f.a}</p>}
            </div>
          );
        })}
      </div>
    </section>
  );
}
