import { type ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSettings } from '@/contexts/SettingsContext';
import { StoreFooter } from '@/components/store/StoreFooter';
import { Cake, ArrowRight, Store, type LucideIcon } from 'lucide-react';

interface InfoPageLayoutProps {
  /** Small uppercase eyebrow above the title. */
  eyebrow?: string;
  title: string;
  /** Muted intro line under the title. */
  subtitle?: string;
  /** Optional icon shown in the title band. */
  icon?: LucideIcon;
  children: ReactNode;
}

/**
 * Shared chrome for the static customer info pages (FAQ, Contact, Terms,
 * Privacy, About): a lightweight header, a blush title band, a content
 * container, and the storefront footer — so every info page is consistent and
 * the footer links resolve across them. Public + frontend-only.
 */
export function InfoPageLayout({ eyebrow, title, subtitle, icon: Icon, children }: InfoPageLayoutProps) {
  const navigate = useNavigate();
  const { settings } = useSettings();

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-background/85 backdrop-blur-xl border-b border-border/60">
        <div className="container mx-auto px-4 lg:px-6 h-16 flex items-center gap-3">
          <button
            onClick={() => navigate('/store')}
            aria-label="رجوع للمتجر"
            className="press w-10 h-10 rounded-full border border-border bg-card flex items-center justify-center hover:border-primary/50 hover:bg-primary/5 transition-colors shrink-0"
          >
            <ArrowRight className="w-5 h-5" />
          </button>

          <button onClick={() => navigate('/')} className="flex items-center gap-2.5 press group">
            <div className="w-9 h-9 rounded-xl gradient-pink flex items-center justify-center shadow-rose-glow text-primary-foreground transition-transform duration-500 group-hover:-rotate-6 group-hover:scale-105">
              <Cake className="w-5 h-5" />
            </div>
            <div className="hidden sm:block text-start leading-tight">
              <div className="font-display text-lg">{settings.storeName}</div>
              <div className="text-[10px] text-muted-foreground tracking-widest uppercase">Patisserie</div>
            </div>
          </button>

          <button
            onClick={() => navigate('/store')}
            className="press ms-auto inline-flex items-center gap-2 rounded-full h-10 px-5 bg-foreground text-background text-sm font-semibold hover:bg-foreground/90 transition-colors"
          >
            <Store className="w-4 h-4" /> تسوّقي
          </button>
        </div>
      </header>

      {/* Title band */}
      <div
        className="border-b border-border/60"
        style={{ background: 'linear-gradient(135deg, hsl(var(--blush)), hsl(var(--card)))' }}
      >
        <div className="container mx-auto px-4 lg:px-6 py-12 lg:py-16">
          {Icon && (
            <div className="w-14 h-14 rounded-2xl bg-primary/10 text-primary flex items-center justify-center mb-5">
              <Icon className="w-7 h-7" />
            </div>
          )}
          {eyebrow && (
            <div className="text-xs text-primary tracking-widest uppercase font-medium">{eyebrow}</div>
          )}
          <h1 className="font-display text-4xl md:text-5xl mt-2 leading-tight">{title}</h1>
          {subtitle && (
            <p className="text-muted-foreground mt-3 max-w-2xl leading-relaxed">{subtitle}</p>
          )}
        </div>
      </div>

      {/* Content */}
      <main className="flex-1 container mx-auto px-4 lg:px-6 py-10 lg:py-14">{children}</main>

      <StoreFooter
        storeName={settings.storeName}
        onNavigate={navigate}
        onShop={() => navigate('/store')}
      />
    </div>
  );
}
