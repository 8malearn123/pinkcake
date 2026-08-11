import { Fragment, useState } from 'react';
import { useForm, useFormState, useWatch, type Path, type UseFormReturn } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { SectionCard } from '@/components/ds';
import { useBranches } from '@/hooks/useBranches';
import { useCreateCustomOrder, CustomOrderFormData } from '@/hooks/useCustomOrders';
import {
  Upload,
  Loader2,
  User,
  MapPin,
  Sparkles,
  ClipboardCheck,
  Check,
  X,
  ArrowRight,
  ArrowLeft,
  Pencil,
  Wand2,
  Trash2,
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { nameSchema, ksaPhoneSchema } from '@/lib/validation';
import { cn } from '@/lib/utils';
import { CustomerLookup, type CustomerLookupStatus } from '@/components/orders/CustomerLookup';
import { CakeDesignerDialog } from '@/components/orders/CakeDesignerDialog';
import { useCatalogSession } from '@/hooks/useCatalogSession';
import type { CartCakeDesign } from '@/lib/cakeStudio';

const customOrderSchema = z.object({
  customerName: nameSchema,
  customerPhone: ksaPhoneSchema,
  customerAddress: z.string().optional(),
  branchId: z.string().min(1, 'اختر الفرع'),
  pickupDate: z.string().min(1, 'تاريخ الاستلام مطلوب'),
  pickupTime: z.string().min(1, 'وقت الاستلام مطلوب'),
  productType: z.string().min(1, 'نوع المنتج مطلوب'),
  occasion: z.string().optional(),
  numberOfPeople: z.coerce.number().optional(),
  flavor: z.string().optional(),
  filling: z.string().optional(),
  sugarLevel: z.string().optional(),
  designDescription: z.string().optional(),
  writingText: z.string().optional(),
  referenceOrderId: z.string().optional(),
  notes: z.string().optional(),
});

type FormData = z.infer<typeof customOrderSchema>;

interface CustomOrderFormProps {
  onSuccess?: () => void;
  referenceOrderId?: string;
}

const productTypes = [
  'كيك عيد ميلاد',
  'كيك زفاف',
  'كيك تخرج',
  'كيك مناسبة',
  'حلويات مشكلة',
  'طلب خاص',
];

const occasions = [
  'عيد ميلاد',
  'زفاف',
  'خطوبة',
  'تخرج',
  'عيد الأم',
  'رمضان',
  'عيد الفطر',
  'عيد الأضحى',
  'مناسبة عمل',
  'أخرى',
];

const flavors = [
  'شوكولاتة',
  'فانيليا',
  'فراولة',
  'ريد فيلفت',
  'كراميل',
  'مانجو',
  'توت',
  'بستاشيو',
  'لوتس',
];

const fillings = [
  'كريمة',
  'نوتيلا',
  'كراميل',
  'فواكه طازجة',
  'جبن كريمي',
  'موس شوكولاتة',
  'كاسترد',
];

const sugarLevels = ['عادي', 'قليل السكر', 'بدون سكر', 'بديل سكر'];

// The four wizard steps, in order. `fields` drives per-step validation
// (form.trigger) and jump-to-error on final submit.
const STEPS: {
  id: string;
  title: string;
  icon: React.ComponentType<{ className?: string }>;
  fields: Path<FormData>[];
}[] = [
  { id: 'customer', title: 'العميل', icon: User, fields: ['customerName', 'customerPhone', 'customerAddress'] },
  { id: 'pickup', title: 'الاستلام', icon: MapPin, fields: ['branchId', 'pickupDate', 'pickupTime'] },
  {
    id: 'details',
    title: 'التفاصيل',
    icon: Sparkles,
    fields: [
      'productType',
      'occasion',
      'numberOfPeople',
      'flavor',
      'filling',
      'sugarLevel',
      'writingText',
      'designDescription',
      'notes',
    ],
  },
  { id: 'review', title: 'المراجعة', icon: ClipboardCheck, fields: [] },
];

/** Progress stepper — RTL-aware (steps flow right→left under dir="rtl"). */
function Stepper({
  current,
  onStepClick,
}: {
  current: number;
  onStepClick: (index: number) => void;
}) {
  return (
    <div className="flex items-start justify-between gap-2">
      {STEPS.map((step, i) => {
        const done = i < current;
        const active = i === current;
        const Icon = step.icon;
        return (
          <Fragment key={step.id}>
            <button
              type="button"
              disabled={i > current}
              onClick={() => i <= current && onStepClick(i)}
              className="flex shrink-0 flex-col items-center gap-2 disabled:cursor-not-allowed"
            >
              <span
                className={cn(
                  'flex h-11 w-11 items-center justify-center rounded-full border-2 transition-all',
                  active && 'gradient-pink border-transparent text-white shadow-warm',
                  done && 'border-primary/30 bg-primary/10 text-primary',
                  !active && !done && 'border-border bg-muted text-muted-foreground',
                )}
              >
                {done ? <Check className="h-5 w-5" /> : <Icon className="h-5 w-5" />}
              </span>
              <span
                className={cn(
                  'text-xs font-medium transition-colors',
                  active ? 'text-foreground' : 'text-muted-foreground',
                )}
              >
                {step.title}
              </span>
            </button>
            {i < STEPS.length - 1 && (
              <span
                className={cn(
                  'mt-5 h-0.5 flex-1 rounded-full transition-colors',
                  i < current ? 'bg-primary' : 'bg-border',
                )}
              />
            )}
          </Fragment>
        );
      })}
    </div>
  );
}

/** Single-select pill group used for the taste/occasion choices. */
function ChipGroup({
  options,
  value,
  onChange,
}: {
  options: string[];
  value: string | undefined;
  onChange: (value: string) => void;
}) {
  return (
    <div className="flex flex-wrap gap-2">
      {options.map((option) => {
        const active = value === option;
        return (
          <button
            type="button"
            key={option}
            onClick={() => onChange(active ? '' : option)}
            aria-pressed={active}
            className={cn(
              'rounded-full border px-4 py-2 text-sm font-medium transition-all',
              active
                ? 'gradient-pink border-transparent text-white shadow-warm'
                : 'border-border bg-background text-foreground hover:border-primary/50 hover:bg-muted/50',
            )}
          >
            {option}
          </button>
        );
      })}
    </div>
  );
}

/** One label/value row in the review summary. */
function SummaryRow({ label, value }: { label: string; value?: string | number }) {
  const display = value === undefined || value === '' ? '—' : value;
  return (
    <div className="flex items-start justify-between gap-4 border-b border-border/50 py-2 last:border-0">
      <span className="shrink-0 text-sm text-muted-foreground">{label}</span>
      <span className="text-end text-sm font-medium text-foreground">{display}</span>
    </div>
  );
}

export function CustomOrderForm({ onSuccess, referenceOrderId }: CustomOrderFormProps) {
  const { data: branches = [] } = useBranches();
  const createOrder = useCreateCustomOrder();
  const [uploading, setUploading] = useState(false);
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [dragOver, setDragOver] = useState(false);
  const [step, setStep] = useState(0);
  // Step 1 is a lookup, not a blank form: no customer resolved → can't move on.
  const [customerStatus, setCustomerStatus] = useState<CustomerLookupStatus>('idle');
  // A cake built in the studio (same payload the storefront sends) — optional:
  // a written brief is still a valid custom order.
  const [cakeDesign, setCakeDesign] = useState<CartCakeDesign | null>(null);
  const [designerOpen, setDesignerOpen] = useState(false);
  const isReview = step === STEPS.length - 1;

  const form = useForm<FormData>({
    resolver: zodResolver(customOrderSchema),
    mode: 'onTouched',
    defaultValues: {
      customerName: '',
      customerPhone: '',
      customerAddress: '',
      branchId: '',
      pickupDate: '',
      pickupTime: '',
      productType: '',
      occasion: '',
      numberOfPeople: undefined,
      flavor: '',
      filling: '',
      sugarLevel: '',
      designDescription: '',
      writingText: '',
      referenceOrderId: referenceOrderId || '',
      notes: '',
    },
  });

  const uploadFile = async (file: File) => {
    setUploading(true);
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `custom-orders/${Date.now()}.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from('custom-order-images')
        .upload(fileName, file);

      if (uploadError) throw uploadError;

      // For private bucket, generate signed URL instead of public URL
      const { data: signedUrlData, error: signedUrlError } = await supabase.storage
        .from('custom-order-images')
        .createSignedUrl(fileName, 60 * 60 * 24 * 7); // 7 days expiry

      if (signedUrlError) throw signedUrlError;

      setImageUrl(signedUrlData.signedUrl);
      toast({
        title: 'تم رفع الصورة',
        description: 'تم رفع الصورة المرجعية بنجاح',
      });
    } catch (error) {
      console.error('Upload error:', error);
      toast({
        title: 'خطأ',
        description: 'فشل في رفع الصورة',
        variant: 'destructive',
      });
    } finally {
      setUploading(false);
    }
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) uploadFile(file);
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files?.[0];
    if (file && file.type.startsWith('image/')) uploadFile(file);
  };

  const goNext = async () => {
    if (step === 0 && customerStatus === 'idle') {
      toast({
        title: 'حدد العميل أولاً',
        description: 'استعلم برقم الجوال ثم اختر العميل المسجّل أو أضِفه كعميل جديد.',
        variant: 'destructive',
      });
      return;
    }
    const valid = await form.trigger(STEPS[step].fields);
    if (valid) setStep((s) => Math.min(STEPS.length - 1, s + 1));
  };

  const goBack = () => setStep((s) => Math.max(0, s - 1));

  const onSubmit = async (data: FormData) => {
    const formData: CustomOrderFormData = {
      customerName: data.customerName,
      customerPhone: data.customerPhone,
      customerAddress: data.customerAddress,
      branchId: data.branchId,
      pickupDate: data.pickupDate,
      pickupTime: data.pickupTime,
      productType: data.productType,
      occasion: data.occasion,
      numberOfPeople: data.numberOfPeople,
      flavor: data.flavor,
      filling: data.filling,
      sugarLevel: data.sugarLevel,
      designDescription: data.designDescription,
      writingText: data.writingText,
      referenceOrderId: data.referenceOrderId,
      notes: data.notes,
      referenceImageUrl: imageUrl || undefined,
      cakeDesign: cakeDesign ?? undefined,
    };

    await createOrder.mutateAsync(formData);
    form.reset();
    setImageUrl(null);
    setStep(0);
    setCustomerStatus('idle');
    setCakeDesign(null);
    onSuccess?.();
  };

  // If final validation fails, jump to the first step that has an errored field.
  const onInvalid = (errors: Record<string, unknown>) => {
    const firstBadStep = STEPS.findIndex((s) => s.fields.some((f) => errors[f]));
    if (firstBadStep >= 0) setStep(firstBadStep);
  };

  // Read (don't subscribe) for the review summary — the review step has no
  // editable inputs, so form.getValues() at render is enough. Using form.watch()
  // here would re-render the whole form on every keystroke/blur and can cancel
  // the "next" click mid-interaction.
  const values = form.getValues();
  const branchName = branches.find((b) => b.id === values.branchId)?.name;

  return (
    <Form {...form}>
      <form
        onSubmit={form.handleSubmit(onSubmit, onInvalid)}
        // Don't let Enter submit the whole form from an early step's input.
        onKeyDown={(e) => {
          if (
            e.key === 'Enter' &&
            !isReview &&
            (e.target as HTMLElement).tagName !== 'TEXTAREA'
          ) {
            e.preventDefault();
          }
        }}
        className="space-y-6"
      >
        <div className="glass-card rounded-2xl p-6">
          <Stepper current={step} onStepClick={setStep} />
        </div>

        {/* Step 1 — Customer */}
        {step === 0 && (
          <SectionCard title="معلومات العميل" icon={User} className="animate-fade-in">
            <CustomerStep
              form={form}
              status={customerStatus}
              onStatusChange={setCustomerStatus}
            />
          </SectionCard>
        )}

        {/* Step 2 — Pickup */}
        {step === 1 && (
          <SectionCard
            title="معلومات الاستلام"
            icon={MapPin}
            className="animate-fade-in"
            contentClassName="grid gap-4 md:grid-cols-3"
          >
            <FormField
              control={form.control}
              name="branchId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>فرع الاستلام *</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="اختر الفرع" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {branches.map((branch) => (
                        <SelectItem key={branch.id} value={branch.id}>
                          {branch.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="pickupDate"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>تاريخ الاستلام *</FormLabel>
                  <FormControl>
                    <Input type="date" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="pickupTime"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>وقت الاستلام *</FormLabel>
                  <FormControl>
                    <Input type="time" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </SectionCard>
        )}

        {/* Step 3 — Details */}
        {step === 2 && (
          <SectionCard
            title="تفاصيل الطلب المخصص"
            icon={Sparkles}
            className="animate-fade-in"
            contentClassName="space-y-6"
          >
            <FormField
              control={form.control}
              name="productType"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>نوع المنتج *</FormLabel>
                  <FormControl>
                    <ChipGroup options={productTypes} value={field.value} onChange={field.onChange} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="occasion"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>المناسبة</FormLabel>
                  <FormControl>
                    <ChipGroup options={occasions} value={field.value} onChange={field.onChange} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="numberOfPeople"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>عدد الأشخاص</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      {...field}
                      value={field.value ?? ''}
                      placeholder="مثال: 20"
                      min={1}
                      className="max-w-[200px]"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="flavor"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>النكهة</FormLabel>
                  <FormControl>
                    <ChipGroup options={flavors} value={field.value} onChange={field.onChange} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="filling"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>الحشوة</FormLabel>
                  <FormControl>
                    <ChipGroup options={fillings} value={field.value} onChange={field.onChange} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="sugarLevel"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>مستوى السكر</FormLabel>
                  <FormControl>
                    <ChipGroup options={sugarLevels} value={field.value} onChange={field.onChange} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="writingText"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>نص الكتابة على الكيك</FormLabel>
                  <FormControl>
                    <Input {...field} placeholder="مثال: عيد ميلاد سعيد يا محمد" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="designDescription"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>وصف التصميم</FormLabel>
                  <FormControl>
                    <Textarea {...field} placeholder="صف التصميم المطلوب بالتفصيل..." rows={3} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Cake studio — build the exact cake instead of describing it */}
            <div>
              <FormLabel>تصميم الكيك</FormLabel>
              {cakeDesign ? (
                <CakeDesignCard
                  design={cakeDesign}
                  onEdit={() => setDesignerOpen(true)}
                  onRemove={() => setCakeDesign(null)}
                />
              ) : (
                <div className="mt-2 flex flex-col items-start gap-3 rounded-2xl border border-dashed border-border p-6 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <p className="text-sm font-medium text-foreground">ابنِ الكيك من الاستوديو</p>
                    <p className="text-sm text-muted-foreground">
                      اختر القاعدة والنكهة واللون من الصور المتوفرة — يصل التصميم للمطبخ كما هو.
                    </p>
                  </div>
                  <Button type="button" variant="outline" onClick={() => setDesignerOpen(true)}>
                    <Wand2 className="me-2 h-4 w-4" />
                    تصميم الكيك
                  </Button>
                </div>
              )}
            </div>

            {/* Reference image — drag & drop */}
            <div>
              <FormLabel>صورة مرجعية</FormLabel>
              <div
                onDragOver={(e) => {
                  e.preventDefault();
                  setDragOver(true);
                }}
                onDragLeave={() => setDragOver(false)}
                onDrop={handleDrop}
                className={cn(
                  'mt-2 rounded-2xl border-2 border-dashed p-6 transition-colors',
                  dragOver ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/40',
                )}
              >
                {imageUrl ? (
                  <div className="flex items-center gap-4">
                    <img
                      src={imageUrl}
                      alt="مرجع"
                      className="h-20 w-20 rounded-xl object-cover shadow-sm"
                    />
                    <div className="space-y-1">
                      <p className="text-sm font-medium text-foreground">تم رفع الصورة المرجعية</p>
                      <button
                        type="button"
                        onClick={() => setImageUrl(null)}
                        className="inline-flex items-center gap-1 text-sm text-destructive hover:underline"
                      >
                        <X className="h-4 w-4" />
                        إزالة الصورة
                      </button>
                    </div>
                  </div>
                ) : (
                  <label className="flex cursor-pointer flex-col items-center justify-center gap-2 py-2 text-center">
                    {uploading ? (
                      <Loader2 className="h-6 w-6 animate-spin text-primary" />
                    ) : (
                      <Upload className="h-6 w-6 text-muted-foreground" />
                    )}
                    <span className="text-sm font-medium text-foreground">
                      {uploading ? 'جاري الرفع...' : 'اسحب صورة هنا أو اضغط للاختيار'}
                    </span>
                    <span className="text-xs text-muted-foreground">PNG أو JPG</span>
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={handleImageUpload}
                      disabled={uploading}
                    />
                  </label>
                )}
              </div>
            </div>

            <FormField
              control={form.control}
              name="notes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>ملاحظات إضافية</FormLabel>
                  <FormControl>
                    <Textarea {...field} placeholder="أي ملاحظات أخرى..." rows={2} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {referenceOrderId && (
              <FormField
                control={form.control}
                name="referenceOrderId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>مرتبط بطلب سابق</FormLabel>
                    <FormControl>
                      <Input {...field} disabled />
                    </FormControl>
                  </FormItem>
                )}
              />
            )}
          </SectionCard>
        )}

        {/* Step 4 — Review */}
        {isReview && (
          <SectionCard
            title="مراجعة الطلب"
            icon={ClipboardCheck}
            className="animate-fade-in"
            contentClassName="space-y-6"
          >
            <p className="text-sm text-muted-foreground">
              راجع تفاصيل الطلب قبل الإرسال. سيتم إرساله للمطبخ لتحديد السعر ووقت التحضير.
            </p>

            <ReviewGroup title="معلومات العميل" onEdit={() => setStep(0)}>
              <SummaryRow label="اسم العميل" value={values.customerName} />
              <SummaryRow label="رقم الهاتف" value={values.customerPhone} />
              <SummaryRow label="العنوان" value={values.customerAddress} />
            </ReviewGroup>

            <ReviewGroup title="معلومات الاستلام" onEdit={() => setStep(1)}>
              <SummaryRow label="الفرع" value={branchName} />
              <SummaryRow label="تاريخ الاستلام" value={values.pickupDate} />
              <SummaryRow label="وقت الاستلام" value={values.pickupTime} />
            </ReviewGroup>

            <ReviewGroup title="تفاصيل الطلب" onEdit={() => setStep(2)}>
              <SummaryRow label="نوع المنتج" value={values.productType} />
              <SummaryRow label="المناسبة" value={values.occasion} />
              <SummaryRow label="عدد الأشخاص" value={values.numberOfPeople} />
              <SummaryRow label="النكهة" value={values.flavor} />
              <SummaryRow label="الحشوة" value={values.filling} />
              <SummaryRow label="مستوى السكر" value={values.sugarLevel} />
              <SummaryRow
                label="تصميم الكيك"
                value={cakeDesign ? [cakeDesign.cakeName, ...cakeDesign.pathLabels].join(' · ') : undefined}
              />
              <SummaryRow label="نص الكتابة" value={values.writingText} />
              <SummaryRow label="وصف التصميم" value={values.designDescription} />
              <SummaryRow label="ملاحظات" value={values.notes} />
              {imageUrl && (
                <div className="flex items-center justify-between gap-4 py-2">
                  <span className="text-sm text-muted-foreground">صورة مرجعية</span>
                  <img src={imageUrl} alt="مرجع" className="h-14 w-14 rounded-lg object-cover" />
                </div>
              )}
            </ReviewGroup>
          </SectionCard>
        )}

        {/* Navigation */}
        <div className="flex items-center justify-between gap-4">
          {step > 0 ? (
            <Button type="button" variant="outline" onClick={goBack}>
              <ArrowRight className="me-2 h-4 w-4" />
              السابق
            </Button>
          ) : (
            <span />
          )}

          {isReview ? (
            // type="button" + explicit submit (not type="submit"): advancing into
            // the review step must never trigger a native form-submit as a side
            // effect. The distinct key stops React from reusing the "next" button's
            // DOM node (which would otherwise flip type mid-click and auto-submit).
            <Button
              key="submit"
              type="button"
              onClick={form.handleSubmit(onSubmit, onInvalid)}
              disabled={createOrder.isPending}
              className="min-w-[150px]"
            >
              {createOrder.isPending ? (
                <>
                  <Loader2 className="me-2 h-4 w-4 animate-spin" />
                  جاري الإرسال...
                </>
              ) : (
                'إرسال للمطبخ'
              )}
            </Button>
          ) : (
            <Button
              key="next"
              type="button"
              // Keep focus on the active field so pressing "next" doesn't blur it
              // first — an on-blur validation re-render can shift layout and
              // swallow the click. goNext() validates the step explicitly.
              onMouseDown={(e) => e.preventDefault()}
              onClick={goNext}
              className="min-w-[120px]"
            >
              التالي
              <ArrowLeft className="ms-2 h-4 w-4" />
            </Button>
          )}
        </div>
      </form>

      <CakeDesignerDialog
        open={designerOpen}
        onOpenChange={setDesignerOpen}
        onConfirm={setCakeDesign}
      />
    </Form>
  );
}

/**
 * Bridges the shared phone-lookup UI to react-hook-form. It lives in its own
 * component so the field subscriptions (useWatch/useFormState) re-render the
 * customer step only — never the whole wizard on every keystroke.
 */
function CustomerStep({
  form,
  status,
  onStatusChange,
}: {
  form: UseFormReturn<FormData>;
  status: CustomerLookupStatus;
  onStatusChange: (status: CustomerLookupStatus) => void;
}) {
  const [name, phone, address] = useWatch({
    control: form.control,
    name: ['customerName', 'customerPhone', 'customerAddress'],
  });
  const { errors } = useFormState({ control: form.control });

  const setField = (field: 'customerName' | 'customerPhone' | 'customerAddress', value: string) =>
    // Re-validate only a field that's already showing an error, so the message
    // clears as staff type without validating untouched fields early.
    form.setValue(field, value, { shouldDirty: true, shouldValidate: !!errors[field] });

  return (
    <CustomerLookup
      value={{ name: name ?? '', phone: phone ?? '', address: address ?? '' }}
      onChange={(patch) => {
        if (patch.name !== undefined) setField('customerName', patch.name);
        if (patch.phone !== undefined) setField('customerPhone', patch.phone);
        if (patch.address !== undefined) setField('customerAddress', patch.address);
      }}
      status={status}
      onStatusChange={onStatusChange}
      errors={{
        name: errors.customerName?.message,
        phone: errors.customerPhone?.message,
        address: errors.customerAddress?.message,
      }}
    />
  );
}

/** The chosen studio design: photo (when the catalogue has one) + its labels. */
function CakeDesignCard({
  design,
  onEdit,
  onRemove,
}: {
  design: CartCakeDesign;
  onEdit: () => void;
  onRemove: () => void;
}) {
  const { urlFor } = useCatalogSession();
  const photo = urlFor(design.photoImageId);

  return (
    <div className="mt-2 flex flex-col gap-4 rounded-2xl border border-primary/20 bg-primary/5 p-4 sm:flex-row sm:items-center">
      {photo ? (
        <img src={photo} alt={design.cakeName} className="h-24 w-24 shrink-0 rounded-xl object-cover" />
      ) : (
        <span className="grid size-24 shrink-0 place-items-center rounded-xl bg-primary/10 text-primary">
          <Wand2 className="h-7 w-7" />
        </span>
      )}
      <div className="min-w-0 flex-1">
        <p className="font-bold text-foreground">{design.cakeName}</p>
        <dl className="mt-1 flex flex-wrap gap-x-4 gap-y-1 text-sm text-muted-foreground">
          {design.pathLabels.map((label, i) => (
            <div key={`${design.levelLabels[i]}-${label}`} className="flex gap-1">
              <dt>{design.levelLabels[i]}:</dt>
              <dd className="font-medium text-foreground">{label}</dd>
            </div>
          ))}
        </dl>
      </div>
      <div className="flex shrink-0 gap-2">
        <Button type="button" variant="outline" size="sm" onClick={onEdit}>
          <Pencil className="me-2 h-3.5 w-3.5" />
          تعديل
        </Button>
        <Button type="button" variant="ghost" size="sm" onClick={onRemove} className="text-destructive">
          <Trash2 className="me-2 h-3.5 w-3.5" />
          إزالة
        </Button>
      </div>
    </div>
  );
}

/** A titled block inside the review step, with a jump-to-step edit button. */
function ReviewGroup({
  title,
  onEdit,
  children,
}: {
  title: string;
  onEdit: () => void;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-xl border border-border/60 bg-muted/30 p-4">
      <div className="mb-2 flex items-center justify-between">
        <h3 className="font-bold text-foreground">{title}</h3>
        <button
          type="button"
          onClick={onEdit}
          className="inline-flex items-center gap-1 text-sm text-primary hover:underline"
        >
          <Pencil className="h-3.5 w-3.5" />
          تعديل
        </button>
      </div>
      <div>{children}</div>
    </div>
  );
}
