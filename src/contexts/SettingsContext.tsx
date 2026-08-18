import { createContext, useContext, useState, useEffect, ReactNode } from 'react';

interface ThemeColors {
  primary: string;
  primaryLight: string;
  primaryDark: string;
  /** The secondary brand tone (eyebrows, second lines) → `--rose`. NOT shadcn's
   *  `--accent`, which stays a fixed blush hover wash so ghost/outline buttons
   *  and dropdown rows never take a brand fill. `--brand-rose` and `--brand-ink`
   *  are the logo's own two colours and are deliberately not customizable. */
  accent: string;
}

interface Settings {
  storeName: string;
  storeDescription: string;
  colors: ThemeColors;
}

interface SettingsContextType {
  settings: Settings;
  updateSettings: (newSettings: Partial<Settings>) => void;
  updateColors: (newColors: Partial<ThemeColors>) => void;
  resetToDefaults: () => void;
}

/** Must mirror the `:root` values in index.css — the effect below writes these
 *  as inline styles on <html>, which beat any stylesheet rule. Drift here and
 *  the app silently renders the old palette no matter what the CSS says. */
const defaultSettings: Settings = {
  storeName: 'Pink Cake',
  storeDescription: 'نظام إدارة الطلبات',
  colors: {
    primary: '349 36% 28%',
    primaryLight: '350 34% 62%',
    primaryDark: '349 38% 18%',
    accent: '349 32% 42%',
  },
};

/** Bumped for the Pink Cake logo rebrand: v2 holds a cached Cake & Bloom berry
 *  palette that would otherwise pin every returning browser to the old theme
 *  forever (there is no migration path — the stored object has no version
 *  field, and these values land as inline styles that beat `:root`). */
const STORAGE_KEY = 'store-settings-v3';

const SettingsContext = createContext<SettingsContextType | undefined>(undefined);

export function SettingsProvider({ children }: { children: ReactNode }) {
  const [settings, setSettings] = useState<Settings>(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    return saved ? JSON.parse(saved) : defaultSettings;
  });

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));

    // Apply colors to CSS variables
    const root = document.documentElement;
    root.style.setProperty('--primary', settings.colors.primary);
    root.style.setProperty('--pink', settings.colors.primary);
    root.style.setProperty('--pink-light', settings.colors.primaryLight);
    root.style.setProperty('--pink-dark', settings.colors.primaryDark);
    root.style.setProperty('--rose', settings.colors.accent);
    root.style.setProperty('--ring', settings.colors.primary);
    // `--accent` is intentionally NOT written: it is shadcn's hover surface, so
    // tinting it with a brand color turns every ghost button and dropdown row
    // into a saturated fill.
    //
    // `--sidebar-primary` is no longer written either. The console's active nav
    // row is now the logo's own pairing — the brand rose carrying ink text — and
    // `primary` is a dark shade, so writing it here painted a near-black row on
    // a near-black sidebar and the active item vanished. The sidebar's rose and
    // `--brand-rose`/`--brand-ink` are fixed identity, not theme settings.
  }, [settings]);

  const updateSettings = (newSettings: Partial<Settings>) => {
    setSettings((prev) => ({ ...prev, ...newSettings }));
  };

  const updateColors = (newColors: Partial<ThemeColors>) => {
    setSettings((prev) => ({
      ...prev,
      colors: { ...prev.colors, ...newColors },
    }));
  };

  const resetToDefaults = () => {
    setSettings(defaultSettings);
  };

  return (
    <SettingsContext.Provider value={{ settings, updateSettings, updateColors, resetToDefaults }}>
      {children}
    </SettingsContext.Provider>
  );
}

export function useSettings() {
  const context = useContext(SettingsContext);
  if (context === undefined) {
    throw new Error('useSettings must be used within a SettingsProvider');
  }
  return context;
}
