import { Link } from 'react-router-dom';
import { Cake } from 'lucide-react';
import { useSettings } from '@/contexts/SettingsContext';

export function SidebarLogo() {
  const { settings } = useSettings();

  return (
    // Gold hairline under the mark — the console's one decorative brand cue,
    // matching the gold rules the storefront uses to open a section.
    <div className="border-b border-gold/25 p-6">
      <Link to="/" className="flex items-center gap-3">
        <div className="gradient-pink grid size-12 place-items-center rounded-xl text-primary-foreground ring-1 ring-gold/40">
          <Cake className="size-7" />
        </div>
        <div>
          <h1 className="text-xl font-black tracking-[-.02em] text-sidebar-foreground">{settings.storeName}</h1>
          <p className="text-xs text-sidebar-foreground/60">{settings.storeDescription}</p>
        </div>
      </Link>
    </div>
  );
}
