import { useState } from 'react';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { Card, CardContent } from '@/components/ui/card';

interface ColorPickerProps {
  label: string;
  value: string; // HSL format: "359 31% 61%"
  onChange: (value: string) => void;
}

function parseHSL(hsl: string): { h: number; s: number; l: number } {
  const parts = hsl.split(' ');
  return {
    h: parseInt(parts[0]) || 0,
    s: parseInt(parts[1]) || 50,
    l: parseInt(parts[2]) || 50,
  };
}

function toHSL(h: number, s: number, l: number): string {
  return `${h} ${s}% ${l}%`;
}

export function ColorPicker({ label, value, onChange }: ColorPickerProps) {
  const [hsl, setHsl] = useState(() => parseHSL(value));

  const handleChange = (key: 'h' | 's' | 'l', newValue: number[]) => {
    const updated = { ...hsl, [key]: newValue[0] };
    setHsl(updated);
    onChange(toHSL(updated.h, updated.s, updated.l));
  };

  const previewStyle = {
    backgroundColor: `hsl(${hsl.h}, ${hsl.s}%, ${hsl.l}%)`,
  };

  return (
    <Card className="overflow-hidden">
      <CardContent className="p-4">
        <div className="flex items-center gap-4 mb-4">
          <div
            className="w-12 h-12 rounded-lg shadow-inner border border-border"
            style={previewStyle}
          />
          <Label className="text-base font-medium">{label}</Label>
        </div>

        <div className="space-y-4">
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">درجة اللون</span>
              <span className="font-medium">{hsl.h}°</span>
            </div>
            <div
              className="h-3 rounded-full"
              style={{
                background: `linear-gradient(to left, 
                  hsl(0, ${hsl.s}%, ${hsl.l}%),
                  hsl(60, ${hsl.s}%, ${hsl.l}%),
                  hsl(120, ${hsl.s}%, ${hsl.l}%),
                  hsl(180, ${hsl.s}%, ${hsl.l}%),
                  hsl(240, ${hsl.s}%, ${hsl.l}%),
                  hsl(300, ${hsl.s}%, ${hsl.l}%),
                  hsl(360, ${hsl.s}%, ${hsl.l}%)
                )`,
              }}
            />
            <Slider
              value={[hsl.h]}
              onValueChange={(v) => handleChange('h', v)}
              max={360}
              step={1}
              className="mt-1"
            />
          </div>

          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">التشبع</span>
              <span className="font-medium">{hsl.s}%</span>
            </div>
            <div
              className="h-3 rounded-full"
              style={{
                background: `linear-gradient(to left, 
                  hsl(${hsl.h}, 0%, ${hsl.l}%),
                  hsl(${hsl.h}, 100%, ${hsl.l}%)
                )`,
              }}
            />
            <Slider
              value={[hsl.s]}
              onValueChange={(v) => handleChange('s', v)}
              max={100}
              step={1}
              className="mt-1"
            />
          </div>

          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">الإضاءة</span>
              <span className="font-medium">{hsl.l}%</span>
            </div>
            <div
              className="h-3 rounded-full"
              style={{
                background: `linear-gradient(to left, 
                  hsl(${hsl.h}, ${hsl.s}%, 0%),
                  hsl(${hsl.h}, ${hsl.s}%, 50%),
                  hsl(${hsl.h}, ${hsl.s}%, 100%)
                )`,
              }}
            />
            <Slider
              value={[hsl.l]}
              onValueChange={(v) => handleChange('l', v)}
              max={100}
              step={1}
              className="mt-1"
            />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
