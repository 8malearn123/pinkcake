import { useState } from 'react';
import { Plus, Check, Cake } from 'lucide-react';
import { RiyalSymbol } from '@/components/ui/riyal';
import { isSoldOut } from '@/hooks/usePublicStore';
import { FREE_DELIVERY_THRESHOLD } from '@/lib/delivery';
import type { StoreProduct } from '@/hooks/useCustomerStore';
import { cn } from '@/lib/utils';

interface BundleBandProps {
  products: StoreProduct[];
  onAddBundle: (members: StoreProduct[]) => void;
}

const BUNDLE_TITLES = ['ثنائي مثالي', 'باقة الضيافة', 'باقة الاحتفال'];

/**
 * "وفّر مع الباقات" — curated buy-together pairings from the REAL catalogue.
 * The price shown is the honest sum of the members' real prices (no invented
 * "was" price — there is no compare-at field). The only saving claimed is the
 * genuine free-delivery benefit of crossing the 200-﷼ threshold.
 */
export function BundleBand({ products, onAddBundle }: BundleBandProps) {
  const available = (products ?? []).filter((p) => !isSoldOut(p));

  // Pair distinct products, preferring different categories, up to 3 bundles.
  const bundles: StoreProduct[][] = [];
  const used = new Set<string>();
  for (let i = 0; i < available.length && bundles.length < 3; i++) {
    if (used.has(available[i].id)) continue;
    const partner =
      available.find((q) => q.id !== available[i].id && !used.has(q.id) && q.category !== available[i].category) ??
      available.find((q) => q.id !== available[i].id && !used.has(q.id));
    if (!partner) break;
    bundles.push([available[i], partner]);
    used.add(available[i].id);
    used.add(partner.id);
  }
  if (bundles.length === 0) return null;

  return (
    <section className="space-y-5">
      <div>
        <div className="text-xs text-primary tracking-widest uppercase font-medium">وفّر أكثر</div>
        <h2 className="font-display text-2xl md:text-3xl mt-1 leading-none">وفّر مع الباقات</h2>
        <p className="text-sm text-muted-foreground mt-2">
          اجمعي المفضّلات في طلبٍ واحد وتخطَّي حاجز <span className="text-foreground font-medium">200 <RiyalSymbol /></span> للتوصيل المجاني.
        </p>
      </div>
      <div className="grid gap-4 md:grid-cols-3">
        {bundles.map((members, i) => (
          <BundleCard key={i} title={BUNDLE_TITLES[i] ?? 'باقة مختارة'} members={members} onAdd={() => onAddBundle(members)} />
        ))}
      </div>
    </section>
  );
}

function BundleCard({ title, members, onAdd }: { title: string; members: StoreProduct[]; onAdd: () => void }) {
  const [added, setAdded] = useState(false);
  const sum = members.reduce((t, m) => t + m.price, 0);
  const free = sum >= FREE_DELIVERY_THRESHOLD;

  const handleAdd = () => {
    onAdd();
    setAdded(true);
    window.setTimeout(() => setAdded(false), 1300);
  };

  return (
    <div className="rounded-3xl bg-card border border-border/60 shadow-soft-lift p-4 flex flex-col">
      <div className="flex items-center justify-between gap-2">
        <span className="text-sm font-semibold">{title}</span>
        {free && (
          <span className="text-[10px] font-medium text-primary bg-primary/10 border border-primary/20 rounded-full px-2 py-0.5">
            توصيل مجاني
          </span>
        )}
      </div>

      {/* member thumbnails */}
      <div className="flex items-center gap-2 mt-3">
        {members.map((m, idx) => (
          <div key={m.id} className="flex items-center gap-2">
            {idx > 0 && <Plus className="w-3.5 h-3.5 text-muted-foreground shrink-0" />}
            <div className="w-14 h-14 rounded-2xl overflow-hidden bg-secondary grid place-items-center shrink-0">
              {m.image_url ? (
                <img src={m.image_url} alt={m.name} loading="lazy" className="w-full h-full object-cover" />
              ) : (
                <Cake className="w-6 h-6 text-muted-foreground" />
              )}
            </div>
          </div>
        ))}
      </div>

      <ul className="mt-3 space-y-1 text-xs text-muted-foreground">
        {members.map((m) => (
          <li key={m.id} className="line-clamp-1">• {m.name}</li>
        ))}
      </ul>

      <div className="mt-auto pt-4 flex items-end justify-between gap-2">
        <div>
          <div className="text-[10px] text-muted-foreground uppercase tracking-widest">سعر الباقة</div>
          <div className="font-display text-2xl text-primary leading-none mt-1">
            {sum} <RiyalSymbol className="text-base text-muted-foreground" />
          </div>
        </div>
        <button
          onClick={handleAdd}
          className={cn(
            'press rounded-full h-11 ps-4 pe-5 shrink-0 flex items-center gap-2 text-sm font-semibold transition-colors',
            added ? 'bg-primary text-primary-foreground' : 'bg-foreground text-background hover:bg-foreground/90'
          )}
        >
          {added ? <><Check className="w-4 h-4" /> تمت الإضافة</> : <><Plus className="w-4 h-4" /> أضِف الباقة</>}
        </button>
      </div>
    </div>
  );
}
