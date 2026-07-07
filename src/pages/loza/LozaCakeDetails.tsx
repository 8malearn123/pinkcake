import { useMemo, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  ArrowRight, Star, Heart, Clock, Users, Sparkles, Plus, Minus, ShoppingBag, Share2, MapPin,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import LozaShell from './LozaShell';
import { findCake, findVendor } from '@/data/lozaCatalog';
import { useLozaCart } from '@/contexts/LozaCartContext';
import { Button } from '@/components/ui/button';
import { RiyalSymbol } from '@/components/ui/riyal';

export default function LozaCakeDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const cake = id ? findCake(id) : undefined;
  const vendor = cake ? findVendor(cake.vendorId) : undefined;
  const { add, wishlist, toggleWish } = useLozaCart();

  const [sizeId, setSizeId] = useState(cake?.sizes[0]?.id || '');
  const [qty, setQty] = useState(1);
  const [notes, setNotes] = useState('');

  const size = useMemo(() => cake?.sizes.find((s) => s.id === sizeId) || cake?.sizes[0], [cake, sizeId]);
  const unitPrice = size?.price || cake?.price || 0;
  const total = unitPrice * qty;

  if (!cake) {
    return (
      <LozaShell>
        <div className="container mx-auto max-w-2xl px-4 py-20 text-center">
          <h1 className="text-xl font-bold mb-3">لم نجد هذا المنتج</h1>
          <Link to="/loza" className="text-primary font-medium">العودة للرئيسية ←</Link>
        </div>
      </LozaShell>
    );
  }

  const isWished = wishlist.includes(cake.id);

  return (
    <LozaShell>
      {/* Hero */}
      <section className="relative h-80 bg-gradient-to-br from-[hsl(var(--loza-gold-light))] via-[hsl(var(--loza-cream))] to-[hsl(var(--loza-gold))]/40 overflow-hidden">
        <button
          onClick={() => navigate(-1)}
          className="absolute top-4 start-4 z-10 w-10 h-10 rounded-full bg-white/95 shadow-loza flex items-center justify-center"
        >
          <ArrowRight className="w-5 h-5" />
        </button>
        <div className="absolute top-4 end-4 z-10 flex gap-2">
          <button
            onClick={() => toggleWish(cake.id)}
            className="w-10 h-10 rounded-full bg-white/95 shadow-loza flex items-center justify-center"
          >
            <Heart className={cn('w-5 h-5', isWished ? 'fill-destructive text-destructive' : '')} />
          </button>
          <button className="w-10 h-10 rounded-full bg-white/95 shadow-loza flex items-center justify-center">
            <Share2 className="w-5 h-5" />
          </button>
        </div>
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="text-[180px] drop-shadow-2xl animate-float">{cake.emoji}</span>
        </div>
        {cake.tag && (
          <span className="absolute bottom-4 start-4 gradient-loza-gold text-[hsl(var(--loza-brown))] text-xs font-bold px-3 py-1 rounded-full shadow-loza">
            ★ {cake.tag}
          </span>
        )}
      </section>

      <main className="container mx-auto max-w-2xl px-4 -mt-6 relative z-10 pb-32">
        <div className="bg-card rounded-3xl shadow-loza-lift p-5 border border-border/40">
          {/* Title */}
          <div className="flex items-start justify-between gap-3">
            <div className="flex-1">
              <h1 className="text-2xl font-bold font-loza-display">{cake.name}</h1>
              <Link to={`/loza/vendor/${cake.vendorId}`} className="inline-flex items-center gap-1 text-xs text-muted-foreground mt-1 hover:text-primary">
                🏪 {cake.vendor}
              </Link>
            </div>
            <div className="text-end">
              <div className="text-2xl font-extrabold text-gradient-loza">{unitPrice} <RiyalSymbol /></div>
              <div className="text-[10px] text-muted-foreground">للحبة</div>
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-3 gap-2 mt-4">
            <div className="bg-muted/40 rounded-2xl p-3 text-center">
              <Star className="w-4 h-4 mx-auto fill-primary text-primary" />
              <div className="text-sm font-bold mt-1">{cake.rating}</div>
              <div className="text-[10px] text-muted-foreground">{cake.reviews} تقييم</div>
            </div>
            <div className="bg-muted/40 rounded-2xl p-3 text-center">
              <Users className="w-4 h-4 mx-auto text-primary" />
              <div className="text-sm font-bold mt-1">{cake.servings.split(' ')[0]}</div>
              <div className="text-[10px] text-muted-foreground">أشخاص</div>
            </div>
            <div className="bg-muted/40 rounded-2xl p-3 text-center">
              <Clock className="w-4 h-4 mx-auto text-primary" />
              <div className="text-sm font-bold mt-1">{cake.prepTime.split(' ')[0]}</div>
              <div className="text-[10px] text-muted-foreground">ساعة تجهيز</div>
            </div>
          </div>

          {/* Description */}
          <p className="text-sm text-foreground/80 leading-relaxed mt-4">{cake.description}</p>

          {/* Flavors */}
          <div className="mt-5">
            <h3 className="text-sm font-bold mb-2 flex items-center gap-1">
              <Sparkles className="w-4 h-4 text-primary" /> النكهات
            </h3>
            <div className="flex flex-wrap gap-2">
              {cake.flavors.map((f) => (
                <span key={f} className="px-3 py-1 rounded-full bg-[hsl(var(--loza-gold-light))]/50 text-[hsl(var(--loza-brown))] text-xs font-medium border border-[hsl(var(--loza-gold))]/40">
                  {f}
                </span>
              ))}
            </div>
          </div>

          {/* Sizes */}
          <div className="mt-5">
            <h3 className="text-sm font-bold mb-2">اختر الحجم</h3>
            <div className="grid grid-cols-3 gap-2">
              {cake.sizes.map((s) => {
                const active = s.id === sizeId;
                return (
                  <button
                    key={s.id}
                    onClick={() => setSizeId(s.id)}
                    className={cn(
                      'rounded-2xl p-3 text-center border-2 transition-all',
                      active
                        ? 'gradient-loza-gold text-[hsl(var(--loza-brown))] border-transparent shadow-loza'
                        : 'bg-card border-border hover:border-primary/40'
                    )}
                  >
                    <div className="text-xs font-bold">{s.name}</div>
                    <div className="text-[11px] mt-0.5 opacity-90">{s.price} <RiyalSymbol /></div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Ingredients */}
          <div className="mt-5">
            <h3 className="text-sm font-bold mb-2">المكونات</h3>
            <div className="flex flex-wrap gap-1.5">
              {cake.ingredients.map((i) => (
                <span key={i} className="text-[11px] px-2.5 py-1 rounded-full bg-muted text-muted-foreground">
                  • {i}
                </span>
              ))}
            </div>
          </div>

          {/* Notes */}
          <div className="mt-5">
            <label className="text-sm font-bold block mb-2">ملاحظات للشيف (اختياري)</label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="مثال: قليل السكر، اكتب اسم سارة..."
              className="w-full rounded-2xl border border-border bg-background p-3 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-primary/30"
              rows={3}
            />
          </div>

          {/* Quantity */}
          <div className="mt-5 flex items-center justify-between">
            <span className="text-sm font-bold">الكمية</span>
            <div className="flex items-center gap-2 bg-muted/40 rounded-full p-1">
              <button onClick={() => setQty((q) => Math.max(1, q - 1))} className="w-8 h-8 rounded-full bg-card flex items-center justify-center shadow-sm">
                <Minus className="w-4 h-4" />
              </button>
              <span className="font-bold w-8 text-center">{qty}</span>
              <button onClick={() => setQty((q) => q + 1)} className="w-8 h-8 rounded-full gradient-loza-gold flex items-center justify-center">
                <Plus className="w-4 h-4 text-[hsl(var(--loza-brown))]" />
              </button>
            </div>
          </div>
        </div>

        {/* Vendor card */}
        {vendor && (
          <Link to={`/loza/vendor/${vendor.id}`} className="block mt-4 bg-card rounded-3xl shadow-loza p-4 border border-border/40">
            <div className="flex items-center gap-3">
              <div className={cn('w-14 h-14 rounded-2xl flex items-center justify-center text-3xl bg-gradient-to-br', vendor.cover)}>
                {vendor.emoji}
              </div>
              <div className="flex-1">
                <div className="font-bold">{vendor.name}</div>
                <div className="text-[11px] text-muted-foreground flex items-center gap-2 mt-0.5">
                  <span className="flex items-center gap-0.5"><Star className="w-3 h-3 fill-primary text-primary" /> {vendor.rating}</span>
                  <span className="flex items-center gap-0.5"><MapPin className="w-3 h-3" /> {vendor.distance}</span>
                </div>
              </div>
              <span className="text-xs text-primary font-bold">زيارة المتجر ←</span>
            </div>
          </Link>
        )}
      </main>

      {/* Sticky bottom */}
      <div className="fixed bottom-16 inset-x-0 z-40 bg-card/95 backdrop-blur-md border-t border-border shadow-loza-lift">
        <div className="container mx-auto max-w-2xl px-4 py-3 flex items-center gap-3">
          <div className="flex-1">
            <div className="text-[10px] text-muted-foreground">الإجمالي</div>
            <div className="font-extrabold text-gradient-loza text-lg leading-tight">{total} <RiyalSymbol /></div>
          </div>
          <Button
            onClick={() => {
              add({
                productId: cake.id,
                name: `${cake.name} • ${size?.name}`,
                vendor: cake.vendor,
                emoji: cake.emoji,
                unitPrice,
                quantity: qty,
                notes: notes.trim() || undefined,
              });
            }}
            className="rounded-full gradient-loza-gold text-[hsl(var(--loza-brown))] border-0 font-bold px-6 hover:opacity-90"
          >
            <ShoppingBag className="w-4 h-4 me-1" />
            أضف للسلة
          </Button>
        </div>
      </div>
    </LozaShell>
  );
}
