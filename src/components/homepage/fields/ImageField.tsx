import { useRef, useState } from 'react';
import { useFormContext, useWatch } from 'react-hook-form';
import { ImageIcon, Loader2, Upload } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { toast } from '@/hooks/use-toast';
import { uploadStoreImage } from '@/lib/imageUpload';
import { ALLOWED_IMAGE_TYPES } from '@/lib/imageFiles';
import { DEMO_MODE } from '@/lib/demo/config';

/**
 * صورة قسم: رابط + نصّ بديل + رفع.
 *
 * حقل الرابط موجود دائماً وليس تنازلاً: صور المتجر اليوم روابط Unsplash، وفي
 * الوضع التجريبي يعيد التخزين `/placeholder.svg` مهما رُفع — فالرابط هو المسار
 * الوحيد الذي يعمل بلا خادم، وزرّ الرفع يُخفى هناك بدل أن يَعِد بما لا يفعله.
 *
 * المعاينة تُقرأ من قيمة النموذج لا من حالة داخلية، كي تتبع ما يكتبه المدير في
 * حقل الرابط لا رفعه الأخير فقط.
 */
export function ImageField({ name, label }: { name: string; label: string }) {
  const form = useFormContext();
  const [isUploading, setIsUploading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const url = useWatch({ control: form.control, name: `${name}.url` }) as string | undefined;

  const handleFile = async (file: File | undefined) => {
    if (!file) return;
    setIsUploading(true);
    const result = await uploadStoreImage(file, 'homepage');
    setIsUploading(false);
    if (inputRef.current) inputRef.current.value = '';

    if (result.error) {
      toast({ ...result.error, variant: 'destructive' });
      return;
    }
    form.setValue(`${name}.url`, result.url, { shouldDirty: true, shouldValidate: true });
    toast({ title: 'تم الرفع', description: 'تم رفع الصورة بنجاح' });
  };

  return (
    <div className="space-y-3 rounded-lg border border-border bg-muted/30 p-4">
      <p className="text-sm font-bold">{label}</p>

      <div className="flex flex-wrap items-start gap-4">
        <div className="grid size-24 shrink-0 place-items-center overflow-hidden rounded-lg border bg-card">
          {url ? (
            <img src={url} alt="" className="size-full object-cover" />
          ) : (
            <ImageIcon className="size-6 text-muted-foreground" />
          )}
        </div>

        <div className="min-w-[16rem] flex-1 space-y-3">
          <FormField
            control={form.control}
            name={`${name}.url`}
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-xs">رابط الصورة</FormLabel>
                <FormControl>
                  {/* الروابط لاتينية دائماً، فتُعرض من اليسار مهما كانت الصفحة */}
                  <Input {...field} dir="ltr" className="text-start" placeholder="https://…" />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name={`${name}.alt`}
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-xs">
                  النصّ البديل <span className="font-normal text-muted-foreground">(لقارئ الشاشة — اتركه فارغاً للصور الزخرفية)</span>
                </FormLabel>
                <FormControl>
                  <Input {...field} placeholder="وصف موجز للصورة" />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          {DEMO_MODE ? (
            <p className="text-xs text-muted-foreground">
              رفع الصور معطّل في الوضع التجريبي — الصق رابط صورة بالأعلى.
            </p>
          ) : (
            <>
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="gap-2"
                disabled={isUploading}
                onClick={() => inputRef.current?.click()}
              >
                {isUploading ? <Loader2 className="size-4 animate-spin" /> : <Upload className="size-4" />}
                {isUploading ? 'جاري الرفع…' : 'رفع صورة'}
              </Button>
              <Input
                ref={inputRef}
                type="file"
                accept={ALLOWED_IMAGE_TYPES.join(',')}
                className="hidden"
                onChange={(e) => handleFile(e.target.files?.[0])}
              />
            </>
          )}
        </div>
      </div>
    </div>
  );
}
