import { createContext, useContext, useState, useEffect, ReactNode } from 'react';

interface ThemeColors {
  primary: string;
  primaryLight: string;
  primaryDark: string;
  /** The secondary brand tone (eyebrows, second lines) → `--rose`. NOT shadcn's
   *  `--accent`, which stays a fixed blush hover wash so ghost/outline buttons
   *  and dropdown rows never take a brand fill. Gold is fixed brand identity
   *  and is deliberately not customizable. */
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
    primary: '340 46% 42%',
    primaryLight: '341 46% 62%',
    primaryDark: '340 46% 34%',
    accent: '341 40% 50%',
  },
};

/** Bumped for Cake & Bloom: the v1 key holds a cached rose palette that would
 *  otherwise pin returning users to the old theme forever (there is no
 *  migration path — the stored object has no version field). */
const STORAGE_KEY = 'store-settings-v2';

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
    root.style.setProperty('--sidebar-primary', settings.colors.primary);
    // `--accent` is intentionally NOT written: it is shadcn's hover surface, so
    // tinting it with a brand color turns every ghost button and dropdown row
    // into a saturated fill. `--sidebar-ring` stays gold for the same reason.
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
