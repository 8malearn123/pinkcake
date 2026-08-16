import { useEffect, useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Loader2 } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { useSaveOccasion, type OccasionInput } from '@/hooks/useLoyalty';
import {
  HIJRI_MONTHS,
  OCCASION_TYPES,
  daysInMonth,
  type LoyaltyOccasion,
  type OccasionType,
} from '@/lib/loyalty/program';

interface OccasionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** المناسبة عند التعديل، أو null عند الإضافة. */
  occasion?: LoyaltyOccasion | null;
}

/**
 * إضافة/تعديل مناسبة — ثلاثة حقول ولا شيء غيرها.
 *
 * **لا سنة ولا رقم جوال للمُهدى إليه.** الحقلان اللذان يبدوان «مفيدين» هما
 * بالضبط ما يحوّل السجل من أداة تذكير إلى بيانات شخصية عن طرف ثالث: نظام حماية
 * البيانات (م.٢٦) يمنع تسويقاً لمن لم نأخذ بياناته منه مباشرة، وسنة الميلاد
 * تجرّ التزامات إضافية حين يتعلّق الأمر بالأطفال. فنحفظ نصّاً وتاريخاً فقط.
 */
export function OccasionDialog({ open, onOpenChange, occasion }: OccasionDialogProps) {
  const save = useSaveOccasion();

  const [label, setLabel] = useState('');
  const [type, setType] = useState<OccasionType>('birthday');
  const [month, setMonth] = useState(1);
  const [day, setDay] = useState(1);

  useEffect(() => {
    if (!open) return;
    setLabel(occasion?.label ?? '');
    setType(occasion?.occasion_type ?? 'birthday');
    setMonth(occasion?.occasion_month ?? 1);
    setDay(occasion?.occasion_day ?? 1);
  }, [open, occasion]);

  // تغيير الشهر لا يترك يوماً مستحيلاً معلّقاً (٣١ فبراير).
  useEffect(() => {
    setDay((d) => Math.min(d, daysInMonth(month)));
  }, [month]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!label.trim()) {
      toast({ title: 'اكتبي اسم المناسبة', variant: 'destructive' });
      return;
    }

    const payload: OccasionInput = {
      id: occasion?.id ?? null,
      label: label.trim(),
      occasion_type: type,
      occasion_day: day,
      occasion_month: month,
    };

    save.mutate(payload, { onSuccess: () => onOpenChange(false) });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{occasion ? 'تعديل المناسبة' : 'أضيفي مناسبة'}</DialogTitle>
          <DialogDescription>
            نحفظ الاسم واليوم والشهر فقط — بلا سنة وبلا أي بيانات تواصل لغيرك.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="occasion-label">المناسبة لمن؟</Label>
            <Input
              id="occasion-label"
              value={label}
              onChange={(e) => setLabel(e.target.value)}
              placeholder="ماما · سارة · فريق العمل"
              maxLength={60}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="occasion-type">نوع المناسبة</Label>
            <Select value={type} onValueChange={(v) => setType(v as OccasionType)}>
              <SelectTrigger id="occasion-type">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {OCCASION_TYPES.map((t) => (
                  <SelectItem key={t.value} value={t.value}>
                    {t.emoji} {t.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label htmlFor="occasion-month">الشهر</Label>
              <Select value={String(month)} onValueChange={(v) => setMonth(Number(v))}>
                <SelectTrigger id="occasion-month">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {HIJRI_MONTHS.map((m, i) => (
                    <SelectItem key={m} value={String(i + 1)}>
                      {m}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="occasion-day">اليوم</Label>
              <Select value={String(day)} onValueChange={(v) => setDay(Number(v))}>
                <SelectTrigger id="occasion-day">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Array.from({ length: daysInMonth(month) }, (_, i) => i + 1).map((d) => (
                    <SelectItem key={d} value={String(d)}>
                      {d}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <DialogFooter className="gap-2 sm:gap-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              إلغاء
            </Button>
            <Button type="submit" disabled={save.isPending}>
              {save.isPending && <Loader2 className="size-4 me-2 animate-spin" />}
              حفظ
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
