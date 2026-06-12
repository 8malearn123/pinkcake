import { Link } from 'react-router-dom';
import { ArrowRight, Heart, Star } from 'lucide-react';
import LozaShell from './LozaShell';
import { useLozaCart } from '@/contexts/LozaCartContext';
import { LOZA_CAKES } from '@/data/lozaCatalog';

export default function LozaWishlist() {
  const { wishlist, toggleWish } = useLozaCart();
  const items = LOZA_CAKES.filter((c) => wishlist.includes(c.id));

  return (
    <LozaShell>
      <header className="bg-background sticky top-0 z-30 border-b border-border/60">
        <div className="container mx-auto max-w-2xl px-4 py-3 flex items-center gap-3">
          <Link to="/loza/profile" className="w-10 h-10 rounded-full bg-card border border-border flex items-center justify-center">
            <ArrowRight className="w-5 h-5" />
          </Link>
          <h1 className="text-lg font-bold font-loza-display">المفضلة</h1>
        </div>
      </header>

      <main className="container mx-auto max-w-2xl px-4 py-4">
        {items.length === 0 ? (
          <div className="text-center py-20">
            <div className="w-24 h-24 mx-auto rounded-3xl bg-gradient-to-br from-[hsl(var(--loza-gold-light))] to-[hsl(var(--loza-cream))] flex items-center justify-center text-5xl mb-5">
              ❤️
            </div>
            <h2 className="text-xl font-bold font-loza-display">لا توجد مفضلة</h2>
            <p className="text-muted-foreground text-sm mt-1">اضغط ❤️ على أي كيكة لإضافتها هنا</p>
            <Link to="/loza" className="inline-block mt-5 px-6 py-2.5 rounded-full gradient-loza-gold text-[hsl(var(--loza-brown))] font-bold text-sm">
              تصفح الكيكات
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-3">
            {items.map((c) => (
              <article key={c.id} className="group bg-card rounded-3xl shadow-loza overflow-hidden border border-border/40 relative">
                <button
                  onClick={() => toggleWish(c.id)}
                  className="absolute top-2 end-2 z-10 w-8 h-8 rounded-full bg-white/95 flex items-center justify-center shadow-loza"
                >
                  <Heart className="w-4 h-4 fill-destructive text-destructive" />
                </button>
                <Link to={`/loza/cake/${c.id}`}>
                  <div className="h-28 bg-gradient-to-br from-[hsl(var(--loza-gold-light))] to-[hsl(var(--loza-cream))] flex items-center justify-center">
                    <span className="text-5xl group-hover:scale-110 transition-transform">{c.emoji}</span>
                  </div>
                  <div className="p-3">
                    <h4 className="font-bold text-sm line-clamp-2">{c.name}</h4>
                    <div className="flex items-center justify-between mt-2">
                      <span className="text-primary font-extrabold text-sm">{c.price} ر.س</span>
                      <span className="text-[10px] flex items-center gap-0.5">
                        <Star className="w-3 h-3 fill-primary text-primary" /> {c.rating}
                      </span>
                    </div>
                  </div>
                </Link>
              </article>
            ))}
          </div>
        )}
      </main>
    </LozaShell>
  );
}
