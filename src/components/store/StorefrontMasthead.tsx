// Editorial masthead — the oversized serif "brand statement" band that opens the
// page (inspired by luxury-boutique landing mastheads). Rose/blush tokens only,
// Amiri serif via .font-wedding. Static, calm, generous whitespace.
export function StorefrontMasthead() {
  return (
    <section className="relative overflow-hidden gradient-blush-warm border-b border-border/50">
      <div className="absolute inset-0 noise-overlay opacity-[0.15] pointer-events-none" />
      <div className="relative container mx-auto px-4 lg:px-6 py-9 md:py-12 text-center">
        {/* eyebrow with symmetric rose hairlines */}
        <div className="inline-flex items-center gap-3">
          <span className="h-px w-8 sm:w-12" style={{ background: 'linear-gradient(90deg, transparent, hsl(var(--primary) / .6))' }} />
          <span className="text-[10px] sm:text-xs tracking-[0.35em] uppercase text-primary font-medium">
            باتيسيري فاخرة · صناعة يدوية
          </span>
          <span className="h-px w-8 sm:w-12" style={{ background: 'linear-gradient(90deg, hsl(var(--primary) / .6), transparent)' }} />
        </div>

        <h1 className="font-wedding text-[2.5rem] leading-[1.25] sm:text-6xl md:text-7xl mt-4 md:mt-5 text-foreground">
          حلاوةٌ <span className="text-primary">تليق</span> بلحظاتك
        </h1>

        <p className="mx-auto mt-4 max-w-xl text-sm sm:text-base text-muted-foreground leading-relaxed">
          كيكاتٌ وحلوياتٌ مصمّمة يدوياً بأجود المكوّنات — لكل مناسبةٍ حكايتها الحلوة.
        </p>
      </div>
    </section>
  );
}
