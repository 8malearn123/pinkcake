import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { LocalImageDrop } from '@/components/ds';
import { RiyalSymbol } from '@/components/ui/riyal';
import { toArabicDigits } from '@/lib/arabicNumerals';
import { priceCombo } from '@/lib/combos';
import {
  MAX_COMBO_MEMBERS,
  MAX_DISCOUNT_PCT,
  MIN_COMBO_MEMBERS,
  type ComboDraft,
  type ComboItem,
} from '@/lib/combosCatalog/types';
import { ComboProductPicker, type PickableProduct } from './ComboProductPicker';

const HEX = /^#[0-9a-fA-F]{6}$/;

const comboSchema = z.object({
  name: z.string().trim().min(2, 'اسم الكومبو مطلوب (حرفين على الأقل)').max(60, 'الاسم طويل جداً'),
  tagline: z.string().trim().max(80, 'الوصف القصير طويل جداً'),
  items: z
    .array(z.string())
    .min(MIN_COMBO_MEMBERS, `اختر ${MIN_COMBO_MEMBERS} منتجات على الأقل`)
    .max(MAX_COMBO_MEMBERS, `الحد الأقصى ${MAX_COMBO_MEMBERS} منتجات`),
  discountPct: z.coerce
    .number()
    .int('أدخل رقماً صحيحاً')
    .min(0, 'الخصم لا يقل عن ٠٪')
    .max(MAX_DISCOUNT_PCT, `الخصم لا يزيد عن ${MAX_DISCOUNT_PCT}٪`),
  accent: z.string().regex(HEX, 'أدخل لوناً بصيغة #RRGGBB'),
  heroImageUrl: z.string().trim().max(500, 'الرابط طويل جداً'),
  best: z.boolean(),
  isActive: z.boolean(),
});

type ComboFormValues = z.infer<typeof comboSchema>;

interface ComboFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  combo?: ComboItem | null;
  products: PickableProduct[];
  /** Resolved hero of the combo being edited, if it already has an uploaded one. */
  currentHeroUrl?: string;
  onSubmit: (draft: ComboDraft, heroFile: File | null) => Promise<boolean>;
  onClearHero?: () => void;
}

const DEFAULTS: ComboFormValues = {
  name: '',
  tagline: '',
  items: [],
  discountPct: 15,
  accent: '#612e37',
  heroImageUrl: '',
  best: false,
  isActive: true,
};

function toValues(combo?: ComboItem | null): ComboFormValues {
  if (!combo) return DEFAULTS;
  return {
    name: combo.name,
    tagline: combo.tagline,
    items: [...combo.items],
    discountPct: combo.discountPct,
    accent: combo.accent,
    heroImageUrl: combo.heroImageUrl ?? '',
    best: combo.best,
    isActive: combo.isActive,
  };
}

export function ComboForm({
  open,
  onOpenChange,
  combo,
  products,
  currentHeroUrl,
  onSubmit,
  onClearHero,
}: ComboFormProps) {
  const [heroFile, setHeroFile] = useState<File | null>(null);
  const [heroPreview, setHeroPreview] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const form = useForm<ComboFormValues>({
    resolver: zodResolver(comboSchema),
    defaultValues: toValues(combo),
  });

  useEffect(() => {
    if (open) form.reset(toValues(combo));
  }, [combo, open, form]);

  // The pending upload is a local object URL; revoke it when it is replaced or
  // the dialog closes, otherwise every re-pick leaks a blob for the session.
  useEffect(() => {
    if (!heroFile) return;
    const url = URL.createObjectURL(heroFile);
    setHeroPreview(url);
    return () => {
      URL.revokeObjectURL(url);
      setHeroPreview(null);
    };
  }, [heroFile]);

  useEffect(() => {
    if (!open) setHeroFile(null);
  }, [open]);

  const items = form.watch('items');
  const discountPct = form.watch('discountPct');
  const accent = form.watch('accent');
  const typedUrl = form.watch('heroImageUrl');

  const members = items
    .map((id) => products.find((p) => p.id === id))
    .filter((p): p is PickableProduct => !!p);
  const pricing = priceCombo(members, Number(discountPct) || 0);

  const preview = heroPreview ?? currentHeroUrl ?? (typedUrl.trim() || undefined);

  const handleSubmit = async (values: ComboFormValues) => {
    setSaving(true);
    try {
      const ok = await onSubmit(
        {
          name: values.name,
          tagline: values.tagline,
          items: values.items,
          discountPct: values.discountPct,
          accent: values.accent,
          heroImageUrl: values.heroImageUrl,
          best: values.best,
          isActive: values.isActive,
        },
        heroFile,
      );
      if (ok) onOpenChange(false);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] max-w-2xl overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{combo ? 'تعديل الكومبو' : 'إضافة كومبو جديد'}</DialogTitle>
          <DialogDescription>
            الأسعار تُحسب تلقائياً من أسعار المنتجات المختارة — لا يوجد سعر ثابت يمكن أن يتعارض مع
            السلة.
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-5">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>اسم الكومبو</FormLabel>
                  <FormControl>
                    <Input placeholder="كومبو العائلة" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="tagline"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>الوصف القصير</FormLabel>
                  <FormControl>
                    <Input placeholder="لمّة العيلة تكتمل بالحلا" {...field} />
                  </FormControl>
                  <FormDescription>يظهر فوق اسم الكومبو على البطاقة.</FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="items"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>منتجات الكومبو</FormLabel>
                  <FormControl>
                    <ComboProductPicker
                      products={products}
                      value={field.value}
                      onChange={field.onChange}
                      disabled={saving}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid gap-5 sm:grid-cols-2">
              <FormField
                control={form.control}
                name="discountPct"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>نسبة الخصم (٪)</FormLabel>
                    <FormControl>
                      <Input type="number" min={0} max={MAX_DISCOUNT_PCT} step={1} {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="accent"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>اللون المميّز</FormLabel>
                    <div className="flex items-center gap-2">
                      <input
                        type="color"
                        aria-label="اختيار اللون المميّز"
                        value={HEX.test(field.value) ? field.value : '#612e37'}
                        onChange={(event) => field.onChange(event.target.value)}
                        className="h-10 w-12 shrink-0 cursor-pointer rounded-lg border border-border bg-transparent p-1"
                      />
                      <FormControl>
                        <Input dir="ltr" className="text-start" placeholder="#612e37" {...field} />
                      </FormControl>
                    </div>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Live pricing — the same maths the storefront card runs. */}
            <div className="rounded-xl border border-border/60 bg-muted/30 p-4">
              <p className="text-xs font-medium text-muted-foreground">السعر كما سيظهر للعميل</p>
              {members.length < MIN_COMBO_MEMBERS ? (
                <p className="mt-2 text-sm text-warning">
                  اختر {MIN_COMBO_MEMBERS} منتجات على الأقل ليظهر السعر.
                </p>
              ) : (
                <div className="mt-2 flex flex-wrap items-baseline gap-x-4 gap-y-1">
                  <span className="flex items-baseline gap-1.5 text-2xl font-semibold text-primary">
                    {toArabicDigits(pricing.price)} <RiyalSymbol className="text-base" />
                  </span>
                  <span className="flex items-baseline gap-1 text-sm text-muted-foreground line-through">
                    {toArabicDigits(pricing.original)} <RiyalSymbol className="text-[10px]" />
                  </span>
                  <span
                    className="rounded-full px-2.5 py-0.5 text-xs font-bold text-white"
                    style={{ backgroundColor: HEX.test(accent) ? accent : '#612e37' }}
                  >
                    وفّر {toArabicDigits(pricing.save)} ({toArabicDigits(pricing.pct)}٪)
                  </span>
                </div>
              )}
            </div>

            <FormField
              control={form.control}
              name="heroImageUrl"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>صورة الكومبو</FormLabel>
                  <div className="grid gap-3 sm:grid-cols-[auto_1fr] sm:items-start">
                    <LocalImageDrop
                      variant="block"
                      label="صورة الكومبو"
                      previewUrl={preview}
                      onSelect={(file) => setHeroFile(file)}
                      onClear={
                        heroFile
                          ? () => setHeroFile(null)
                          : combo?.heroImageId && onClearHero
                            ? onClearHero
                            : undefined
                      }
                      busy={saving}
                      title="ارفع صورة الكومبو"
                    />
                    <div className="space-y-2">
                      <FormControl>
                        <Input dir="ltr" className="text-start" placeholder="https://..." {...field} />
                      </FormControl>
                      <FormDescription>
                        الصورة المرفوعة لها الأولوية على الرابط. الصور المرفوعة تُحفظ في هذا المتصفح
                        فقط.
                      </FormDescription>
                      <FormMessage />
                    </div>
                  </div>
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="best"
              render={({ field }) => (
                <FormItem className="flex flex-row items-center justify-between rounded-xl border border-border/60 p-4">
                  <div className="space-y-0.5">
                    <FormLabel>الأكثر توفيراً</FormLabel>
                    <FormDescription>
                      البطاقة الكبيرة المميّزة — كومبو واحد فقط يحملها في كل وقت.
                    </FormDescription>
                  </div>
                  <FormControl>
                    <Switch checked={field.value} onCheckedChange={field.onChange} />
                  </FormControl>
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="isActive"
              render={({ field }) => (
                <FormItem className="flex flex-row items-center justify-between rounded-xl border border-border/60 p-4">
                  <div className="space-y-0.5">
                    <FormLabel>ظاهر في المتجر</FormLabel>
                    <FormDescription>أوقفه لإخفاء الكومبو دون حذفه.</FormDescription>
                  </div>
                  <FormControl>
                    <Switch checked={field.value} onCheckedChange={field.onChange} />
                  </FormControl>
                </FormItem>
              )}
            />

            <DialogFooter className="gap-2">
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                إلغاء
              </Button>
              <Button type="submit" disabled={saving} className="gap-2">
                {saving && <Loader2 className="size-4 animate-spin" />}
                {combo ? 'حفظ التعديلات' : 'إضافة الكومبو'}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
