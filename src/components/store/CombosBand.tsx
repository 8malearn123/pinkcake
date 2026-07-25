import { useState } from 'react';
import { Gift, Truck, Plus, Check, Cake } from 'lucide-react';
import { RiyalSymbol } from '@/components/ui/riyal';
import { isSoldOut } from '@/hooks/usePublicStore';
import { resolveCombos, type ResolvedCombo } from '@/lib/combos';
import { FREE_DELIVERY_THRESHOLD } from '@/lib/delivery';
import type { StoreProduct } from '@/hooks/useCustomerStore';
import { cn } from '@/lib/utils';

interface CombosBandProps {
  products: StoreProduct[] | undefined;
  onAddCombo: (members: StoreProduct[], name: string) => void;
}

// "اجمعيها بذكاء، ووفّري أكثر" — curated buy-together combos at an honest summed
// original vs. our real bundle price. Rose tokens, logical utilities.
export function CombosBand({ products, onAddCombo }: CombosBandProps) {
  const combos = resolveCombos(products, isSoldOut);
  if (combos.length === 0) return null;

  return (
    <section id="combos" className="space-y-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div className="max-w-xl">
          <span className="inline-flex w-fit items-center gap-2 rounded-full gradient-cocoa px-4 py-1.5 text-xs font-bold text-white">
            <Truck className="w-3.5 h-3.5 text-primary" /> توصيلها كلها علينا 🎁
          </span>
          <h2 className="font-display mt-4 text-3xl sm:text-4xl leading-tight text-foreground">
            اجمعيها بذكاء، <span className="text-primary">ووفّري أكثر.</span>
          </h2>
        </div>
        <p className="max-w-sm text-sm leading-7 text-muted-foreground">
          توليفاتٌ جاهزة اخترناها لكِ — كل باقةٍ تتجاوز <span className="font-semibold text-foreground">200 <RiyalSymbol /></span> فتحصلين على توصيلٍ مجاني تلقائياً.
        </p>
      </div>

      <div className="grid gap-5 md:grid-cols-3">
        {combos.map((c) => (
          <ComboCard key={c.id} combo={c} onAdd={() => onAddCombo(c.members, c.name)} />
        ))}
      </div>
    </section>
  );
}

function ComboCard({ combo, onAdd }: { combo: ResolvedCombo; onAdd: () => void }) {
  const [added, setAdded] = useState(false);
  const free = combo.price >= FREE_DELIVERY_THRESHOLD;
  const pct = combo.original > 0 ? Math.round((combo.save / combo.original) * 100) : 0;

  const handleAdd = () => {
    onAdd();
    setAdded(true);
    window.setTimeout(() => setAdded(false), 1300);
  };

  return (
    <article className="flex flex-col rounded-xl bg-card border border-border/60 shadow-soft-lift p-5">
      <div className="flex items-center justify-between gap-2">
        <span className="text-[11px] font-bold tracking-[.1em] text-primary">{combo.tagline}</span>
        {pct > 0 && (
          <span className="rounded-full bg-primary/10 text-primary border border-primary/20 px-2 py-0.5 text-[10px] font-bold">
            وفّري {pct}٪
          </span>
        )}
      </div>
      <h3 className="font-display text-xl mt-1 leading-tight text-foreground">{combo.name}</h3>

      {/* member thumbnails */}
      <div className="mt-4 flex items-center">
        {combo.members.map((m, i) => (
          <div
            key={m.id}
            className={cn('h-14 w-14 rounded-full overflow-hidden bg-secondary grid place-items-center ring-2 ring-card', i > 0 && '-ms-3')}
            title={m.name}
          >
            {m.image_url ? (
              <img src={m.image_url} alt={m.name} loading="lazy" className="w-full h-full object-cover" />
            ) : (
              <Cake className="w-5 h-5 text-muted-foreground" />
            )}
          </div>
        ))}
        <span className="ms-3 text-xs text-muted-foreground">{combo.members.length} أصناف</span>
      </div>

      <div className="mt-auto pt-5 flex items-end justify-between gap-3">
        <div>
          <p className="flex items-center gap-1 text-[11px] font-bold text-success">
            <Truck className="w-3 h-3" /> {free ? 'توصيل مجاني' : 'باقة موفّرة'}
          </p>
          <div className="mt-1 flex items-baseline gap-2">
            <span className="font-display text-2xl text-primary leading-none">{combo.price} <RiyalSymbol className="text-base text-muted-foreground" /></span>
            {combo.save > 0 && <span className="text-xs text-muted-foreground line-through">{combo.original}</span>}
          </div>
        </div>
        <button
          onClick={handleAdd}
          aria-label={`أضف ${combo.name} إلى السلة`}
          className={cn(
            'press inline-flex items-center gap-1.5 rounded-md h-11 ps-4 pe-5 shrink-0 text-sm font-bold transition-colors',
            added ? 'bg-primary text-primary-foreground' : 'bg-gold text-primary hover:brightness-105'
          )}
        >
          {added ? <><Check className="w-4 h-4" /> تمت</> : <><Gift className="w-4 h-4" /> أضِف الباقة</>}
        </button>
      </div>
    </article>
  );
}
