import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Search, Bell, MapPin, ChevronDown, Plus, Star, Sparkles } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import LozaShell from './LozaShell';
import { LOZA_CAKES, LOZA_VENDORS, LOZA_CATEGORIES } from '@/data/lozaCatalog';
import { useLozaCart } from '@/contexts/LozaCartContext';

const BANNERS = [
  {
    title: 'صمّم كيكتك',
    subtitle: 'بخمس خطوات بسيطة',
    cta: 'ابدأ الآن',
    href: '/loza/customize',
    bg: 'from-[hsl(var(--loza-gold))] to-[hsl(var(--loza-gold-dark))]',
    emoji: '🎂',
  },
  {
    title: 'هدية بلمسة',
    subtitle: 'أرسل كيكة برقم الجوال فقط 🎁',
    cta: 'جرّب الآن',
    href: '/loza/cart',
    bg: 'from-[hsl(var(--loza-brown))] to-[hsl(var(--loza-brown-soft))]',
    emoji: '🎁',
  },
  {
    title: 'توصيل مجاني',
    subtitle: 'لطلباتك أكثر من 200 ر.س',
    cta: 'تسوّق الآن',
    href: '/loza',
    bg: 'from-[hsl(var(--loza-gold-dark))] to-[hsl(var(--loza-brown))]',
    emoji: '🚚',
  },
];

export default function LozaHome() {
  const [activeCat, setActiveCat] = useState('all');
  const [bannerIdx, setBannerIdx] = useState(0);
  const { add, defaultCity } = useLozaCart();

  useEffect(() => {
    const t = setInterval(() => setBannerIdx((i) => (i + 1) % BANNERS.length), 5000);
    return () => clearInterval(t);
  }, []);

  const filtered = activeCat === 'all'
    ? LOZA_CAKES
    : LOZA_CAKES.filter((c) => c.category.includes(LOZA_CATEGORIES.find((x) => x.id === activeCat)?.name || ''));

  return (
    <LozaShell>
      {/* Header */}
      <header className="bg-background sticky top-0 z-30 border-b border-border/60">
        <div className="container mx-auto max-w-2xl px-4 py-3 flex items-center justify-between gap-3">
          <Link to="/loza" className="flex items-center gap-2">
            <div className="w-10 h-10 rounded-2xl gradient-loza-gold flex items-center justify-center shadow-loza">
              <span className="font-loza-display text-xl text-[hsl(var(--loza-brown))]">ل</span>
            </div>
            <div>
              <div className="font-bold text-base leading-none">لوزا</div>
              <div className="text-[10px] text-muted-foreground tracking-wider">LOZA</div>
            </div>
          </Link>
          <button className="flex items-center gap-1 text-sm font-medium hover:text-primary transition-colors">
            <MapPin className="w-4 h-4 text-primary" />
            {defaultCity}
            <ChevronDown className="w-3 h-3 opacity-60" />
          </button>
          <div className="flex items-center gap-1">
            <Link to="/loza/search">
              <Button variant="ghost" size="icon" className="rounded-full">
                <Search className="w-5 h-5" />
              </Button>
            </Link>
            <Button variant="ghost" size="icon" className="rounded-full relative">
              <Bell className="w-5 h-5" />
              <span className="absolute top-1.5 end-1.5 w-2 h-2 rounded-full bg-destructive" />
            </Button>
          </div>
        </div>
      </header>

      <main className="container mx-auto max-w-2xl px-4 py-4 space-y-6">
        {/* Search bar */}
        <Link to="/loza/search" className="block">
          <div className="bg-card rounded-full shadow-loza border border-border/40 px-4 py-3 flex items-center gap-2 text-sm text-muted-foreground">
            <Search className="w-4 h-4" />
            ابحث عن كيكة، نكهة، أو متجر...
          </div>
        </Link>

        {/* Banner */}
        <section>
          <div className="relative rounded-3xl overflow-hidden h-44 shadow-loza">
            {BANNERS.map((b, i) => (
              <Link
                key={i}
                to={b.href}
                className={cn(
                  'absolute inset-0 bg-gradient-to-tl flex flex-col justify-center p-6 transition-opacity duration-700',
                  b.bg,
                  i === bannerIdx ? 'opacity-100' : 'opacity-0 pointer-events-none'
                )}
              >
                <div className="absolute -end-6 -bottom-6 text-[120px] opacity-20 select-none">{b.emoji}</div>
                <Sparkles className="w-5 h-5 text-white/80 mb-2" />
                <h2 className="text-2xl font-bold text-white font-loza-display">{b.title}</h2>
                <p className="text-white/90 text-sm mt-1">{b.subtitle}</p>
                <span className="mt-3 inline-flex items-center gap-1 px-4 py-1.5 rounded-full bg-white/95 text-[hsl(var(--loza-brown))] text-xs font-bold w-fit">
                  {b.cta} ←
                </span>
              </Link>
            ))}
            <div className="absolute bottom-3 start-1/2 translate-x-1/2 flex gap-1.5">
              {BANNERS.map((_, i) => (
                <button
                  key={i}
                  onClick={(e) => { e.preventDefault(); setBannerIdx(i); }}
                  className={cn(
                    'h-1.5 rounded-full transition-all',
                    i === bannerIdx ? 'w-6 bg-white' : 'w-1.5 bg-white/50'
                  )}
                />
              ))}
            </div>
          </div>
        </section>

        {/* Categories */}
        <section>
          <div className="flex gap-2 overflow-x-auto pb-1 -mx-1 px-1 scrollbar-none">
            {LOZA_CATEGORIES.map((c) => {
              const active = c.id === activeCat;
              return (
                <button
                  key={c.id}
                  onClick={() => setActiveCat(c.id)}
                  className={cn(
                    'shrink-0 px-4 py-2 rounded-full text-sm font-medium border-2 transition-all',
                    active
                      ? 'gradient-loza-gold text-[hsl(var(--loza-brown))] border-transparent shadow-loza'
                      : 'bg-card border-border text-foreground/80 hover:border-primary/50'
                  )}
                >
                  {c.emoji} {c.name}
                </button>
              );
            })}
          </div>
        </section>

        {/* Cakes */}
        <section>
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-lg font-bold font-loza-display">الأكثر طلباً</h3>
            <Link to="/loza/search" className="text-xs text-primary font-medium">عرض الكل ←</Link>
          </div>

          <div className="grid grid-cols-2 gap-3">
            {filtered.map((cake) => (
              <article
                key={cake.id}
                className="group bg-card rounded-3xl shadow-loza hover:shadow-loza-lift transition-all hover:-translate-y-1 overflow-hidden border border-border/40"
              >
                <Link to={`/loza/cake/${cake.id}`} className="block">
                  <div className="relative h-32 bg-gradient-to-br from-[hsl(var(--loza-gold-light))] to-[hsl(var(--loza-cream))] flex items-center justify-center">
                    <span className="text-6xl drop-shadow-md group-hover:scale-110 transition-transform duration-500">
                      {cake.emoji}
                    </span>
                    {cake.tag && (
                      <span className="absolute top-2 start-2 text-[10px] font-bold gradient-loza-gold text-[hsl(var(--loza-brown))] px-2 py-0.5 rounded-full">
                        ★ {cake.tag}
                      </span>
                    )}
                    <span className="absolute bottom-2 end-2 bg-[hsl(var(--loza-brown))]/90 text-white text-[11px] font-bold px-2 py-1 rounded-full">
                      {cake.price} ر.س
                    </span>
                  </div>
                </Link>
                <div className="p-3">
                  <Link to={`/loza/vendor/${cake.vendorId}`} className="text-[10px] text-muted-foreground truncate hover:text-primary block">
                    🏪 {cake.vendor}
                  </Link>
                  <Link to={`/loza/cake/${cake.id}`}>
                    <h4 className="font-bold text-sm mt-0.5 leading-tight line-clamp-2 min-h-[34px]">
                      {cake.name}
                    </h4>
                  </Link>
                  <div className="flex items-center justify-between mt-2">
                    <div className="flex items-center gap-1 text-[11px]">
                      <Star className="w-3 h-3 fill-primary text-primary" />
                      <span className="font-bold">{cake.rating}</span>
                      <span className="text-muted-foreground">({cake.reviews})</span>
                    </div>
                    <button
                      onClick={() => add({
                        productId: cake.id,
                        name: cake.name,
                        vendor: cake.vendor,
                        emoji: cake.emoji,
                        unitPrice: cake.price,
                        quantity: 1,
                      })}
                      className="w-7 h-7 rounded-full gradient-loza-gold flex items-center justify-center hover:scale-110 transition-transform"
                    >
                      <Plus className="w-4 h-4 text-[hsl(var(--loza-brown))]" strokeWidth={3} />
                    </button>
                  </div>
                </div>
              </article>
            ))}
          </div>
        </section>

        {/* Vendors */}
        <section>
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-lg font-bold font-loza-display">متاجر قريبة منك</h3>
            <button className="text-xs text-primary font-medium">عرض الكل ←</button>
          </div>
          <div className="flex gap-3 overflow-x-auto -mx-1 px-1 pb-2 scrollbar-none">
            {LOZA_VENDORS.map((v) => (
              <Link
                to={`/loza/vendor/${v.id}`}
                key={v.id}
                className="shrink-0 w-44 bg-card rounded-2xl shadow-loza p-3 border border-border/40 hover:shadow-loza-lift transition-all"
              >
                <div className={cn('h-20 rounded-xl flex items-center justify-center text-4xl bg-gradient-to-br', v.cover)}>
                  {v.emoji}
                </div>
                <div className="mt-2">
                  <h4 className="font-bold text-sm">{v.name}</h4>
                  <div className="flex items-center justify-between text-[11px] mt-1">
                    <span className="text-muted-foreground">📍 {v.distance}</span>
                    <span className="flex items-center gap-0.5">
                      <Star className="w-3 h-3 fill-primary text-primary" />
                      {v.rating}
                    </span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </section>

        {/* Customize CTA */}
        <Link
          to="/loza/customize"
          className="block rounded-3xl overflow-hidden shadow-loza-lift gradient-loza-header p-6 text-white relative"
        >
          <div className="absolute -start-4 -bottom-4 text-[110px] opacity-15">✨</div>
          <h3 className="text-xl font-bold font-loza-display">صمّم كيكتك بنفسك</h3>
          <p className="text-white/80 text-sm mt-1">شكل، نكهة، لون، تصميم، وكتابة — بخمس خطوات</p>
          <span className="mt-3 inline-flex items-center gap-1 px-4 py-2 rounded-full bg-primary text-[hsl(var(--loza-brown))] text-sm font-bold">
            ابدأ التصميم ←
          </span>
        </Link>
      </main>
    </LozaShell>
  );
}
