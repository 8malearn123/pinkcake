import { createContext, useContext, useState, useEffect, ReactNode } from 'react';

interface ThemeColors {
  primary: string;
  primaryLight: string;
  primaryDark: string;
  accent: string;
}

export interface DeliverySettings {
  /** Cart subtotal (SAR) at/above which delivery is free. */
  freeThreshold: number;
  /** Flat delivery fee (SAR) below the free threshold. */
  fee: number;
}

export type DayKey = 'sun' | 'mon' | 'tue' | 'wed' | 'thu' | 'fri' | 'sat';

export interface DayHours {
  open: string;
  close: string;
  closed: boolean;
}

interface Settings {
  storeName: string;
  storeDescription: string;
  colors: ThemeColors;
  delivery: DeliverySettings;
  hours: Record<DayKey, DayHours>;
}

interface SettingsContextType {
  settings: Settings;
  updateSettings: (newSettings: Partial<Settings>) => void;
  updateColors: (newColors: Partial<ThemeColors>) => void;
  updateDelivery: (newDelivery: Partial<DeliverySettings>) => void;
  updateHours: (day: DayKey, newHours: Partial<DayHours>) => void;
  resetToDefaults: () => void;
}

const defaultHours = (): Record<DayKey, DayHours> =>
  (['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'] as DayKey[]).reduce((acc, day) => {
    acc[day] = { open: '09:00', close: '22:00', closed: day === 'fri' };
    return acc;
  }, {} as Record<DayKey, DayHours>);

const defaultSettings: Settings = {
  storeName: 'Pink Cake',
  storeDescription: 'نظام إدارة الطلبات',
  colors: {
    primary: '359 31% 61%',
    primaryLight: '359 35% 75%',
    primaryDark: '359 31% 50%',
    accent: '340 45% 55%',
  },
  delivery: { freeThreshold: 200, fee: 25 },
  hours: defaultHours(),
};

const SettingsContext = createContext<SettingsContextType | undefined>(undefined);

export function SettingsProvider({ children }: { children: ReactNode }) {
  const [settings, setSettings] = useState<Settings>(() => {
    try {
      const saved = localStorage.getItem('store-settings');
      const parsed = saved ? JSON.parse(saved) : {};
      // Merge over defaults so settings persisted before delivery/hours existed
      // still gain those fields (avoids reading undefined at checkout).
      return {
        ...defaultSettings,
        ...parsed,
        colors: { ...defaultSettings.colors, ...(parsed.colors ?? {}) },
        delivery: { ...defaultSettings.delivery, ...(parsed.delivery ?? {}) },
        hours: { ...defaultSettings.hours, ...(parsed.hours ?? {}) },
      };
    } catch {
      return defaultSettings;
    }
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

  const updateDelivery = (newDelivery: Partial<DeliverySettings>) => {
    setSettings((prev) => ({
      ...prev,
      delivery: { ...prev.delivery, ...newDelivery },
    }));
  };

  const updateHours = (day: DayKey, newHours: Partial<DayHours>) => {
    setSettings((prev) => ({
      ...prev,
      hours: { ...prev.hours, [day]: { ...prev.hours[day], ...newHours } },
    }));
  };

  const resetToDefaults = () => {
    setSettings(defaultSettings);
  };

  return (
    <SettingsContext.Provider value={{ settings, updateSettings, updateColors, updateDelivery, updateHours, resetToDefaults }}>
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
