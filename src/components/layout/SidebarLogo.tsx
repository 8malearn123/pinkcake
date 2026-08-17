import { Link } from 'react-router-dom';
import { BrandLogo } from '@/components/brand';
import { useSettings } from '@/contexts/SettingsContext';

export function SidebarLogo() {
  const { settings } = useSettings();

  return (
    // Rose hairline under the mark — the console's one decorative brand cue,
    // matching the rose rules the storefront uses to open a section.
    <div className="border-b border-brand-rose/25 p-6">
      <Link to="/" className="flex items-center gap-3">
        {/* The lockup itself, in the brand rose on the ink sidebar: the logo's
            own two colours, adjacent, which is the whole identity. */}
        <BrandLogo variant="ar" className="h-11 text-brand-rose" />
        <div className="min-w-0">
          <h1 className="truncate text-sm font-medium text-sidebar-foreground">
            {settings.storeName}
          </h1>
          <p className="truncate text-xs text-sidebar-foreground/60">{settings.storeDescription}</p>
        </div>
      </Link>
    </div>
  );
}
