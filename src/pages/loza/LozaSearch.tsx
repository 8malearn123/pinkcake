import { useState, useMemo } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { Search, ArrowRight, X, Star, TrendingUp } from 'lucide-react';
import LozaShell from './LozaShell';
import { LOZA_CAKES, LOZA_CATEGORIES } from '@/data/lozaCatalog';
import { cn } from '@/lib/utils';

const TRENDING = ['زعفران', 'تشيز كيك', 'فستق', 'شوكولاتة', 'كاب كيك ورود'];

export default function LozaSearch() {
  const [params] = useSearchParams();
  const [q, setQ] = useState(params.get('q') || '');
  const [cat, setCat] = useState('all');

  const results = useMemo(() => {
    const text = q.trim().toLowerCase();
    return LOZA_CAKES.filter((c) => {
      if (cat !== 'all' && !c.category.toLowerCase().includes(LOZA_CATEGORIES.find((x) => x.id === cat)?.name.toLowerCase() || '')) return false;
      if (!text) return true;
      return (
        c.name.toLowerCase().includes(text) ||
        c.vendor.toLowerCase().includes(text) ||
        c.flavors.some((f) => f.toLowerCase().includes(text))
      );
    });
  }, [q, cat]);

  return (
    <LozaShell>
      <header className="bg-background sticky top-0 z-30 border-b border-border/60">
        <div className="container mx-auto max-w-2xl px-4 py-3 flex items-center gap-2">
          <Link to="/loza" className="w-10 h-10 rounded-full bg-card border border-border flex items-center justify-center shrink-0">
            <ArrowRight className="w-5 h-5" />
          </Link>
          <div className="flex-1 relative">
            <Search className="absolute start-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input
              autoFocus
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="ابحث عن كيكة، نكهة، أو متجر..."
              className="w-full ps-10 pe-10 py-2.5 rounded-full border border-border bg-card text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
            />
            {q && (
              <button onClick={() => setQ('')} className="absolute end-3 top-1/2 -translate-y-1/2">
                <X className="w-4 h-4 text-muted-foreground" />
              </button>
            )}
          </div>
        </div>
        {/* Categories */}
        <div className="container mx-auto max-w-2xl px-4 pb-3 overflow-x-auto scrollbar-none">
          <div className="flex gap-2">
            {LOZA_CATEGORIES.map((c) => {
              const active = c.id === cat;
              return (
                <button
                  key={c.id}
                  onClick={() => setCat(c.id)}
                  className={cn(
                    'shrink-0 px-3 py-1 rounded-full text-xs font-medium border transition-all',
                    active ? 'gradient-loza-gold text-[hsl(var(--loza-brown))] border-transparent' : 'bg-card border-border'
                  )}
                >
                  {c.emoji} {c.name}
                </button>
              );
            })}
          </div>
        </div>
      </header>

      <main className="container mx-auto max-w-2xl px-4 py-4">
        {!q.trim() && (
          <section className="mb-5">
            <h3 className="text-sm font-bold mb-3 flex items-center gap-1">
              <TrendingUp className="w-4 h-4 text-primary" /> الأكثر بحثاً
            </h3>
            <div className="flex flex-wrap gap-2">
              {TRENDING.map((t) => (
                <button
                  key={t}
                  onClick={() => setQ(t)}
                  className="px-3 py-1.5 rounded-full bg-card border border-border text-xs hover:border-primary"
                >
                  {t}
                </button>
              ))}
            </div>
          </section>
        )}

        {results.length === 0 ? (
          <div className="text-center py-16">
            <div className="text-6xl mb-3">🔍</div>
            <p className="text-muted-foreground text-sm">لا توجد نتائج لـ "{q}"</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-3">
            {results.map((c) => (
              <Link
                key={c.id}
                to={`/loza/cake/${c.id}`}
                className="group bg-card rounded-3xl shadow-loza hover:shadow-loza-lift hover:-translate-y-1 transition-all overflow-hidden border border-border/40"
              >
                <div className="relative h-28 bg-gradient-to-br from-[hsl(var(--loza-gold-light))] to-[hsl(var(--loza-cream))] flex items-center justify-center">
                  <span className="text-5xl group-hover:scale-110 transition-transform">{c.emoji}</span>
                  <span className="absolute bottom-2 end-2 bg-[hsl(var(--loza-brown))]/90 text-white text-[10px] font-bold px-2 py-0.5 rounded-full">
                    {c.price} ر.س
                  </span>
                </div>
                <div className="p-3">
                  <div className="text-[10px] text-muted-foreground truncate">🏪 {c.vendor}</div>
                  <h4 className="font-bold text-sm leading-tight line-clamp-2 mt-0.5">{c.name}</h4>
                  <div className="flex items-center gap-1 mt-1.5 text-[10px]">
                    <Star className="w-3 h-3 fill-primary text-primary" />
                    <span className="font-bold">{c.rating}</span>
                    <span className="text-muted-foreground">({c.reviews})</span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </main>
    </LozaShell>
  );
}
