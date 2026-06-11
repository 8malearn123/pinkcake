import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Form,
  FormControl,
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
import { Tables } from '@/integrations/supabase/types';
import { Loader2 } from 'lucide-react';

const branchSchema = z.object({
  name: z.string().trim().min(2, 'اسم الفرع مطلوب (حرفين على الأقل)').max(100, 'الاسم طويل جداً'),
  phone: z.string().trim().max(20, 'رقم الهاتف طويل جداً').optional().nullable(),
  address: z.string().trim().max(300, 'العنوان طويل جداً').optional().nullable(),
});

type BranchFormValues = z.infer<typeof branchSchema>;

type Branch = Tables<'branches'>;

interface BranchFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  branch?: Branch | null;
  onSubmit: (values: BranchFormValues) => void;
  isLoading?: boolean;
}

export function BranchForm({
  open,
  onOpenChange,
  branch,
  onSubmit,
  isLoading,
}: BranchFormProps) {
  const form = useForm<BranchFormValues>({
    resolver: zodResolver(branchSchema),
    defaultValues: {
      name: branch?.name || '',
      phone: branch?.phone || '',
      address: branch?.address || '',
    },
  });

  useEffect(() => {
    if (open) {
      form.reset({
        name: branch?.name || '',
        phone: branch?.phone || '',
        address: branch?.address || '',
      });
    }
  }, [branch, open, form]);

  const handleSubmit = (values: BranchFormValues) => {
    onSubmit({
      ...values,
      phone: values.phone || null,
      address: values.address || null,
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{branch ? 'تعديل الفرع' : 'إضافة فرع جديد'}</DialogTitle>
          <DialogDescription>
            {branch ? 'قم بتعديل بيانات الفرع' : 'أدخل بيانات الفرع الجديد'}
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>اسم الفرع *</FormLabel>
                  <FormControl>
                    <Input placeholder="مثال: فرع الرياض - العليا" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="phone"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>رقم الهاتف</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="مثال: 0501234567"
                      {...field}
                      value={field.value || ''}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="address"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>العنوان</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="العنوان التفصيلي للفرع..."
                      {...field}
                      value={field.value || ''}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="flex gap-3 pt-4">
              <Button type="submit" disabled={isLoading} className="flex-1">
                {isLoading && <Loader2 className="w-4 h-4 ml-2 animate-spin" />}
                {branch ? 'حفظ التغييرات' : 'إضافة الفرع'}
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
