import { ArrowLeft, Camera, Clock, Sparkles, Wand2 } from 'lucide-react';
import { Reveal } from '@/components/Reveal';
import { Skeleton } from '@/components/ui/skeleton';
import { CustomCakeCard } from '@/components/store/CustomCakeCard';
import type { GalleryCake } from '@/lib/cakeSelect';

interface CustomCakeSectionProps {
  /** Already filtered to designable cakes (galleryCakes). */
  cakes: GalleryCake[];
  /** The catalog session is still hydrating from localStorage/IndexedDB. */
  loading: boolean;
  /** Opens /customize pre-seeded with this cake. */
  onPick: (cakeId: string) => void;
  /** Opens the full /custom-cakes listing. */
  onViewAll: () => void;
}

const TRUST = [
  { icon: Camera, text: 'كل خيار مصوّر فعلاً في مطبخنا' },
  { icon: Sparkles, text: 'تعديلات مجانية قبل التأكيد' },
  { icon: Clock, text: 'جاهزة خلال ٢٤ ساعة' },
];

/**
 * The home page's design-studio doorway: copy panel beside three real designable
 * cakes. A card opens /customize already on that cake's first step — the studio's
 * own gallery is a fallback, not the entry point we advertise.
 *
 * Renders skeletons rather than nothing while the catalog hydrates: the section
 * sits directly under the hero, so a late pop-in would shove the fold.
 */
export function CustomCakeSection({ cakes, loading, onPick, onViewAll }: CustomCakeSectionProps) {
  if (!loading && cakes.length === 0) return null;
  const shown = cakes.slice(0, 3);

  return (
    <section
      id="custom"
      className="bg-gradient-to-b from-blush to-background px-5 py-14 sm:px-8 lg:px-12 lg:py-20"
    >
      <div className="mx-auto grid max-w-[1500px] gap-9 lg:grid-cols-[0.85fr_1.15fr] lg:items-center lg:gap-14">
        {/* Copy panel */}
        <Reveal>
          <p className="flex items-center gap-2.5 text-[11px] font-bold uppercase tracking-[.22em] text-rose">
            <span className="h-px w-10 bg-primary/25" /> استوديو التصميم
          </p>
          <h2 className="mt-4 text-[2.5rem] font-black leading-[1.05] tracking-[-.01em] text-foreground sm:text-[3.25rem]">
            صمّم كيكتك
            <span className="block text-rose">بالضبط كما تتخيّلها.</span>
          </h2>
          <p className="mt-5 max-w-lg text-sm leading-8 text-muted-foreground">
            اختر كيكة، ثم خصّص شكلها ونكهتها ولونها خطوة بخطوة. كل خيار تراه هو صورة كيكة خبزناها
            فعلاً — لا رسومات ولا تخمين، تشوف كيكتك قبل ما تطلبها.
          </p>

          <ul className="mt-6 grid gap-3">
            {TRUST.map(({ icon: Icon, text }) => (
              <li key={text} className="flex items-center gap-2.5 text-sm font-bold text-muted-foreground">
                <span className="grid size-7 shrink-0 place-items-center rounded-full bg-white text-rose shadow-sm">
                  <Icon size={14} />
                </span>
                {text}
              </li>
            ))}
          </ul>

          <button
            type="button"
            onClick={onViewAll}
            className="group/cta mt-8 inline-flex items-center gap-2.5 rounded-full bg-gradient-to-t from-pink-dark to-primary px-7 py-3.5 text-sm font-black text-white shadow-[0_14px_30px_-14px_hsl(var(--primary)/0.8)] transition-all duration-200 hover:from-primary hover:to-rose active:scale-[.98]"
          >
            <Wand2 size={17} />
            شاهد كل التصاميم
            <ArrowLeft
              size={16}
              className="transition-transform duration-300 group-hover/cta:-translate-x-1"
            />
          </button>
        </Reveal>

        {/* Cakes — snap rail on phones, 3-up grid from sm */}
        <Reveal className="reveal-grid flex snap-x gap-3 overflow-x-auto pb-2 scrollbar-none sm:grid sm:grid-cols-3 sm:gap-4 sm:overflow-visible sm:pb-0">
          {loading
            ? Array.from({ length: 3 }, (_, i) => (
                <div key={i} className="w-[62%] shrink-0 snap-start sm:w-auto">
                  <Skeleton className="aspect-[4/5] rounded-2xl" />
                  <Skeleton className="mt-3 h-5 w-3/4" />
                  <Skeleton className="mt-2 h-3 w-1/2" />
                </div>
              ))
            : shown.map(({ cake, previewUrl }) => (
                <div key={cake.id} className="w-[62%] shrink-0 snap-start sm:w-auto">
                  <CustomCakeCard cake={cake} previewUrl={previewUrl} onPick={() => onPick(cake.id)} />
                </div>
              ))}
        </Reveal>
      </div>
    </section>
  );
}
