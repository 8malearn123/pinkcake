import { useParams, Link } from 'react-router-dom';
import { ArrowRight, Star, MapPin, Phone, Clock } from 'lucide-react';
import LozaShell from './LozaShell';
import { findVendor, LOZA_CAKES } from '@/data/lozaCatalog';
import { RiyalSymbol } from '@/components/ui/riyal';

export default function LozaVendor() {
  const { id } = useParams();
  const vendor = id ? findVendor(id) : undefined;
  const cakes = LOZA_CAKES.filter((c) => c.vendorId === id);

  if (!vendor) {
    return (
      <LozaShell>
        <div className="container mx-auto max-w-2xl px-4 py-20 text-center">
          <h1 className="text-xl font-bold mb-3">المتجر غير موجود</h1>
          <Link to="/loza" className="text-primary font-medium">العودة ←</Link>
        </div>
      </LozaShell>
    );
  }

  return (
    <LozaShell>
      <section className={`relative h-56 bg-gradient-to-br ${vendor.cover} text-white overflow-hidden`}>
        <Link to="/loza" className="absolute top-4 start-4 z-10 w-10 h-10 rounded-full bg-white/95 text-[hsl(var(--loza-brown))] flex items-center justify-center">
          <ArrowRight className="w-5 h-5" />
        </Link>
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="text-[140px] drop-shadow-2xl">{vendor.emoji}</span>
        </div>
      </section>

      <main className="container mx-auto max-w-2xl px-4 -mt-8 relative z-10 pb-10">
        <div className="bg-card rounded-3xl shadow-loza-lift p-5 border border-border/40">
          <h1 className="text-2xl font-bold font-loza-display">{vendor.name}</h1>
          <p className="text-sm text-muted-foreground mt-1">{vendor.desc}</p>
          <div className="grid grid-cols-3 gap-2 mt-4">
            <Mini icon={Star} label={`${vendor.rating} ★`} sub="تقييم" />
            <Mini icon={MapPin} label={vendor.distance} sub={vendor.city} />
            <Mini icon={Clock} label="مفتوح" sub="حتى 11م" />
          </div>
          <div className="grid grid-cols-2 gap-2 mt-4">
            <a href="tel:0500000000" className="rounded-2xl border-2 border-primary text-primary py-2.5 text-sm font-bold flex items-center justify-center gap-1">
              <Phone className="w-4 h-4" /> اتصال
            </a>
            <button className="rounded-2xl gradient-loza-gold text-[hsl(var(--loza-brown))] py-2.5 text-sm font-bold">
              متابعة المتجر
            </button>
          </div>
        </div>

        <h2 className="text-lg font-bold font-loza-display mt-6 mb-3">منتجات المتجر</h2>
        <div className="grid grid-cols-2 gap-3">
          {cakes.map((c) => (
            <Link
              key={c.id}
              to={`/loza/cake/${c.id}`}
              className="group bg-card rounded-3xl shadow-loza hover:shadow-loza-lift hover:-translate-y-1 transition-all overflow-hidden border border-border/40"
            >
              <div className="relative h-28 bg-gradient-to-br from-[hsl(var(--loza-gold-light))] to-[hsl(var(--loza-cream))] flex items-center justify-center">
                <span className="text-5xl group-hover:scale-110 transition-transform">{c.emoji}</span>
              </div>
              <div className="p-3">
                <h4 className="font-bold text-sm line-clamp-2">{c.name}</h4>
                <div className="flex items-center justify-between mt-2">
                  <span className="text-primary font-extrabold text-sm">{c.price} <RiyalSymbol /></span>
                  <span className="text-[10px] flex items-center gap-0.5">
                    <Star className="w-3 h-3 fill-primary text-primary" /> {c.rating}
                  </span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </main>
    </LozaShell>
  );
}

function Mini({ icon: Icon, label, sub }: any) {
  return (
    <div className="bg-muted/40 rounded-2xl p-2.5 text-center">
      <Icon className="w-4 h-4 mx-auto text-primary" />
      <div className="text-xs font-bold mt-1">{label}</div>
      <div className="text-[10px] text-muted-foreground">{sub}</div>
    </div>
  );
}
