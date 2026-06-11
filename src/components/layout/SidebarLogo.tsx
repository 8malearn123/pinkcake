import { Link } from 'react-router-dom';
import { Cake } from 'lucide-react';
import { useSettings } from '@/contexts/SettingsContext';

export function SidebarLogo() {
  const { settings } = useSettings();

  return (
    <div className="p-6 border-b border-sidebar-border">
      <Link to="/" className="flex items-center gap-3">
        <div className="w-12 h-12 rounded-xl gradient-pink flex items-center justify-center shadow-warm">
          <Cake className="w-7 h-7 text-white" />
        </div>
        <div>
          <h1 className="text-xl font-bold text-sidebar-foreground">{settings.storeName}</h1>
          <p className="text-xs text-sidebar-foreground/60">{settings.storeDescription}</p>
        </div>
      </Link>
    </div>
  );
}
