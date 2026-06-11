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

const presets: ColorPreset[] = [
  {
    name: 'وردي كلاسيكي',
    primary: '359 31% 61%',
    primaryLight: '359 35% 75%',
    primaryDark: '359 31% 50%',
    accent: '340 45% 55%',
  },
  {
    name: 'أزرق سماوي',
    primary: '199 89% 48%',
    primaryLight: '199 85% 65%',
    primaryDark: '199 89% 38%',
    accent: '210 80% 50%',
  },
  {
    name: 'أخضر زمردي',
    primary: '142 71% 45%',
    primaryLight: '142 65% 60%',
    primaryDark: '142 71% 35%',
    accent: '160 60% 45%',
  },
  {
    name: 'بنفسجي ملكي',
    primary: '262 83% 58%',
    primaryLight: '262 75% 70%',
    primaryDark: '262 83% 45%',
    accent: '280 70% 55%',
  },
  {
    name: 'برتقالي دافئ',
    primary: '25 95% 53%',
    primaryLight: '25 90% 65%',
    primaryDark: '25 95% 43%',
    accent: '38 92% 50%',
  },
  {
    name: 'ذهبي فاخر',
    primary: '45 93% 47%',
    primaryLight: '45 88% 60%',
    primaryDark: '45 93% 37%',
    accent: '38 92% 50%',
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
