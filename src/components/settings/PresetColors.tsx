import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Palette } from 'lucide-react';

interface ColorPreset {
  name: string;
  primary: string;
  primaryLight: string;
  primaryDark: string;
  accent: string;
}

/** The first entry is the Cake & Bloom default and must match `:root` in
 *  index.css + `defaultSettings` in SettingsContext. The rest are deeper,
 *  lower-chroma tones chosen to sit on the cream background — the old neon
 *  presets (sky blue, emerald, orange) glowed against it. */
const presets: ColorPreset[] = [
  {
    name: 'توتي (الافتراضي)',
    primary: '340 46% 42%',
    primaryLight: '341 46% 62%',
    primaryDark: '340 46% 34%',
    accent: '341 40% 50%',
  },
  {
    name: 'عنّابي داكن',
    primary: '350 52% 34%',
    primaryLight: '350 44% 54%',
    primaryDark: '350 54% 26%',
    accent: '352 40% 44%',
  },
  {
    name: 'بنفسجي خزامى',
    primary: '285 32% 42%',
    primaryLight: '285 30% 62%',
    primaryDark: '285 34% 33%',
    accent: '295 28% 50%',
  },
  {
    name: 'أخضر صنوبري',
    primary: '158 47% 30%',
    primaryLight: '158 36% 48%',
    primaryDark: '158 50% 22%',
    accent: '166 38% 38%',
  },
  {
    name: 'أزرق ليلي',
    primary: '212 42% 38%',
    primaryLight: '212 36% 56%',
    primaryDark: '212 45% 28%',
    accent: '200 42% 44%',
  },
  {
    name: 'كرملي دافئ',
    primary: '24 52% 38%',
    primaryLight: '28 48% 56%',
    primaryDark: '24 55% 28%',
    accent: '33 50% 46%',
  },
];

interface PresetColorsProps {
  onSelect: (preset: ColorPreset) => void;
}

export function PresetColors({ onSelect }: PresetColorsProps) {
  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-lg">
          <Palette className="w-5 h-5" />
          ألوان جاهزة
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          {presets.map((preset) => (
            <Button
              key={preset.name}
              variant="outline"
              className="h-auto flex-col items-start p-3 gap-2 hover:border-primary"
              onClick={() => onSelect(preset)}
            >
              <div className="flex gap-1.5 w-full">
                <div
                  className="w-6 h-6 rounded-full shadow-sm"
                  style={{ backgroundColor: `hsl(${preset.primary})` }}
                />
                <div
                  className="w-6 h-6 rounded-full shadow-sm"
                  style={{ backgroundColor: `hsl(${preset.accent})` }}
                />
                <div
                  className="w-6 h-6 rounded-full shadow-sm"
                  style={{ backgroundColor: `hsl(${preset.primaryLight})` }}
                />
              </div>
              <span className="text-sm font-medium">{preset.name}</span>
            </Button>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
