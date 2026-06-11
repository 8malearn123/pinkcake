import { Link } from 'react-router-dom';
import { User, Heart, MapPin, Bell, Settings, HelpCircle, LogOut, ChevronLeft, Gift, Receipt, Sparkles } from 'lucide-react';
import LozaShell from './LozaShell';
import { useLozaCart } from '@/contexts/LozaCartContext';

export default function LozaProfile() {
  const { wishlist, orders } = useLozaCart();

  const stats = [
    { label: 'طلب', value: orders.length, icon: Receipt },
    { label: 'مفضلة', value: wishlist.length, icon: Heart },
    { label: 'نقطة', value: orders.length * 50, icon: Sparkles },
  ];

  const menu = [
    { icon: Heart, label: 'المفضلة', href: '/loza/wishlist', count: wishlist.length },
    { icon: MapPin, label: 'عناويني', href: '/loza/profile' },
    { icon: Gift, label: 'الهدايا والكوبونات', href: '/loza/profile' },
    { icon: Bell, label: 'الإشعارات', href: '/loza/profile' },
    { icon: Settings, label: 'الإعدادات', href: '/loza/profile' },
    { icon: HelpCircle, label: 'المساعدة والدعم', href: '/loza/profile' },
  ];

  return (
    <LozaShell>
      {/* Header */}
      <section className="relative gradient-loza-header text-white p-6 pb-20">
        <h1 className="text-lg font-bold font-loza-display">حسابي</h1>
        <div className="flex items-center gap-4 mt-5">
          <div className="w-20 h-20 rounded-3xl bg-white/20 backdrop-blur flex items-center justify-center text-4xl shadow-loza-lift">
            <User className="w-10 h-10" />
          </div>
          <div>
            <div className="text-xl font-bold font-loza-display">ضيف لوزا</div>
            <div className="text-[11px] text-white/80 mt-0.5">سجّل لتفعيل النقاط والهدايا</div>
            <Link to="/login" className="inline-block mt-2 px-4 py-1.5 rounded-full bg-white/95 text-[hsl(var(--loza-brown))] text-xs font-bold">
              تسجيل الدخول ←
            </Link>
          </div>
        </div>
      </section>

      <main className="container mx-auto max-w-2xl px-4 -mt-12 relative z-10 space-y-4">
        {/* Stats */}
        <div className="grid grid-cols-3 gap-3">
          {stats.map((s) => {
            const Icon = s.icon;
            return (
              <div key={s.label} className="bg-card rounded-2xl shadow-loza p-3 text-center border border-border/40">
                <Icon className="w-5 h-5 mx-auto text-primary" />
                <div className="text-xl font-extrabold mt-1 text-gradient-loza">{s.value}</div>
                <div className="text-[10px] text-muted-foreground">{s.label}</div>
              </div>
            );
          })}
        </div>

        {/* Menu */}
        <div className="bg-card rounded-3xl shadow-loza border border-border/40 overflow-hidden">
          {menu.map((m, i) => {
            const Icon = m.icon;
            return (
              <Link
                key={m.label}
                to={m.href}
                className={`flex items-center gap-3 p-4 hover:bg-muted/40 transition-colors ${i !== menu.length - 1 ? 'border-b border-border/60' : ''}`}
              >
                <div className="w-9 h-9 rounded-xl bg-[hsl(var(--loza-gold-light))]/40 flex items-center justify-center">
                  <Icon className="w-4 h-4 text-primary" />
                </div>
                <span className="flex-1 text-sm font-medium">{m.label}</span>
                {!!m.count && <span className="text-[10px] gradient-loza-gold text-[hsl(var(--loza-brown))] px-2 py-0.5 rounded-full font-bold">{m.count}</span>}
                <ChevronLeft className="w-4 h-4 text-muted-foreground" />
              </Link>
            );
          })}
        </div>

        {/* Logout */}
        <button className="w-full rounded-3xl bg-card shadow-loza border border-border/40 p-4 flex items-center gap-3 hover:bg-destructive/5 transition-colors">
          <div className="w-9 h-9 rounded-xl bg-destructive/10 flex items-center justify-center">
            <LogOut className="w-4 h-4 text-destructive" />
          </div>
          <span className="flex-1 text-right text-sm font-medium text-destructive">تسجيل الخروج</span>
        </button>

        <p className="text-center text-[10px] text-muted-foreground py-4">
          لوزا • الإصدار 1.0
        </p>
      </main>
    </LozaShell>
  );
}
