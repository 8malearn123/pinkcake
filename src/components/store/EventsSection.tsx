import { ArrowUpLeft, PartyPopper, Truck } from "lucide-react";
import { Reveal } from "@/components/Reveal";
import { visibleItems } from "@/hooks/useHomepageContent";
import { SECTION_DEFAULTS, type SectionContent } from "@/lib/homepage/schema";

// المقاسات بلا نقاط توقّف عن قصد: البينتو يُقرأ على الجوال كما يُقرأ من `sm`
// فصاعداً على شبكة الأعمدة الأربعة. تسوية كل البلاطات إلى مربّعات على الجوال
// كانت تُلقي بالتراتب الذي يقول ما الذي نُعرف به فعلاً.
const SPAN: Record<SectionContent["events"]["items"][number]["size"], string> = {
  hero: "col-span-2 row-span-2",
  wide: "col-span-2",
  small: "",
};

export function EventsSection({
  content = SECTION_DEFAULTS.events,
  onStart,
}: {
  content?: SectionContent["events"];
  onStart: () => void;
}) {
  const gallery = visibleItems(content.items);
  return (
    <section id="events" className="bg-background px-5 py-20 sm:px-8 lg:px-12 lg:py-28">
      <div className="mx-auto max-w-[1400px]">
        {/* الترويسة */}
        <Reveal className="grid gap-6 sm:gap-8 lg:grid-cols-[1.2fr_1fr] lg:items-end">
          <div>
            {content.eyebrow && (
              <span className="flex w-fit items-center gap-2.5 text-[11px] font-bold uppercase tracking-[.22em] text-rose">
                <span className="h-px w-10 bg-primary/25" /> {content.eyebrow}
              </span>
            )}
            {/* Arabic needs the extra leading at phone sizes: at 1.02 the ق of
                "تستحق" lands on the damma of "تُنسى" on the line below. */}
            <h2 className="mt-5 text-[2.5rem] font-semibold leading-[1.16] tracking-[-.01em] text-foreground sm:text-[3.5rem] sm:leading-[1.05]">
              {content.title}
              {content.titleAccent && <span className="block text-rose">{content.titleAccent}</span>}
            </h2>
          </div>
          <p className="text-[15px] leading-8 text-muted-foreground lg:pb-3">{content.lede}</p>
        </Reveal>

        {/* معرض البينتو */}
        <Reveal className="reveal-grid mt-10 grid auto-rows-[140px] grid-cols-2 gap-3 sm:mt-12 sm:auto-rows-[175px] sm:grid-cols-4">
          {gallery.map((g, i) => (
            <figure key={`${g.label}-${i}`} className={`group relative overflow-hidden rounded-2xl ring-1 ring-primary/10 ${SPAN[g.size]}`}>
              {/* Described by the figcaption below, so the photo itself is decorative */}
              <img src={g.image.url} alt={g.image.alt} loading="lazy" className="absolute inset-0 size-full object-cover transition duration-700 group-hover:scale-105" />
              {/* Scrim anchored to the bottom rather than washing the whole frame:
                  the caption keeps its contrast and the photography stays bright. */}
              <div className="absolute inset-x-0 bottom-0 h-2/3 bg-gradient-to-t from-ink-black/90 via-ink-black/35 to-transparent" />
              {g.tag && (
                <span className="absolute end-3 top-3 rounded-full bg-gold px-2.5 py-1 text-[10px] font-bold text-ink-ink">{g.tag}</span>
              )}
              {/* 13px on phones so the half-width tiles keep their label on one line */}
              <figcaption className="absolute inset-x-0 bottom-0 flex items-center gap-2 p-3.5 text-[13px] font-semibold leading-snug text-white sm:p-4 sm:text-sm">
                <span className="size-1.5 shrink-0 rounded-full bg-gold" />
                {/* A photo tile with a label reads as tappable on a phone, so it is
                    one: a stretched link over the whole figure, single tab stop. */}
                <button
                  type="button"
                  onClick={onStart}
                  aria-label={`ابدأ تجهيز ${g.label}`}
                  className="text-start transition-opacity duration-200 after:absolute after:inset-0 after:content-[''] group-hover:opacity-90"
                >
                  {g.label}
                </button>
              </figcaption>
            </figure>
          ))}
        </Reveal>

        {/* شريط الدعوة */}
        <Reveal className="shadow-ink-soft mt-10 flex flex-col gap-6 rounded-3xl border border-primary/10 bg-white p-6 sm:p-9 md:mt-14 md:flex-row md:items-center md:justify-between">
          <div className="flex items-center gap-4 sm:gap-5">
            <span className="grid size-14 shrink-0 place-items-center rounded-2xl bg-blush text-primary"><PartyPopper size={26} /></span>
            <div>
              {/* leading-tight because this wraps to two lines beside the icon on a phone */}
              <p className="text-xl font-semibold leading-tight text-primary sm:text-2xl">{content.cta.title}</p>
              {content.cta.subtitle && (
                <p className="mt-1.5 flex items-center gap-1.5 text-sm text-muted-foreground"><Truck size={15} className="shrink-0 text-success" /> {content.cta.subtitle}</p>
              )}
            </div>
          </div>
          <button
            type="button"
            onClick={onStart}
            className="group/btn flex w-full shrink-0 items-center justify-center gap-2 rounded-xl bg-primary px-8 py-4 text-sm font-bold text-white transition duration-300 hover:bg-rose md:w-auto"
          >
            {content.cta.label}
            <ArrowUpLeft size={18} className="transition-transform duration-300 group-hover/btn:-translate-x-0.5 group-hover/btn:-translate-y-0.5" />
          </button>
        </Reveal>
      </div>
    </section>
  );
}
