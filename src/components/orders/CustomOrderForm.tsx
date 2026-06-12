import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
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
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useBranches } from '@/hooks/useBranches';
import { useCreateCustomOrder, CustomOrderFormData } from '@/hooks/useCustomOrders';
import { Upload, Loader2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';

const customOrderSchema = z.object({
  customerName: z.string().min(2, 'الاسم مطلوب'),
  customerPhone: z.string().min(10, 'رقم الهاتف غير صحيح'),
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

export function CustomOrderForm({ onSuccess, referenceOrderId }: CustomOrderFormProps) {
  const { data: branches = [] } = useBranches();
  const createOrder = useCreateCustomOrder();
  const [uploading, setUploading] = useState(false);
  const [imageUrl, setImageUrl] = useState<string | null>(null);

  const form = useForm<FormData>({
    resolver: zodResolver(customOrderSchema),
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

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

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
      
      const imageUrl = signedUrlData.signedUrl;

      setImageUrl(imageUrl);
      toast({
        title: 'تم رفع الصورة',
        description: 'تم رفع الصورة المرجعية بنجاح',
      });
    } catch (error: any) {
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
    };
    
    await createOrder.mutateAsync(formData);
    form.reset();
    setImageUrl(null);
    onSuccess?.();
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        {/* Customer Info */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">معلومات العميل</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4 md:grid-cols-2">
            <FormField
              control={form.control}
              name="customerName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>اسم العميل *</FormLabel>
                  <FormControl>
                    <Input {...field} placeholder="أدخل اسم العميل" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="customerPhone"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>رقم الهاتف *</FormLabel>
                  <FormControl>
                    <Input {...field} placeholder="05xxxxxxxx" dir="ltr" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="customerAddress"
              render={({ field }) => (
                <FormItem className="md:col-span-2">
                  <FormLabel>العنوان</FormLabel>
                  <FormControl>
                    <Input {...field} placeholder="العنوان (اختياري)" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </CardContent>
        </Card>

        {/* Pickup Info */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">معلومات الاستلام</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4 md:grid-cols-3">
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
          </CardContent>
        </Card>

        {/* Order Details */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">تفاصيل الطلب المخصص</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4 md:grid-cols-2">
            <FormField
              control={form.control}
              name="productType"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>نوع المنتج *</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="اختر نوع المنتج" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {productTypes.map((type) => (
                        <SelectItem key={type} value={type}>
                          {type}
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
              name="occasion"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>المناسبة</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="اختر المناسبة" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {occasions.map((occasion) => (
                        <SelectItem key={occasion} value={occasion}>
                          {occasion}
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
              name="numberOfPeople"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>عدد الأشخاص</FormLabel>
                  <FormControl>
                    <Input 
                      type="number" 
                      {...field} 
                      placeholder="مثال: 20" 
                      min={1}
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
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="اختر النكهة" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {flavors.map((flavor) => (
                        <SelectItem key={flavor} value={flavor}>
                          {flavor}
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
              name="filling"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>الحشوة</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="اختر الحشوة" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {fillings.map((filling) => (
                        <SelectItem key={filling} value={filling}>
                          {filling}
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
              name="sugarLevel"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>مستوى السكر</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="اختر مستوى السكر" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {sugarLevels.map((level) => (
                        <SelectItem key={level} value={level}>
                          {level}
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
              name="writingText"
              render={({ field }) => (
                <FormItem className="md:col-span-2">
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
                <FormItem className="md:col-span-2">
                  <FormLabel>وصف التصميم</FormLabel>
                  <FormControl>
                    <Textarea 
                      {...field} 
                      placeholder="صف التصميم المطلوب بالتفصيل..."
                      rows={3}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Image Upload */}
            <div className="md:col-span-2">
              <Label>صورة مرجعية</Label>
              <div className="mt-2 flex items-center gap-4">
                <label className="flex cursor-pointer items-center gap-2 rounded-md border border-dashed border-muted-foreground/50 px-4 py-3 hover:bg-muted/50">
                  {uploading ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Upload className="h-4 w-4" />
                  )}
                  <span className="text-sm">
                    {uploading ? 'جاري الرفع...' : 'اختر صورة'}
                  </span>
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={handleImageUpload}
                    disabled={uploading}
                  />
                </label>
                {imageUrl && (
                  <img
                    src={imageUrl}
                    alt="Reference"
                    className="h-16 w-16 rounded-md object-cover"
                  />
                )}
              </div>
            </div>

            <FormField
              control={form.control}
              name="notes"
              render={({ field }) => (
                <FormItem className="md:col-span-2">
                  <FormLabel>ملاحظات إضافية</FormLabel>
                  <FormControl>
                    <Textarea 
                      {...field} 
                      placeholder="أي ملاحظات أخرى..."
                      rows={2}
                    />
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
                  <FormItem className="md:col-span-2">
                    <FormLabel>مرتبط بطلب سابق</FormLabel>
                    <FormControl>
                      <Input {...field} disabled />
                    </FormControl>
                  </FormItem>
                )}
              />
            )}
          </CardContent>
        </Card>

        <div className="flex justify-end gap-4">
          <Button 
            type="submit" 
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
        </div>
      </form>
    </Form>
  );
}
