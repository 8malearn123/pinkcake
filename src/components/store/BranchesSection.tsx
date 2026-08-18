import { ArrowUpLeft, Clock, MapPin, Phone, ShoppingBag } from "lucide-react";
import { Reveal } from "@/components/Reveal";
import { toArabicDigits } from "@/lib/arabicNumerals";
import { visibleItems } from "@/hooks/useHomepageContent";
import { SECTION_DEFAULTS, type SectionContent } from "@/lib/homepage/schema";

export function BranchesSection({
  content = SECTION_DEFAULTS.branches,
}: {
  content?: SectionContent["branches"];
}) {
  const branches = visibleItems(content.items);
  if (branches.length === 0) return null;
  return (
    <section id="branches" className="bg-background px-5 py-20 sm:px-8 lg:px-12 lg:py-28">
      <div className="mx-auto max-w-[1400px]">
        {/* الترويسة */}
        <Reveal className="grid gap-8 lg:grid-cols-[1fr_20rem] lg:items-end lg:gap-12">
          <div>
            {content.eyebrow && (
              <span className="flex items-center gap-3 text-[11px] font-bold uppercase tracking-[.22em] text-rose">
                <span className="h-px w-10 bg-primary/25" /> {content.eyebrow}
              </span>
            )}
            <h2 className="mt-5 text-[2.5rem] font-semibold leading-[1.05] tracking-[-.01em] text-foreground sm:text-[3.25rem]">
              {content.title}
              {content.titleAccent && <span className="block text-rose">{content.titleAccent}</span>}
            </h2>
          </div>
          <p className="text-[15px] leading-8 text-muted-foreground lg:pb-2">{content.lede}</p>
        </Reveal>

        {/* البطاقات */}
        <Reveal className="reveal-grid mt-14 grid gap-6 md:grid-cols-2 lg:gap-8">
          {branches.map((b, i) => (
            <article
              key={`${b.city}-${i}`}
              className="group grid overflow-hidden rounded-3xl border border-primary/10 bg-white shadow-ink-soft transition duration-300 hover:-translate-y-1 hover:shadow-ink-soft-lg sm:grid-cols-[13rem_1fr]"
            >
              {/* الصورة */}
              <div className="relative aspect-[4/3] overflow-hidden sm:aspect-auto sm:h-full">
                <img
                  src={b.image.url}
                  alt={b.image.alt || `فرع ${b.city}`}
                  loading="lazy"
                  className="absolute inset-0 size-full object-cover transition duration-[900ms] ease-out group-hover:scale-[1.08]"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-ink-ink/55 via-transparent to-transparent" />
                {/* الترقيم مشتقّ من الموضع لا مكتوب في المحتوى: لو كُتب يدوياً
                    لأخفى المدير الفرع الأول وبقيت البطاقة التالية «٠٢». */}
                <span className="pointer-events-none absolute end-5 top-4 select-none text-[3.5rem] font-semibold leading-none text-transparent" style={{ WebkitTextStroke: '1.5px rgba(255,255,255,.7)' }}>
                  {toArabicDigits(String(i + 1).padStart(2, '0'))}
                </span>
                <span className="absolute bottom-4 end-4 flex items-center gap-1.5 rounded-full bg-success px-3 py-1.5 text-[11px] font-bold text-white shadow-lg shadow-black/20">
                  <ShoppingBag size={13} strokeWidth={2.5} /> استلام متاح
                </span>
              </div>

              {/* التفاصيل */}
              <div className="flex flex-col p-6 sm:p-7">
                <header>
                  <p className="text-[11px] font-bold uppercase tracking-[.18em] text-rose">فرع</p>
                  <h3 className="mt-1 text-2xl font-semibold leading-tight text-foreground">{b.city}</h3>
                  {b.area && (
                    <p className="mt-2 flex items-start gap-2 text-sm leading-6 text-muted-foreground">
                      <MapPin size={16} className="mt-0.5 shrink-0 text-rose" /> {b.area}
                    </p>
                  )}
                </header>

                {/* الصفوف الاختيارية تُحذف حين يُفرَّغ حقلها، لا تُعرض فارغة */}
                <dl className="mt-5 grid gap-2.5 border-t border-primary/10 pt-5 text-sm">
                  {b.hours && (
                    <div className="flex items-center gap-3">
                      <span className="grid size-8 shrink-0 place-items-center rounded-full bg-blush text-primary"><Clock size={15} /></span>
                      <dd className="text-muted-foreground">{b.hours}</dd>
                    </div>
                  )}
                  {b.phone && (
                    <a href={b.phoneHref || undefined} className="flex items-center gap-3 rounded-lg outline-none transition-colors hover:text-primary focus-visible:ring-2 focus-visible:ring-primary/30" dir="ltr">
                      <span className="grid size-8 shrink-0 place-items-center rounded-full bg-blush text-primary"><Phone size={15} /></span>
                      <dd className="me-auto text-muted-foreground">{b.phone}</dd>
                    </a>
                  )}
                </dl>

                {b.mapUrl && (
                  <a
                    href={b.mapUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="group/btn mt-6 flex items-center justify-between gap-2 rounded-xl bg-primary px-5 py-3.5 text-sm font-bold text-white outline-none transition duration-300 hover:bg-rose focus-visible:ring-2 focus-visible:ring-primary/40 focus-visible:ring-offset-2"
                  >
                    <span className="flex items-center gap-2"><MapPin size={16} strokeWidth={2.5} /> الاتجاهات على الخريطة</span>
                    <ArrowUpLeft size={18} className="transition-transform duration-300 group-hover/btn:-translate-x-0.5 group-hover/btn:-translate-y-0.5" />
                  </a>
                )}
              </div>
            </article>
          ))}
        </Reveal>
      </div>
    </section>
  );
}
