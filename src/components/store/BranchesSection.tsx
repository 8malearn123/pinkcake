import { ArrowUpLeft, Clock, MapPin, Phone, ShoppingBag } from "lucide-react";
import { Reveal } from "@/components/Reveal";

type Branch = { id: number; num: string; city: string; area: string; hours: string; phone: string; phoneHref: string; mapUrl: string; image: string };

const branches: Branch[] = [
  { id: 1, num: "٠١", city: "صبيا", area: "طريق الملك عبدالعزيز، حي الصفا", hours: "يومياً ٩ص – ١٢م", phone: "٠١٧ ٣٦٠ ٠٠٠٠", phoneHref: "tel:+966173600000", mapUrl: "https://maps.google.com/?q=Sabya+Jazan", image: "https://images.unsplash.com/photo-1571942948809-74637bfc59b9?auto=format&fit=crop&w=800&h=900&q=85" },
  { id: 2, num: "٠٢", city: "أبو عريش", area: "شارع الملك فهد، بجوار الميدان", hours: "يومياً ٩ص – ١٢م", phone: "٠١٧ ٣١٠ ٠٠٠٠", phoneHref: "tel:+966173100000", mapUrl: "https://maps.google.com/?q=Abu+Arish+Jazan", image: "https://images.unsplash.com/photo-1711672284661-bd70e38f31b2?auto=format&fit=crop&w=800&h=900&q=85" },
];

export function BranchesSection() {
  return (
    <section id="branches" className="bg-background px-5 py-20 sm:px-8 lg:px-12 lg:py-28">
      <div className="mx-auto max-w-[1400px]">
        {/* الترويسة */}
        <Reveal className="grid gap-8 lg:grid-cols-[1fr_20rem] lg:items-end lg:gap-12">
          <div>
            <span className="flex items-center gap-3 text-[11px] font-bold uppercase tracking-[.22em] text-rose">
              <span className="h-px w-10 bg-primary/25" /> قريبون منك في جازان
            </span>
            <h2 className="mt-5 text-[2.5rem] font-black leading-[1.05] tracking-[-.01em] text-foreground sm:text-[3.25rem]">
              فرعان.
              <span className="block text-rose">نفس النكهة الأصيلة.</span>
            </h2>
          </div>
          <p className="text-[15px] leading-8 text-muted-foreground lg:pb-2">
            زُرنا في صبيا أو أبو عريش، أو اختر <span className="font-bold text-primary">الاستلام من الفرع</span> عند إتمام طلبك ووفّر رسوم التوصيل.
          </p>
        </Reveal>

        {/* البطاقات */}
        <Reveal className="reveal-grid mt-14 grid gap-6 md:grid-cols-2 lg:gap-8">
          {branches.map((b) => (
            <article
              key={b.id}
              className="group grid overflow-hidden rounded-3xl border border-primary/10 bg-white shadow-berry-soft transition duration-300 hover:-translate-y-1 hover:shadow-berry-soft-lg sm:grid-cols-[13rem_1fr]"
            >
              {/* الصورة */}
              <div className="relative aspect-[4/3] overflow-hidden sm:aspect-auto sm:h-full">
                <img
                  src={b.image}
                  alt={`فرع ${b.city}`}
                  loading="lazy"
                  className="absolute inset-0 size-full object-cover transition duration-[900ms] ease-out group-hover:scale-[1.08]"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-berry-ink/55 via-transparent to-transparent" />
                <span className="pointer-events-none absolute end-5 top-4 select-none text-[3.5rem] font-black leading-none text-transparent" style={{ WebkitTextStroke: '1.5px rgba(255,255,255,.7)' }}>
                  {b.num}
                </span>
                <span className="absolute bottom-4 end-4 flex items-center gap-1.5 rounded-full bg-success px-3 py-1.5 text-[11px] font-bold text-white shadow-lg shadow-black/20">
                  <ShoppingBag size={13} strokeWidth={2.5} /> استلام متاح
                </span>
              </div>

              {/* التفاصيل */}
              <div className="flex flex-col p-6 sm:p-7">
                <header>
                  <p className="text-[11px] font-bold uppercase tracking-[.18em] text-rose">فرع</p>
                  <h3 className="mt-1 text-2xl font-black leading-tight text-foreground">{b.city}</h3>
                  <p className="mt-2 flex items-start gap-2 text-sm leading-6 text-muted-foreground">
                    <MapPin size={16} className="mt-0.5 shrink-0 text-rose" /> {b.area}
                  </p>
                </header>

                <dl className="mt-5 grid gap-2.5 border-t border-primary/10 pt-5 text-sm">
                  <div className="flex items-center gap-3">
                    <span className="grid size-8 shrink-0 place-items-center rounded-full bg-blush text-primary"><Clock size={15} /></span>
                    <dd className="text-muted-foreground">{b.hours}</dd>
                  </div>
                  <a href={b.phoneHref} className="flex items-center gap-3 rounded-lg outline-none transition-colors hover:text-primary focus-visible:ring-2 focus-visible:ring-primary/30" dir="ltr">
                    <span className="grid size-8 shrink-0 place-items-center rounded-full bg-blush text-primary"><Phone size={15} /></span>
                    <dd className="me-auto text-muted-foreground">{b.phone}</dd>
                  </a>
                </dl>

                <a
                  href={b.mapUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="group/btn mt-6 flex items-center justify-between gap-2 rounded-xl bg-primary px-5 py-3.5 text-sm font-bold text-white outline-none transition duration-300 hover:bg-rose focus-visible:ring-2 focus-visible:ring-primary/40 focus-visible:ring-offset-2"
                >
                  <span className="flex items-center gap-2"><MapPin size={16} strokeWidth={2.5} /> الاتجاهات على الخريطة</span>
                  <ArrowUpLeft size={18} className="transition-transform duration-300 group-hover/btn:-translate-x-0.5 group-hover/btn:-translate-y-0.5" />
                </a>
              </div>
            </article>
          ))}
        </Reveal>
      </div>
    </section>
  );
}
