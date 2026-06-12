import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Tables } from '@/integrations/supabase/types';
import { Loader2, Plus } from 'lucide-react';
import { ImageUpload } from './ImageUpload';
import { useProducts } from '@/hooks/useProducts';

const productSchema = z.object({
  name: z.string().trim().min(2, 'اسم المنتج مطلوب (حرفين على الأقل)').max(100, 'الاسم طويل جداً'),
  description: z.string().trim().max(500, 'الوصف طويل جداً').optional().nullable(),
  price: z.coerce.number().min(0, 'السعر يجب أن يكون 0 أو أكثر').max(100000, 'السعر مرتفع جداً'),
  category: z.string().trim().max(50, 'التصنيف طويل جداً').optional().nullable(),
  image_url: z.string().optional().nullable(),
  is_active: z.boolean().default(true),
});

type ProductFormValues = z.infer<typeof productSchema>;

type Product = Tables<'products'>;

interface ProductFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  product?: Product | null;
  onSubmit: (values: ProductFormValues) => void;
  isLoading?: boolean;
}

export function ProductForm({
  open,
  onOpenChange,
  product,
  onSubmit,
  isLoading,
}: ProductFormProps) {
  const { data: products } = useProducts();
  const [showNewCategory, setShowNewCategory] = useState(false);
  const [newCategory, setNewCategory] = useState('');

  // Extract unique categories from existing products
  const existingCategories = [...new Set(
    products
      ?.map((p) => p.category)
      .filter((c): c is string => !!c && c.trim() !== '')
  )].sort();

  const form = useForm<ProductFormValues>({
    resolver: zodResolver(productSchema),
    defaultValues: {
      name: product?.name || '',
      description: product?.description || '',
      price: product?.price || 0,
      category: product?.category || '',
      image_url: product?.image_url || '',
      is_active: product?.is_active ?? true,
    },
  });

  // Reset form when product changes
  useEffect(() => {
    if (open) {
      form.reset({
        name: product?.name || '',
        description: product?.description || '',
        price: product?.price || 0,
        category: product?.category || '',
        image_url: product?.image_url || '',
        is_active: product?.is_active ?? true,
      });
      setShowNewCategory(false);
      setNewCategory('');
    }
  }, [product, open, form]);

  const handleAddNewCategory = () => {
    if (newCategory.trim()) {
      form.setValue('category', newCategory.trim());
      setShowNewCategory(false);
      setNewCategory('');
    }
  };

  const handleSubmit = (values: ProductFormValues) => {
    onSubmit({
      ...values,
      image_url: values.image_url || null,
      description: values.description || null,
      category: values.category || null,
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{product ? 'تعديل المنتج' : 'إضافة منتج جديد'}</DialogTitle>
          <DialogDescription>
            {product ? 'قم بتعديل بيانات المنتج' : 'أدخل بيانات المنتج الجديد'}
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>اسم المنتج *</FormLabel>
                  <FormControl>
                    <Input placeholder="مثال: كيكة الفراولة" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>الوصف</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="وصف مختصر للمنتج..."
                      {...field}
                      value={field.value || ''}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="price"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>السعر (ر.س) *</FormLabel>
                    <FormControl>
                      <Input type="number" step="0.01" min="0" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="category"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>التصنيف</FormLabel>
                    {showNewCategory ? (
                      <div className="flex gap-2">
                        <FormControl>
                          <Input
                            placeholder="اسم التصنيف"
                            value={newCategory}
                            onChange={(e) => setNewCategory(e.target.value)}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') {
                                e.preventDefault();
                                handleAddNewCategory();
                              }
                            }}
                          />
                        </FormControl>
                        <Button
                          type="button"
                          size="icon"
                          variant="outline"
                          onClick={handleAddNewCategory}
                        >
                          <Plus className="w-4 h-4" />
                        </Button>
                      </div>
                    ) : (
                      <Select
                        value={field.value || ''}
                        onValueChange={(value) => {
                          if (value === '__new__') {
                            setShowNewCategory(true);
                          } else {
                            field.onChange(value);
                          }
                        }}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="اختر التصنيف" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent className="bg-popover border shadow-md">
                          {existingCategories.map((cat) => (
                            <SelectItem key={cat} value={cat}>
                              {cat}
                            </SelectItem>
                          ))}
                          <SelectItem value="__new__" className="text-primary">
                            <span className="flex items-center gap-1">
                              <Plus className="w-3 h-3" />
                              إضافة تصنيف جديد
                            </span>
                          </SelectItem>
                        </SelectContent>
                      </Select>
                    )}
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="image_url"
              render={({ field }) => (
                <FormItem>
                  <FormControl>
                    <ImageUpload
                      value={field.value}
                      onChange={field.onChange}
                      disabled={isLoading}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="is_active"
              render={({ field }) => (
                <FormItem className="flex items-center justify-between rounded-lg border p-4">
                  <div className="space-y-0.5">
                    <FormLabel>متاح للبيع</FormLabel>
                    <FormDescription>
                      إظهار المنتج في قائمة الطلبات
                    </FormDescription>
                  </div>
                  <FormControl>
                    <Switch checked={field.value} onCheckedChange={field.onChange} />
                  </FormControl>
                </FormItem>
              )}
            />

            <div className="flex gap-3 pt-4">
              <Button type="submit" disabled={isLoading} className="flex-1">
                {isLoading && <Loader2 className="w-4 h-4 me-2 animate-spin" />}
                {product ? 'حفظ التغييرات' : 'إضافة المنتج'}
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
              >
                إلغاء
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
