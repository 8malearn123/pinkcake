import { ArrowUpLeft, PartyPopper, Truck } from "lucide-react";
import { Reveal } from "@/components/Reveal";

// `span` is breakpoint-free on purpose: the bento reads the same way on a phone
// (full-width hero, full-width band, then a pair) as it does from `sm` up on the
// 4-column grid. Collapsing everything to equal squares on phones threw away the
// hierarchy that tells you what we're actually known for.
const gallery = [
  { label: "طاولات الحلا الفاخرة", tag: "الأكثر طلباً", span: "col-span-2 row-span-2", image: "https://images.unsplash.com/photo-1729875749490-cb5984d780ec?auto=format&fit=crop&w=900&h=900&q=85" },
  { label: "مناسبات الشركات", span: "col-span-2", image: "https://images.unsplash.com/photo-1677676700414-ff5d6302a978?auto=format&fit=crop&w=900&h=500&q=85" },
  { label: "أعراس وخطوبة", span: "", image: "https://images.unsplash.com/photo-1670529775317-d744808e7f17?auto=format&fit=crop&w=500&h=500&q=85" },
  { label: "استقبال المواليد", span: "", image: "https://images.unsplash.com/photo-1637059395246-8fd86872d596?auto=format&fit=crop&w=500&h=500&q=85" },
];

export function EventsSection({ onStart }: { onStart: () => void }) {
  return (
    <section id="events" className="bg-background px-5 py-20 sm:px-8 lg:px-12 lg:py-28">
      <div className="mx-auto max-w-[1400px]">
        {/* الترويسة */}
        <Reveal className="grid gap-6 sm:gap-8 lg:grid-cols-[1.2fr_1fr] lg:items-end">
          <div>
            <span className="flex w-fit items-center gap-2.5 text-[11px] font-bold uppercase tracking-[.22em] text-rose">
              <span className="h-px w-10 bg-primary/25" /> تجهيز المناسبات
            </span>
            {/* Arabic needs the extra leading at phone sizes: at 1.02 the ق of
                "تستحق" lands on the damma of "تُنسى" on the line below. */}
            <h2 className="mt-5 text-[2.5rem] font-black leading-[1.16] tracking-[-.01em] text-foreground sm:text-[3.5rem] sm:leading-[1.05]">
              مناسبتك تستحق
              <span className="block text-rose">طاولة لا تُنسى.</span>
            </h2>
          </div>
          <p className="text-[15px] leading-8 text-muted-foreground lg:pb-3">
            من أول فكرة حتى آخر ضيف — نصمّم ونجهّز ونوصّل ونرتّب حلويات مناسبتك بالكامل، فتستمتع أنت باللحظة ونتكفّل نحن بالباقي.
          </p>
        </Reveal>

        {/* معرض البينتو */}
        <Reveal className="reveal-grid mt-10 grid auto-rows-[140px] grid-cols-2 gap-3 sm:mt-12 sm:auto-rows-[175px] sm:grid-cols-4">
          {gallery.map((g) => (
            <figure key={g.label} className={`group relative overflow-hidden rounded-2xl ring-1 ring-primary/10 ${g.span}`}>
              {/* Described by the figcaption below, so the photo itself is decorative */}
              <img src={g.image} alt="" loading="lazy" className="absolute inset-0 size-full object-cover transition duration-700 group-hover:scale-105" />
              {/* Scrim anchored to the bottom rather than washing the whole frame:
                  the caption keeps its contrast and the photography stays bright. */}
              <div className="absolute inset-x-0 bottom-0 h-2/3 bg-gradient-to-t from-berry-black/90 via-berry-black/35 to-transparent" />
              {g.tag && (
                <span className="absolute end-3 top-3 rounded-full bg-gold px-2.5 py-1 text-[10px] font-bold text-berry-ink">{g.tag}</span>
              )}
              {/* 13px on phones so the half-width tiles keep their label on one line */}
              <figcaption className="absolute inset-x-0 bottom-0 flex items-center gap-2 p-3.5 text-[13px] font-black leading-snug text-white sm:p-4 sm:text-sm">
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
        <Reveal className="shadow-berry-soft mt-10 flex flex-col gap-6 rounded-3xl border border-primary/10 bg-white p-6 sm:p-9 md:mt-14 md:flex-row md:items-center md:justify-between">
          <div className="flex items-center gap-4 sm:gap-5">
            <span className="grid size-14 shrink-0 place-items-center rounded-2xl bg-blush text-primary"><PartyPopper size={26} /></span>
            <div>
              {/* leading-tight because this wraps to two lines beside the icon on a phone */}
              <p className="text-xl font-black leading-tight text-primary sm:text-2xl">جاهزون لمناسبتك القادمة</p>
              <p className="mt-1.5 flex items-center gap-1.5 text-sm text-muted-foreground"><Truck size={15} className="shrink-0 text-success" /> توصيل وتنسيق داخل جازان</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onStart}
            className="group/btn flex w-full shrink-0 items-center justify-center gap-2 rounded-xl bg-primary px-8 py-4 text-sm font-bold text-white transition duration-300 hover:bg-rose md:w-auto"
          >
            ابدأ تجهيز مناسبتك
            <ArrowUpLeft size={18} className="transition-transform duration-300 group-hover/btn:-translate-x-0.5 group-hover/btn:-translate-y-0.5" />
          </button>
        </Reveal>
      </div>
    </section>
  );
}
