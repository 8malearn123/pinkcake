import { useState } from 'react';
import { Mail, Check, ArrowLeft } from 'lucide-react';

// Soft "join the club" band with a first-order discount (inspired by boutique
// newsletter CTAs). Blush ground, botanical rose glows, one filled rose CTA.
// Demo-only form — captures nothing, shows an inline thank-you on submit.
export function NewsletterBand() {
  const [email, setEmail] = useState('');
  const [done, setDone] = useState(false);

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (email.trim()) setDone(true);
  };

  return (
    <section className="relative overflow-hidden rounded-[2.5rem] gradient-blush-warm border border-border/50 shadow-soft-lift">
      {/* botanical rose glows */}
      <div className="absolute -top-16 -start-10 w-64 h-64 rounded-full blur-3xl pointer-events-none" style={{ background: 'radial-gradient(circle, hsl(var(--primary) / .18), transparent 70%)' }} />
      <div className="absolute -bottom-20 -end-8 w-72 h-72 rounded-full blur-3xl pointer-events-none" style={{ background: 'radial-gradient(circle, hsl(var(--rose) / .16), transparent 70%)' }} />
      <div className="absolute inset-0 noise-overlay opacity-[0.12] pointer-events-none" />

      <div className="relative z-10 px-6 sm:px-10 lg:px-16 py-12 lg:py-16 text-center max-w-2xl mx-auto">
        <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-primary/12 text-primary">
          <Mail className="w-6 h-6" strokeWidth={1.5} />
        </span>

        <div className="text-[11px] tracking-[0.35em] uppercase text-primary font-medium mt-5">نادي بينك كيك</div>
        <h2 className="font-wedding text-3xl sm:text-4xl md:text-5xl mt-3 leading-[1.3] text-foreground">
          خصمٌ 10٪ على أوّل طلب
        </h2>
        <p className="mt-4 text-sm sm:text-base text-muted-foreground leading-relaxed">
          عروضٌ خاصة، ونصائح حلوة، ووصولٌ مبكّر لكل جديد — مباشرةً إلى بريدك.
        </p>

        {done ? (
          <div className="mt-7 inline-flex items-center gap-2 h-12 px-6 rounded-full bg-primary/10 text-primary font-medium">
            <Check className="w-5 h-5" />
            تمّ اشتراكك — أهلاً بك في النادي!
          </div>
        ) : (
          <form onSubmit={submit} className="mt-7 flex flex-col sm:flex-row items-stretch gap-3 max-w-md mx-auto">
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="أدخلي بريدك الإلكتروني"
              aria-label="البريد الإلكتروني"
              className="flex-1 h-12 px-5 rounded-full bg-card/90 border border-border text-sm text-foreground placeholder:text-muted-foreground outline-none focus:border-primary/60 transition-colors"
            />
            <button
              type="submit"
              className="group press sheen shrink-0 inline-flex items-center justify-center gap-2 h-12 px-7 rounded-full gradient-pink text-primary-foreground font-semibold shadow-rose-glow transition-transform"
            >
              انضمّي الآن
              <ArrowLeft className="cta-arrow w-4 h-4" />
            </button>
          </form>
        )}
      </div>
    </section>
  );
}
