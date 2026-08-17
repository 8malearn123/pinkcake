import { Gift, Sparkles, Truck } from 'lucide-react';
import { type ResolvedCombo } from '@/lib/combos';
import type { StoreProduct } from '@/hooks/useCustomerStore';
import { Reveal } from '@/components/Reveal';
import { RiyalSymbol } from '@/components/ui/riyal';
import { toArabicDigits } from '@/lib/arabicNumerals';
import { SECTION_DEFAULTS, type SectionContent } from '@/lib/homepage/schema';

// Faithful clone of the Cake & Bloom Combos section (featured big + two side).
// Purely presentational: the caller resolves the admin-authored combos against
// the live catalogue and passes the priced result in. onAddCombo carts one.
export function CombosSection({
  content = SECTION_DEFAULTS.combos,
  combos,
  onAddCombo,
}: {
  content?: SectionContent['combos'];
  combos: ResolvedCombo[];
  onAddCombo: (combo: ResolvedCombo) => void;
}) {
  if (combos.length === 0) return null;
  const featured = combos.find((c) => c.best) ?? combos[0];
  const others = combos.filter((c) => c !== featured);

  const Thumbs = ({ members }: { members: StoreProduct[] }) => (
    <div className="flex items-center">
      {members.map((m, i) => (
        <img
          key={m.id}
          src={m.image_url ?? ''}
          alt={m.name}
          title={m.name}
          loading="lazy"
          className={`size-12 rounded-full border-2 border-white object-cover shadow-sm ${i > 0 ? '-me-3' : ''}`}
        />
      ))}
    </div>
  );

  return (
    <section id="combos" className="relative overflow-hidden bg-background px-5 py-20 sm:px-8 lg:px-12 lg:py-28">
      <div className="mx-auto max-w-[1400px]">
        <Reveal className="flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between">
          <div className="max-w-xl">
            {content.badge && (
              <span className="flex w-fit items-center gap-2 rounded-full bg-primary px-4 py-1.5 text-xs font-bold text-gold">
                <Truck size={14} /> {content.badge}
              </span>
            )}
            <h2 className="mt-5 text-[2.5rem] font-black leading-[1.05] tracking-[-.01em] text-foreground sm:text-[3.25rem]">
              {content.title}
              {content.titleAccent && <><br /><span className="text-rose">{content.titleAccent}</span></>}
            </h2>
          </div>
          <p className="max-w-sm text-[15px] leading-8 text-muted-foreground">{content.lede}</p>
        </Reveal>

        <Reveal className="reveal-grid mt-14 grid gap-6 lg:grid-cols-[1.05fr_1fr] lg:gap-8">
          {/* featured */}
          <article className="group relative flex min-h-[420px] flex-col justify-end overflow-hidden rounded-3xl text-white shadow-xl lg:row-span-2">
            <img src={featured.heroImage} alt={featured.name} loading="lazy" className="absolute inset-0 size-full object-cover transition duration-[900ms] group-hover:scale-105" />
            <div className="absolute inset-0 bg-gradient-to-t from-berry-ink via-berry-ink/55 to-transparent" />
            <span className="absolute end-6 top-6 flex items-center gap-1.5 rounded-full bg-seasonal px-3.5 py-2 text-xs font-bold text-white shadow-lg">
              <Sparkles size={14} /> الأكثر توفيراً
            </span>
            <div className="relative p-7 sm:p-9">
              <span className="text-xs font-bold tracking-[.14em] text-gold">{featured.tagline}</span>
              <h3 className="mt-2 text-3xl font-black leading-tight sm:text-4xl">{featured.name}</h3>
              <div className="mt-5 flex items-center gap-4">
                <Thumbs members={featured.members} />
                <span className="text-sm text-white/75">{toArabicDigits(featured.members.length)} أصناف مختارة</span>
              </div>
              <div className="mt-6 flex flex-wrap items-end justify-between gap-4">
                <div>
                  <div className="flex items-baseline gap-2">
                    <span className="flex items-baseline gap-1.5 text-4xl font-black">{toArabicDigits(featured.price)} <RiyalSymbol className="text-2xl text-white/70" /></span>
                    <span className="flex items-baseline gap-1 text-sm text-white/50 line-through">{toArabicDigits(featured.original)} <RiyalSymbol className="text-xs" /></span>
                  </div>
                  <p className="mt-1.5 flex items-center gap-2 text-[13px] font-bold text-gold">
                    <span className="inline-flex items-baseline gap-1 rounded-full bg-seasonal px-2 py-0.5 text-white">وفّر {toArabicDigits(featured.save)} <RiyalSymbol className="text-[11px]" /></span>
                    <span className="flex items-center gap-1 text-white/80"><Truck size={14} /> توصيل مجاني</span>
                  </p>
                </div>
                <button
                  onClick={() => onAddCombo(featured)}
                  className="flex items-center gap-2 rounded-xl bg-gold px-6 py-3.5 text-sm font-bold text-primary transition duration-300 hover:bg-white"
                >
                  <Gift size={17} /> إضافة إلى السلة
                </button>
              </div>
            </div>
          </article>

          {/* side combos */}
          {others.map((c) => (
            <SideCombo key={c.id} combo={c} onAdd={() => onAddCombo(c)} Thumbs={Thumbs} />
          ))}
        </Reveal>
      </div>
    </section>
  );
}

function SideCombo({
  combo,
  onAdd,
  Thumbs,
}: {
  combo: ResolvedCombo;
  onAdd: () => void;
  Thumbs: (p: { members: StoreProduct[] }) => JSX.Element;
}) {
  return (
    <article className="group flex overflow-hidden rounded-3xl bg-white ring-1 ring-primary/10 transition duration-300 hover:shadow-xl hover:shadow-primary/5">
      <div className="relative w-32 shrink-0 overflow-hidden sm:w-44">
        <img src={combo.heroImage} alt={combo.name} loading="lazy" className="absolute inset-0 size-full object-cover transition duration-700 group-hover:scale-110" />
        <span className="absolute bottom-2 end-2 rounded-full bg-white/95 px-2 py-0.5 text-[10px] font-black" style={{ color: combo.accent }}>
          وفّر {toArabicDigits(combo.pct)}٪
        </span>
      </div>
      <div className="flex grow flex-col p-5">
        <span className="text-[11px] font-bold tracking-[.12em]" style={{ color: combo.accent }}>{combo.tagline}</span>
        <h3 className="mt-1 text-lg font-black leading-tight text-foreground">{combo.name}</h3>
        <div className="mt-3">
          <Thumbs members={combo.members} />
        </div>
        <div className="mt-auto flex items-end justify-between gap-3 pt-4">
          <div>
            <p className="flex items-center gap-1 text-[11px] font-bold text-success"><Truck size={12} /> توصيل مجاني</p>
            <div className="mt-0.5 flex items-baseline gap-1.5">
              <span className="flex items-baseline gap-1 text-xl font-black text-primary">{toArabicDigits(combo.price)} <RiyalSymbol className="text-base" /></span>
              <span className="flex items-baseline gap-1 text-xs text-muted-foreground line-through">{toArabicDigits(combo.original)} <RiyalSymbol className="text-[10px]" /></span>
            </div>
          </div>
          <button
            onClick={onAdd}
            aria-label={`أضف ${combo.name} للسلة`}
            className="flex items-center gap-1.5 rounded-lg px-4 py-2.5 text-xs font-bold text-white transition duration-300 hover:brightness-110"
            style={{ backgroundColor: combo.accent }}
          >
            <Gift size={14} /> إضافة إلى السلة
          </button>
        </div>
      </div>
    </article>
  );
}
