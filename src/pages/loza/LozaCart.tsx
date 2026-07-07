import { Link, useNavigate } from 'react-router-dom';
import { ArrowRight, Trash2, Plus, Minus, ShoppingBag, Sparkles, Tag } from 'lucide-react';
import LozaShell from './LozaShell';
import { useLozaCart } from '@/contexts/LozaCartContext';
import { Button } from '@/components/ui/button';
import { useState, type ReactNode } from 'react';
import { toast } from '@/hooks/use-toast';
import { RiyalSymbol } from '@/components/ui/riyal';

export default function LozaCart() {
  const { items, updateQty, remove, subtotal, count } = useLozaCart();
  const navigate = useNavigate();
  const [promo, setPromo] = useState('');
  const [discount, setDiscount] = useState(0);

  const delivery = subtotal > 0 ? (subtotal >= 200 ? 0 : 25) : 0;
  const total = Math.max(0, subtotal - discount + delivery);

  const applyPromo = () => {
    if (promo.trim().toUpperCase() === 'LOZA10') {
      setDiscount(Math.round(subtotal * 0.1));
      toast({ title: 'تم تطبيق الخصم 🎉', description: 'خصم 10% على إجمالي السلة' });
    } else {
      setDiscount(0);
      toast({ title: 'كود غير صحيح', variant: 'destructive' });
    }
  };

  return (
    <LozaShell>
      <header className="bg-background sticky top-0 z-30 border-b border-border/60">
        <div className="container mx-auto max-w-2xl px-4 py-3 flex items-center gap-3">
          <button onClick={() => navigate(-1)} className="w-10 h-10 rounded-full bg-card border border-border flex items-center justify-center">
            <ArrowRight className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-lg font-bold font-loza-display">السلة</h1>
            <p className="text-[11px] text-muted-foreground">{count} منتج</p>
          </div>
        </div>
      </header>

      <main className="container mx-auto max-w-2xl px-4 py-4 pb-40">
        {items.length === 0 ? (
          <div className="text-center py-20">
            <div className="w-24 h-24 mx-auto rounded-3xl bg-gradient-to-br from-[hsl(var(--loza-gold-light))] to-[hsl(var(--loza-cream))] flex items-center justify-center text-5xl mb-5">
              🛒
            </div>
            <h2 className="text-xl font-bold font-loza-display">السلة فاضية</h2>
            <p className="text-muted-foreground text-sm mt-1">تصفح أحلى الكيكات وأضف المفضل لديك</p>
            <Link to="/loza" className="inline-block mt-5 px-6 py-2.5 rounded-full gradient-loza-gold text-[hsl(var(--loza-brown))] font-bold text-sm">
              تسوّق الآن
            </Link>
          </div>
        ) : (
          <>
            <div className="space-y-3">
              {items.map((item) => (
                <article key={item.id} className="bg-card rounded-3xl shadow-loza p-3 border border-border/40 flex gap-3">
                  <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-[hsl(var(--loza-gold-light))] to-[hsl(var(--loza-cream))] flex items-center justify-center text-4xl shrink-0">
                    {item.isCustom ? '✨' : item.emoji || '🎂'}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <h3 className="font-bold text-sm leading-tight line-clamp-2">{item.name}</h3>
                        <div className="text-[10px] text-muted-foreground mt-0.5">🏪 {item.vendor}</div>
                        {item.isCustom && (
                          <span className="inline-flex items-center gap-1 mt-1 text-[10px] gradient-loza-gold text-[hsl(var(--loza-brown))] px-2 py-0.5 rounded-full font-bold">
                            <Sparkles className="w-2.5 h-2.5" /> تصميم خاص
                          </span>
                        )}
                        {item.notes && (
                          <p className="text-[10px] text-muted-foreground mt-1 line-clamp-1">📝 {item.notes}</p>
                        )}
                      </div>
                      <button onClick={() => remove(item.id)} className="text-muted-foreground hover:text-destructive p-1">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                    <div className="flex items-center justify-between mt-2">
                      <div className="flex items-center gap-1 bg-muted/40 rounded-full p-0.5">
                        <button onClick={() => updateQty(item.id, item.quantity - 1)} className="w-7 h-7 rounded-full bg-card flex items-center justify-center shadow-sm">
                          <Minus className="w-3 h-3" />
                        </button>
                        <span className="font-bold w-7 text-center text-sm">{item.quantity}</span>
                        <button onClick={() => updateQty(item.id, item.quantity + 1)} className="w-7 h-7 rounded-full gradient-loza-gold flex items-center justify-center">
                          <Plus className="w-3 h-3 text-[hsl(var(--loza-brown))]" />
                        </button>
                      </div>
                      <div className="font-extrabold text-gradient-loza">{item.unitPrice * item.quantity} <RiyalSymbol /></div>
                    </div>
                  </div>
                </article>
              ))}
            </div>

            {/* Promo */}
            <div className="mt-4 bg-card rounded-3xl shadow-loza p-3 border border-border/40 flex items-center gap-2">
              <Tag className="w-5 h-5 text-primary shrink-0" />
              <input
                value={promo}
                onChange={(e) => setPromo(e.target.value)}
                placeholder="كود الخصم (جرّب LOZA10)"
                className="flex-1 bg-transparent text-sm focus:outline-none"
              />
              <Button onClick={applyPromo} variant="outline" className="rounded-full text-xs h-8">
                تطبيق
              </Button>
            </div>

            {/* Summary */}
            <div className="mt-4 bg-card rounded-3xl shadow-loza p-4 border border-border/40 text-sm space-y-2">
              <Row label="المجموع الفرعي" value={<>{subtotal} <RiyalSymbol /></>} />
              {discount > 0 && <Row label="الخصم" value={<>- {discount} <RiyalSymbol /></>} accent />}
              <Row label="التوصيل" value={delivery === 0 ? 'مجاني 🎉' : <>{delivery} <RiyalSymbol /></>} />
              <div className="border-t border-border/60 pt-2 mt-2 flex justify-between font-extrabold text-base">
                <span>الإجمالي</span>
                <span className="text-gradient-loza">{total} <RiyalSymbol /></span>
              </div>
              {subtotal < 200 && (
                <p className="text-[11px] text-center text-muted-foreground bg-muted/40 rounded-xl p-2 mt-2">
                  أضف <b className="text-primary">{200 - subtotal} <RiyalSymbol /></b> للحصول على توصيل مجاني 🚚
                </p>
              )}
            </div>
          </>
        )}
      </main>

      {items.length > 0 && (
        <div className="fixed bottom-16 inset-x-0 z-40 bg-card/95 backdrop-blur-md border-t border-border shadow-loza-lift">
          <div className="container mx-auto max-w-2xl px-4 py-3 flex items-center gap-3">
            <div className="flex-1">
              <div className="text-[10px] text-muted-foreground">الإجمالي</div>
              <div className="font-extrabold text-gradient-loza text-lg leading-tight">{total} <RiyalSymbol /></div>
            </div>
            <Button
              onClick={() => navigate('/loza/checkout', { state: { discount, delivery } })}
              className="rounded-full gradient-loza-gold text-[hsl(var(--loza-brown))] border-0 font-bold px-6"
            >
              <ShoppingBag className="w-4 h-4 me-1" />
              متابعة الدفع ←
            </Button>
          </div>
        </div>
      )}
    </LozaShell>
  );
}

function Row({ label, value, accent }: { label: string; value: ReactNode; accent?: boolean }) {
  return (
    <div className="flex justify-between">
      <span className="text-muted-foreground">{label}</span>
      <span className={accent ? 'text-success font-bold' : 'font-medium'}>{value}</span>
    </div>
  );
}
