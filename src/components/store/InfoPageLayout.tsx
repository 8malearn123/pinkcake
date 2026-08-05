import { type ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSettings } from '@/contexts/SettingsContext';
import { StorefrontMasthead } from '@/components/store/StorefrontMasthead';
import { StorefrontFooter } from '@/components/store/StorefrontFooter';
import { Marquee } from '@/components/store/StorefrontDecor';
import { Eyebrow, Title, Lede } from '@/components/ds';
import { type LucideIcon } from 'lucide-react';

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
 * Privacy, About).
 *
 * Uses the same masthead, ticker and footer as the home page, so these five
 * pages read as the same shop rather than a separate microsite. The title band
 * is the storefront's blush wash with the standard eyebrow + black display
 * heading.
 */
export function InfoPageLayout({ eyebrow, title, subtitle, icon: Icon, children }: InfoPageLayoutProps) {
  const navigate = useNavigate();
  const { settings } = useSettings();

  return (
    <div className="store-surface flex min-h-screen flex-col bg-background text-foreground">
      <Marquee />
      <StorefrontMasthead />

      {/* Title band */}
      <div className="border-b border-primary/10 bg-gradient-to-b from-blush to-background">
        {/* Document-like measure: these pages are prose, and their own content
            blocks cap at max-w-3xl — in a 1500px shell that leaves the text
            stranded against the right edge in RTL. */}
        <div className="mx-auto max-w-6xl px-5 py-14 sm:px-8 lg:px-12 lg:py-20">
          {Icon && (
            <div className="mb-5 grid size-14 place-items-center rounded-2xl bg-blush text-primary">
              <Icon className="size-7" />
            </div>
          )}
          {eyebrow && (
            <Eyebrow rule caps className="mb-3">
              {eyebrow}
            </Eyebrow>
          )}
          <Title variant="display" as="h1">
            {title}
          </Title>
          {subtitle && <Lede className="mt-4 max-w-2xl">{subtitle}</Lede>}
        </div>
      </div>

      {/* Content */}
      <main className="mx-auto w-full max-w-6xl flex-1 px-5 py-12 sm:px-8 lg:px-12 lg:py-16">
        {children}
      </main>

      <StorefrontFooter storeName={settings.storeName} onNavigate={navigate} />
    </div>
  );
}
