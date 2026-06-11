import { createContext, useContext, useState, useEffect, ReactNode } from 'react';

interface ThemeColors {
  primary: string;
  primaryLight: string;
  primaryDark: string;
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

const defaultSettings: Settings = {
  storeName: 'Pink Cake',
  storeDescription: 'نظام إدارة الطلبات',
  colors: {
    primary: '359 31% 61%',
    primaryLight: '359 35% 75%',
    primaryDark: '359 31% 50%',
    accent: '340 45% 55%',
  },
};

const SettingsContext = createContext<SettingsContextType | undefined>(undefined);

export function SettingsProvider({ children }: { children: ReactNode }) {
  const [settings, setSettings] = useState<Settings>(() => {
    const saved = localStorage.getItem('store-settings');
    return saved ? JSON.parse(saved) : defaultSettings;
  });

  useEffect(() => {
    localStorage.setItem('store-settings', JSON.stringify(settings));
    
    // Apply colors to CSS variables
    const root = document.documentElement;
    root.style.setProperty('--primary', settings.colors.primary);
    root.style.setProperty('--pink', settings.colors.primary);
    root.style.setProperty('--pink-light', settings.colors.primaryLight);
    root.style.setProperty('--pink-dark', settings.colors.primaryDark);
    root.style.setProperty('--accent', settings.colors.accent);
    root.style.setProperty('--rose', settings.colors.accent);
    root.style.setProperty('--ring', settings.colors.primary);
    root.style.setProperty('--sidebar-primary', settings.colors.primary);
    root.style.setProperty('--sidebar-ring', settings.colors.primary);
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
