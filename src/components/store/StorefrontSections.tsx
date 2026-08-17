import { useState } from "react";
import { ArrowLeft, Cake, ChevronDown, Gift, Truck, CheckCircle2, Clock } from "lucide-react";
import { Reveal } from "@/components/Reveal";
import { toArabicDigits } from "@/lib/arabicNumerals";
import { iconFor } from "@/lib/homepage/icons";
import { visibleItems } from "@/hooks/useHomepageContent";
import { SECTION_DEFAULTS, type SectionContent } from "@/lib/homepage/schema";
import type { CtaTarget } from "@/lib/homepage/types";

/* نسخة ثانية من «بانر العرض» كانت هنا بنصّ ورمز مثبّتين، ولم تكن مركّبة في أي
   صفحة. حُذفت مع قسم «التسويق»: البانر الحيّ واحد الآن — `store/OfferBanner.tsx`
   — ويُحرَّر من اللوحة. نسختان بنصّين مختلفين هي كيف يُعلن رمز منتهٍ. */

/* ── تصفّح حسب المناسبة ── */
type OccasionItem = SectionContent["occasions"]["items"][number];

function OccasionCard({ o, onCta }: { o: OccasionItem; onCta: (t: CtaTarget) => void }) {
  const Icon = iconFor(o.icon);
  const { featured } = o;
  return (
    <button
      type="button"
      onClick={() => onCta(o.target)}
      aria-label={`تصفّح ${o.title}`}
      className={`group relative flex h-full flex-col justify-end overflow-hidden rounded-2xl text-start shadow-sm ring-1 ring-primary/5 transition-shadow duration-300 hover:shadow-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary ${featured ? "min-h-[260px]" : "min-h-[210px]"} ${o.size === "wide" ? "lg:col-span-2" : ""}`}
    >
      <img src={o.image.url} alt={o.image.alt} className="absolute inset-0 size-full object-cover transition duration-700 group-hover:scale-110" />
      <div className="absolute inset-0 bg-gradient-to-t from-ink-ink/90 via-ink-ink/25 to-transparent" />
      <span className={`absolute start-4 top-4 grid place-items-center rounded-full bg-white/15 text-gold backdrop-blur-md ring-1 ring-white/25 ${featured ? "size-14" : "size-11"}`}>
        <Icon size={featured ? 26 : 20} />
      </span>
      {o.count > 0 && (
        <span className="absolute end-4 top-4 rounded-full bg-white/90 px-2.5 py-1 text-[10px] font-bold text-primary">{toArabicDigits(o.count)} تصميم</span>
      )}
      <div className={`relative text-white ${featured ? "p-6 sm:p-8" : "p-5"}`}>
        {featured && <span className="text-[10px] font-bold tracking-[.12em] text-gold">الأكثر طلباً</span>}
        <h3 className={`font-semibold ${featured ? "mt-1 text-2xl sm:text-3xl" : "text-lg"}`}>{o.title}</h3>
        <p className={`mt-1 leading-5 text-white/75 ${featured ? "max-w-xs text-sm" : "text-xs"}`}>{o.desc}</p>
        <span className="mt-3 inline-flex items-center gap-1.5 text-xs font-bold text-gold transition-all duration-300 group-hover:gap-2.5">
          تصفّح الآن <ArrowLeft size={15} />
        </span>
      </div>
    </button>
  );
}

/**
 * البلاطات تُرسم بترتيبها المُحرَّر، ومقاس كل بلاطة حقل فيها (`size`) لا موضع
 * محسوب في الشفرة. النسخة السابقة كانت تفكّ المصفوفة إلى `[feature, ...rest]`
 * ثم توزّعها يدوياً، فكان المدير سيسحب بطاقة إلى الأول ويجدها ثالثة على الصفحة.
 */
export function ShopByOccasion({
  content = SECTION_DEFAULTS.occasions,
  onCta,
}: {
  content?: SectionContent["occasions"];
  onCta: (t: CtaTarget) => void;
}) {
  const items = visibleItems(content.items);
  return (
    <section className="mx-auto max-w-[1500px] px-5 py-14 sm:px-8 lg:px-12 lg:py-16">
      <Reveal className="reveal-grid grid gap-5 lg:grid-cols-4 lg:grid-rows-[auto_1fr]">
        {/* عنوان تحريري */}
        <div className="flex flex-col justify-center lg:col-span-2 lg:ps-6">
          {content.eyebrow && <span className="w-fit rounded-full bg-blush px-4 py-1.5 text-xs font-bold tracking-[.08em] text-rose">{content.eyebrow}</span>}
          <h2 className="mt-4 text-3xl font-semibold leading-[1.2] tracking-[-.01em] text-foreground sm:text-[2.6rem]">{content.title}</h2>
          {content.lede && <p className="mt-3 max-w-md text-sm leading-7 text-muted-foreground">{content.lede}</p>}
        </div>

        {items.map((o, i) => (
          <OccasionCard key={`${o.title}-${i}`} o={o} onCta={onCta} />
        ))}
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
          <h2 className="mt-5 text-[2.5rem] font-semibold leading-[1.05] tracking-[-.01em] text-foreground sm:text-[3.25rem]">كيف تطلبين؟</h2>
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
                <span className="absolute -end-2 -top-2 grid size-8 place-items-center rounded-full bg-gold text-xs font-semibold text-primary ring-4 ring-background">
                  {s.num}
                </span>
              </div>

              <span className="mt-6 text-[11px] font-bold uppercase tracking-[.18em] text-rose">{s.label}</span>
              <h3 className="mt-2 text-xl font-semibold text-foreground">{s.title}</h3>
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
export function FAQ({ content = SECTION_DEFAULTS.faq }: { content?: SectionContent["faq"] }) {
  const [open, setOpen] = useState<number | null>(0);
  const items = visibleItems(content.items);
  if (items.length === 0) return null;
  return (
    <section id="faq" className="mx-auto max-w-[820px] px-5 py-14 sm:px-8 lg:py-20">
      <Reveal className="text-center">
        {content.eyebrow && <p className="text-xs font-bold tracking-[.08em] text-rose">{content.eyebrow}</p>}
        <h2 className="mt-2 text-3xl font-semibold tracking-[-.01em] text-foreground sm:text-4xl">{content.title}</h2>
      </Reveal>
      <Reveal className="mt-9 divide-y divide-primary/10 border-y border-primary/10">
        {items.map((f, i) => (
          <div key={`${f.q}-${i}`}>
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
        <h2 className="mx-auto mt-2 max-w-xl text-2xl font-semibold leading-[1.4] text-foreground sm:text-3xl">اشتركي واحصلي على خصم ١٠٪ على أول طلب</h2>
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
