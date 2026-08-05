import { useState } from "react";
import { ArrowLeft, Cake, ChevronDown, Gift, Sparkles, Truck, CheckCircle2, Clock } from "lucide-react";
import { Reveal } from "@/components/Reveal";

/* ── بانر عرض مع عدّاد تنازلي ── */
export function OfferBanner() {
  return (
    <section className="px-5 py-8 sm:px-8 lg:px-12">
      <Reveal className="shadow-berry-soft mx-auto flex max-w-[1500px] flex-col items-center gap-6 rounded-3xl border border-primary/10 bg-white px-6 py-8 text-center sm:flex-row sm:justify-between sm:text-start">
        <div className="flex items-center gap-4">
          <span className="grid size-14 shrink-0 place-items-center rounded-full bg-rose text-white shadow-sm"><Gift size={26} /></span>
          <div>
            <p className="text-xs font-bold tracking-[.08em] text-rose">هديّة ترحيبية</p>
            <h3 className="mt-1 text-xl font-black text-foreground sm:text-2xl">خصم ١٥٪ على أوّل طلب</h3>
            <p className="mt-1 text-xs text-muted-foreground">استخدم الكود التالي عند إتمام الطلب</p>
          </div>
        </div>
        <span className="shrink-0 rounded-xl border-2 border-dashed border-gold bg-background px-6 py-3 text-lg font-black tracking-[.2em] text-primary">CAKE15</span>
      </Reveal>
    </section>
  );
}

/* ── تصفّح حسب المناسبة ── */
const occasions = [
  { title: "أعياد الميلاد", desc: "تصاميم مبهجة لكل الأعمار", count: 18, icon: Cake, image: "https://images.unsplash.com/photo-1519869325930-281384150729?auto=format&fit=crop&w=600&h=760&q=85" },
  { title: "حفلات التخرج", desc: "احتفِ بإنجازك بأناقة", count: 9, icon: Sparkles, image: "https://images.unsplash.com/photo-1602351447937-745cb720612f?auto=format&fit=crop&w=600&h=760&q=85" },
  { title: "المواليد الجدد", desc: "لمسات ناعمة للمولود", count: 12, icon: Gift, image: "https://images.unsplash.com/photo-1464349095431-e9a21285b5f3?auto=format&fit=crop&w=600&h=760&q=85" },
  { title: "المناسبات العائلية", desc: "تورتات تجمع الأحبة", count: 15, icon: Cake, image: "https://images.unsplash.com/photo-1621303837174-89787a7d4729?auto=format&fit=crop&w=600&h=760&q=85" },
];
function OccasionCard({ o, featured, className = "" }: { o: (typeof occasions)[number]; featured?: boolean; className?: string }) {
  return (
    <a href="#shop" className={`group relative flex h-full flex-col justify-end overflow-hidden rounded-2xl shadow-sm ring-1 ring-primary/5 transition-shadow duration-300 hover:shadow-xl ${featured ? "min-h-[260px]" : "min-h-[210px]"} ${className}`}>
      <img src={o.image} alt={o.title} className="absolute inset-0 size-full object-cover transition duration-700 group-hover:scale-110" />
      <div className="absolute inset-0 bg-gradient-to-t from-berry-ink/90 via-berry-ink/25 to-transparent" />
      <span className={`absolute start-4 top-4 grid place-items-center rounded-full bg-white/15 text-gold backdrop-blur-md ring-1 ring-white/25 ${featured ? "size-14" : "size-11"}`}>
        <o.icon size={featured ? 26 : 20} />
      </span>
      <span className="absolute end-4 top-4 rounded-full bg-white/90 px-2.5 py-1 text-[10px] font-bold text-primary">{o.count} تصميم</span>
      <div className={`relative text-white ${featured ? "p-6 sm:p-8" : "p-5"}`}>
        {featured && <span className="text-[10px] font-bold tracking-[.12em] text-gold">الأكثر طلباً</span>}
        <h3 className={`font-black ${featured ? "mt-1 text-2xl sm:text-3xl" : "text-lg"}`}>{o.title}</h3>
        <p className={`mt-1 leading-5 text-white/75 ${featured ? "max-w-xs text-sm" : "text-xs"}`}>{o.desc}</p>
        <span className="mt-3 inline-flex items-center gap-1.5 text-xs font-bold text-gold transition-all duration-300 group-hover:gap-2.5">
          تصفّح الآن <ArrowLeft size={15} />
        </span>
      </div>
    </a>
  );
}

export function ShopByOccasion() {
  const [feature, ...rest] = occasions;
  return (
    <section className="mx-auto max-w-[1500px] px-5 py-14 sm:px-8 lg:px-12 lg:py-16">
      <Reveal className="reveal-grid grid gap-5 lg:grid-cols-4 lg:grid-rows-[auto_1fr]">
        {/* عنوان تحريري */}
        <div className="flex flex-col justify-center lg:col-span-2 lg:ps-6">
          <span className="w-fit rounded-full bg-blush px-4 py-1.5 text-xs font-bold tracking-[.08em] text-rose">وش المناسبة؟</span>
          <h2 className="mt-4 text-3xl font-black leading-[1.2] tracking-[-.01em] text-foreground sm:text-[2.6rem]">تصفّح حسب المناسبة</h2>
          <p className="mt-3 max-w-md text-sm leading-7 text-muted-foreground">اختر مناسبتك ونعرض لك التورتات المناسبة لها فوراً — من أعياد الميلاد إلى استقبال المواليد.</p>
        </div>

        {/* بطاقتان صغيرتان أعلى اليسار */}
        <OccasionCard o={rest[0]} />
        <OccasionCard o={rest[1]} />

        {/* الصف السفلي: بطاقة مميّزة + بطاقة عريضة — بنفس الارتفاع تماماً */}
        <OccasionCard o={feature} featured className="lg:col-span-2" />
        <OccasionCard o={rest[2]} className="lg:col-span-2" />
      </Reveal>
    </section>
  );
}

/* ── كيف تطلب ── */
const steps = [
  { num: "٠١", label: "الخطوة الأولى", icon: Cake, title: "اختاري تورتتك", desc: "تصفّحي التشكيلة أو صمّمي تورتة خاصة تناسب ذوقك ومناسبتك." },
  { num: "٠٢", label: "الخطوة الثانية", icon: Clock, title: "حدّدي موعد التوصيل", desc: "اختاري التاريخ والفترة الزمنية الأنسب لك بكل مرونة." },
  { num: "٠٣", label: "الخطوة الثالثة", icon: Truck, title: "نوصلها لباب بيتك", desc: "نجهّزها طازجة ونتابع معك خطوة بخطوة حتى وصولها بأمان." },
];
export function HowItWorks() {
  return (
    <section className="relative overflow-hidden bg-background px-5 py-20 sm:px-8 lg:px-12 lg:py-28">
      <div className="relative mx-auto max-w-[1300px]">
        <div className="flex flex-col items-center text-center">
          <span className="flex items-center gap-3 text-[11px] font-bold uppercase tracking-[.22em] text-rose">
            <span className="h-px w-8 bg-primary/25" /> سهلة وبسيطة <span className="h-px w-8 bg-primary/25" />
          </span>
          <h2 className="mt-5 text-[2.5rem] font-black leading-[1.05] tracking-[-.01em] text-foreground sm:text-[3.25rem]">كيف تطلبين؟</h2>
          <p className="mt-4 max-w-md text-[15px] leading-8 text-muted-foreground">ثلاث خطوات فقط تفصلك عن تورتة مناسبتك القادمة.</p>
        </div>

        <ol className="relative mt-16 grid gap-y-12 md:grid-cols-3 md:gap-x-6">
          {/* الخط الرابط بين الخطوات */}
          <span aria-hidden className="absolute end-[16.66%] start-[16.66%] top-10 hidden h-px bg-gradient-to-l from-transparent via-primary/15 to-transparent md:block" />

          {steps.map((s) => (
            <li key={s.title} className="group relative flex flex-col items-center text-center">
              {/* الأيقونة + الرقم */}
              <div className="relative">
                <span className="grid size-20 place-items-center rounded-full bg-white text-primary ring-1 ring-primary/12 shadow-[0_0_0_6px_hsl(var(--background)),0_10px_30px_-12px_hsl(var(--primary)/0.35)] transition duration-300 group-hover:bg-primary group-hover:text-gold group-hover:ring-primary">
                  <s.icon size={30} strokeWidth={2} />
                </span>
                <span className="absolute -end-2 -top-2 grid size-8 place-items-center rounded-full bg-gold text-xs font-black text-primary ring-4 ring-background">
                  {s.num}
                </span>
              </div>

              <span className="mt-6 text-[11px] font-bold uppercase tracking-[.18em] text-rose">{s.label}</span>
              <h3 className="mt-2 text-xl font-black text-foreground">{s.title}</h3>
              <p className="mt-2.5 max-w-[16rem] text-sm leading-7 text-muted-foreground">{s.desc}</p>
            </li>
          ))}
        </ol>

        <div className="mt-16 flex justify-center">
          <a href="#shop" className="rounded-xl bg-primary px-8 py-4 text-sm font-bold text-white transition duration-300 hover:bg-rose hover:scale-[1.02]">
            ابدئي طلبك الآن
          </a>
        </div>
      </div>
    </section>
  );
}

/* ── الأسئلة الشائعة ── */
const faqs = [
  { q: "كم يحتاج تجهيز الطلب من وقت؟", a: "الطلبات الجاهزة نوصلها في نفس اليوم إذا طلبت قبل ٣ مساءً. التورتات المخصصة تحتاج من ٢٤ إلى ٤٨ ساعة." },
  { q: "هل التوصيل متاح خارج جازان؟", a: "حالياً نوصّل داخل مدينة جازان فقط، ونعمل على التوسّع لمدن أخرى قريباً." },
  { q: "هل أقدر أطلب تورتة بنكهة أو تصميم خاص؟", a: "أكيد! من قسم «صمم تورتتك» أرسل لنا التفاصيل ونتواصل معك لتأكيد التصميم والسعر." },
  { q: "ما هي طرق الدفع المتاحة؟", a: "نقبل مدى، فيزا، ماستركارد، آبل باي، بالإضافة إلى التقسيط عبر تابي." },
  { q: "هل التورتات مناسبة للحساسية الغذائية؟", a: "نوفّر خيارات خالية من المكسرات عند الطلب. يرجى ذكر أي حساسية في ملاحظات الطلب." },
];
export function FAQ() {
  const [open, setOpen] = useState<number | null>(0);
  return (
    <section id="faq" className="mx-auto max-w-[820px] px-5 py-14 sm:px-8 lg:py-20">
      <Reveal className="text-center">
        <p className="text-xs font-bold tracking-[.08em] text-rose">قبل ما تطلب</p>
        <h2 className="mt-2 text-3xl font-black tracking-[-.01em] text-foreground sm:text-4xl">الأسئلة الشائعة</h2>
      </Reveal>
      <Reveal className="mt-9 divide-y divide-primary/10 border-y border-primary/10">
        {faqs.map((f, i) => (
          <div key={f.q}>
            <button onClick={() => setOpen(open === i ? null : i)} className="flex w-full items-center justify-between gap-4 py-4 text-end">
              <span className="text-sm font-bold text-primary">{f.q}</span>
              <ChevronDown size={18} className={`shrink-0 text-rose transition-transform ${open === i ? "rotate-180" : ""}`} />
            </button>
            {open === i && <p className="pb-4 text-sm leading-7 text-muted-foreground">{f.a}</p>}
          </div>
        ))}
      </Reveal>
    </section>
  );
}

/* ── النشرة البريدية ── */
export function Newsletter() {
  const [email, setEmail] = useState("");
  const [done, setDone] = useState(false);
  return (
    <section className="px-5 py-14 sm:px-8 lg:px-12">
      <div className="mx-auto max-w-[1500px] overflow-hidden rounded-2xl border border-primary/10 bg-white px-6 py-12 text-center shadow-[0_20px_70px_-45px_hsl(var(--primary)/0.4)] sm:px-12">
        <p className="text-xs font-bold tracking-[.08em] text-rose">انضمي لعائلة كيكة وورد</p>
        <h2 className="mx-auto mt-2 max-w-xl text-2xl font-black leading-[1.4] text-foreground sm:text-3xl">اشتركي واحصلي على خصم ١٠٪ على أول طلب</h2>
        <p className="mx-auto mt-3 max-w-md text-sm leading-7 text-muted-foreground">وصلك كل جديد من التورتات والعروض الحصرية أول بأول.</p>
        {done ? (
          <p className="mx-auto mt-6 flex items-center justify-center gap-2 text-sm font-bold text-success"><CheckCircle2 size={18} /> تم الاشتراك! تحقّقي من بريدك للحصول على الكود.</p>
        ) : (
          <form onSubmit={(e) => { e.preventDefault(); if (email.trim()) setDone(true); }} className="mx-auto mt-6 flex max-w-md flex-col gap-3 sm:flex-row">
            <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} placeholder="بريدك الإلكتروني" className="grow rounded-md border border-primary/20 bg-white px-4 py-3 text-sm outline-none placeholder:text-muted-foreground focus:border-primary" />
            <button type="submit" className="rounded-md bg-primary px-6 py-3 text-sm font-bold text-white transition-colors hover:bg-rose">اشتراك</button>
          </form>
        )}
      </div>
    </section>
  );
}
