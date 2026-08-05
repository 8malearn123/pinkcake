import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Layers, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { RiyalSymbol } from '@/components/ui/riyal';
import { EmptyState, LocalImageDrop, SectionCard } from '@/components/ds';
import { useCakeCatalog } from '@/contexts/CakeCatalogContext';
import { CakeWorkbench } from './CakeWorkbench';

const cakeSchema = z.object({
  name: z.string().trim().min(2, 'اسم الكيكة مطلوب (حرفان على الأقل)').max(80, 'الاسم طويل جداً'),
  basePrice: z.coerce
    .number({ invalid_type_error: 'أدخل رقماً' })
    .min(0, 'السعر يجب أن يكون 0 أو أكثر')
    .max(100000, 'السعر مرتفع جداً'),
  serves: z.string().trim().min(1, 'اذكر عدد الأشخاص').max(40, 'اختصر أكثر'),
  leadTime: z.string().trim().min(1, 'اذكر مدة التحضير').max(40, 'اختصر أكثر'),
});

type CakeFormValues = z.infer<typeof cakeSchema>;

/**
 * تبويب «أضف كيكة»: نموذج إنشاء كيكة جديدة، أو طاولة عمل الكيكة المفتوحة.
 */
export function AddCakeTab() {
  const { catalog, workingCakeId, setTab, createCake } = useCakeCatalog();
  const [previewFile, setPreviewFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | undefined>(undefined);
  const [previewMissing, setPreviewMissing] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const form = useForm<CakeFormValues>({
    resolver: zodResolver(cakeSchema),
    defaultValues: { name: '', basePrice: 0, serves: '', leadTime: '' },
  });

  // A local object URL only for the not-yet-saved file; the context owns every
  // URL that belongs to a stored blob.
  useEffect(() => {
    if (!previewFile) {
      setPreviewUrl(undefined);
      return;
    }
    const url = URL.createObjectURL(previewFile);
    setPreviewUrl(url);
    return () => URL.revokeObjectURL(url);
  }, [previewFile]);

  if (catalog.levels.length === 0) {
    return (
      <EmptyState
        icon={Layers}
        title="أضف المستويات أولاً"
        description="لا يمكن تصوير التشكيلات قبل تعريف خطوات التصميم."
        action={<Button onClick={() => setTab('levels')}>افتح المستويات والخيارات</Button>}
      />
    );
  }

  const workingCake = workingCakeId
    ? catalog.cakes.find((cake) => cake.id === workingCakeId)
    : undefined;

  if (workingCake) return <CakeWorkbench key={workingCake.id} cakeId={workingCake.id} />;

  const handleSubmit = async (values: CakeFormValues) => {
    if (!previewFile) {
      setPreviewMissing(true);
      return;
    }
    setSubmitting(true);
    try {
      const ok = await createCake(
        {
          name: values.name,
          basePrice: values.basePrice,
          serves: values.serves,
          leadTime: values.leadTime,
        },
        previewFile,
      );
      if (ok) {
        form.reset({ name: '', basePrice: 0, serves: '', leadTime: '' });
        setPreviewFile(null);
        setPreviewMissing(false);
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <SectionCard title="كيكة جديدة">
      <Form {...form}>
        <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-5">
          <div className="grid gap-4 sm:grid-cols-2">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>اسم الكيكة</FormLabel>
                  <FormControl>
                    <Input placeholder="مثال: كيكة التوت" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="basePrice"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="flex items-center gap-1">
                    السعر الأساسي (<RiyalSymbol />)
                  </FormLabel>
                  <FormControl>
                    <Input
                      dir="ltr"
                      type="number"
                      min="0"
                      step="1"
                      className="tabular-nums"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="serves"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>تكفي</FormLabel>
                  <FormControl>
                    <Input placeholder="6–8" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="leadTime"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>مدة التحضير</FormLabel>
                  <FormControl>
                    <Input placeholder="24 ساعة" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          <div className="space-y-2">
            <p className="text-sm font-medium">صورة العرض</p>
            <LocalImageDrop
              variant="block"
              label="صورة العرض"
              title="اسحب صورة العرض هنا أو اخترها"
              previewUrl={previewUrl}
              disabled={submitting}
              onSelect={(file) => {
                setPreviewFile(file);
                setPreviewMissing(false);
              }}
              onClear={() => setPreviewFile(null)}
            />
            {previewMissing && (
              <p className="text-destructive text-sm">ارفع صورة العرض — العملاء يرونها أولاً</p>
            )}
          </div>

          <Button
            type="submit"
            disabled={submitting}
            className="gradient-pink text-white shadow-warm hover:opacity-90 transition-opacity"
          >
            {submitting && <Loader2 className="w-4 h-4 me-2 animate-spin" />}
            أضف الكيكة
          </Button>
        </form>
      </Form>
    </SectionCard>
  );
}
