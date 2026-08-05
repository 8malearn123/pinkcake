import { ArrowUpLeft, PartyPopper, Truck } from "lucide-react";
import { Reveal } from "@/components/Reveal";

const gallery = [
  { label: "طاولات الحلا الفاخرة", tag: "الأكثر طلباً", span: "sm:col-span-2 sm:row-span-2", image: "https://images.unsplash.com/photo-1729875749490-cb5984d780ec?auto=format&fit=crop&w=900&h=900&q=85" },
  { label: "مناسبات الشركات", span: "sm:col-span-2", image: "https://images.unsplash.com/photo-1677676700414-ff5d6302a978?auto=format&fit=crop&w=900&h=500&q=85" },
  { label: "أعراس وخطوبة", span: "", image: "https://images.unsplash.com/photo-1670529775317-d744808e7f17?auto=format&fit=crop&w=500&h=500&q=85" },
  { label: "استقبال المواليد", span: "", image: "https://images.unsplash.com/photo-1637059395246-8fd86872d596?auto=format&fit=crop&w=500&h=500&q=85" },
];

export function EventsSection({ onStart }: { onStart: () => void }) {
  return (
    <section id="events" className="bg-background px-5 py-20 sm:px-8 lg:px-12 lg:py-28">
      <div className="mx-auto max-w-[1400px]">
        {/* الترويسة */}
        <Reveal className="grid gap-8 lg:grid-cols-[1.2fr_1fr] lg:items-end">
          <div>
            <span className="flex w-fit items-center gap-2.5 text-[11px] font-bold uppercase tracking-[.22em] text-rose">
              <span className="h-px w-10 bg-primary/25" /> تجهيز المناسبات
            </span>
            <h2 className="mt-5 text-[2.5rem] font-black leading-[1.02] tracking-[-.01em] text-foreground sm:text-[3.5rem]">
              مناسبتك تستحق
              <span className="block text-rose">طاولة لا تُنسى.</span>
            </h2>
          </div>
          <p className="text-[15px] leading-8 text-muted-foreground lg:pb-3">
            من أول فكرة حتى آخر ضيف — نصمّم ونجهّز ونوصّل ونرتّب حلويات مناسبتك بالكامل، فتستمتع أنت باللحظة ونتكفّل نحن بالباقي.
          </p>
        </Reveal>

        {/* معرض البينتو */}
        <Reveal className="reveal-grid mt-12 grid auto-rows-[150px] grid-cols-2 gap-3 sm:auto-rows-[175px] sm:grid-cols-4">
          {gallery.map((g) => (
            <figure key={g.label} className={`group relative overflow-hidden rounded-2xl ring-1 ring-primary/10 ${g.span}`}>
              <img src={g.image} alt={g.label} loading="lazy" className="absolute inset-0 size-full object-cover transition duration-700 group-hover:scale-105" />
              <div className="absolute inset-0 bg-gradient-to-t from-berry-black/85 via-berry-black/10 to-transparent" />
              {g.tag && (
                <span className="absolute end-3 top-3 rounded-full bg-gold px-2.5 py-1 text-[10px] font-bold text-berry-ink">{g.tag}</span>
              )}
              <figcaption className="absolute inset-x-0 bottom-0 flex items-center gap-1.5 p-4 text-sm font-black text-white">
                <span className="size-1.5 rounded-full bg-gold" /> {g.label}
              </figcaption>
            </figure>
          ))}
        </Reveal>

        {/* شريط الدعوة */}
        <Reveal className="shadow-berry-soft mt-14 flex flex-col items-center justify-between gap-6 rounded-3xl border border-primary/10 bg-white p-7 sm:p-9 md:flex-row">
          <div className="flex items-center gap-5">
            <span className="grid size-14 shrink-0 place-items-center rounded-2xl bg-blush text-primary"><PartyPopper size={26} /></span>
            <div>
              <p className="text-xl font-black text-primary sm:text-2xl">جاهزون لمناسبتك القادمة</p>
              <p className="mt-1 flex items-center gap-1.5 text-sm text-muted-foreground"><Truck size={15} className="text-success" /> توصيل وتنسيق داخل جازان</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onStart}
            className="group/btn flex w-full items-center justify-center gap-2 rounded-xl bg-primary px-8 py-4 text-sm font-bold text-white transition duration-300 hover:bg-rose md:w-auto"
          >
            ابدأ تجهيز مناسبتك
            <ArrowUpLeft size={18} className="transition-transform duration-300 group-hover/btn:-translate-x-0.5 group-hover/btn:-translate-y-0.5" />
          </button>
        </Reveal>
      </div>
    </section>
  );
}
