import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
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
import { toast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { nameSchema, ksaPhoneSchema, optionalEmailSchema } from '@/lib/validation';
import { useState, useRef, useEffect } from 'react';
import { Loader2, CheckCircle } from 'lucide-react';

const contactSchema = z.object({
  customer_name: nameSchema,
  phone: ksaPhoneSchema,
  email: optionalEmailSchema,
  message: z.string().trim().min(10, 'الرسالة قصيرة جداً (10 أحرف على الأقل)').max(1000, 'الرسالة طويلة جداً'),
});

type ContactFormValues = z.infer<typeof contactSchema>;

interface ContactFormProps {
  submissionType: 'contact' | 'custom_order' | 'complaint';
  onSuccess?: () => void;
}

const typeLabels = {
  contact: {
    title: 'تواصل معنا',
    messagePlaceholder: 'اكتب رسالتك أو استفسارك...',
    successMessage: 'تم إرسال رسالتك بنجاح، سنتواصل معك قريباً',
  },
  custom_order: {
    title: 'طلب مخصص',
    messagePlaceholder: 'صف الطلب المخصص الذي تريده (النوع، الحجم، المناسبة، التاريخ...)...',
    successMessage: 'تم استلام طلبك المخصص، سنتواصل معك لتأكيد التفاصيل',
  },
  complaint: {
    title: 'شكوى',
    messagePlaceholder: 'اشرح المشكلة التي واجهتها...',
    successMessage: 'تم استلام شكواك، سنعمل على حلها في أقرب وقت',
  },
};

export function ContactForm({ submissionType, onSuccess }: ContactFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const honeypotRef = useRef<HTMLInputElement>(null);
  
  const labels = typeLabels[submissionType];

  const form = useForm<ContactFormValues>({
    resolver: zodResolver(contactSchema),
    defaultValues: {
      customer_name: '',
      phone: '',
      email: '',
      message: '',
    },
  });

  const onSubmit = async (values: ContactFormValues) => {
    setIsSubmitting(true);
    try {
      // Get honeypot value
      const honeypotValue = honeypotRef.current?.value || '';
      
      // Call edge function instead of direct insert
      const { data, error } = await supabase.functions.invoke('submit-contact', {
        body: {
          submission_type: submissionType,
          customer_name: values.customer_name,
          phone: values.phone,
          email: values.email || null,
          message: values.message,
          website: honeypotValue, // Honeypot field
        },
      });

      if (error) throw error;
      
      // Check response from edge function
      if (data && !data.success) {
        throw new Error(data.error || 'حدث خطأ');
      }

      setIsSuccess(true);
      toast({
        title: 'تم الإرسال بنجاح',
        description: labels.successMessage,
      });
      
      setTimeout(() => {
        onSuccess?.();
      }, 2000);
    } catch (error: any) {
      console.error('Error submitting form:', error);
      
      // Handle rate limiting
      if (error.message?.includes('429') || error.message?.includes('الحد المسموح')) {
        toast({
          title: 'تم تجاوز الحد المسموح',
          description: 'يرجى الانتظار قليلاً قبل المحاولة مرة أخرى',
          variant: 'destructive',
        });
      } else {
        toast({
          title: 'حدث خطأ',
          description: error.message || 'تعذر إرسال النموذج، يرجى المحاولة مرة أخرى',
          variant: 'destructive',
        });
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isSuccess) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <div className="w-16 h-16 rounded-full bg-primary/10 text-primary flex items-center justify-center mb-4">
          <CheckCircle className="w-8 h-8" />
        </div>
        <h3 className="text-lg font-semibold mb-2">تم الإرسال بنجاح!</h3>
        <p className="text-muted-foreground text-sm">{labels.successMessage}</p>
      </div>
    );
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 py-4">
        <FormField
          control={form.control}
          name="customer_name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>الاسم *</FormLabel>
              <FormControl>
                <Input placeholder="أدخل اسمك الكامل" {...field} />
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
              <FormLabel>رقم الجوال *</FormLabel>
              <FormControl>
                <Input placeholder="05xxxxxxxx" type="tel" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="email"
          render={({ field }) => (
            <FormItem>
              <FormLabel>البريد الإلكتروني (اختياري)</FormLabel>
              <FormControl>
                <Input placeholder="example@email.com" type="email" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="message"
          render={({ field }) => (
            <FormItem>
              <FormLabel>الرسالة *</FormLabel>
              <FormControl>
                <Textarea 
                  placeholder={labels.messagePlaceholder}
                  rows={4}
                  {...field} 
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Honeypot field - hidden from users, visible to bots */}
        <div 
          style={{ 
            position: 'absolute', 
            left: '-9999px', 
            opacity: 0, 
            height: 0, 
            overflow: 'hidden',
            pointerEvents: 'none'
          }}
          aria-hidden="true"
        >
          <label htmlFor="website">Website</label>
          <input
            ref={honeypotRef}
            type="text"
            id="website"
            name="website"
            tabIndex={-1}
            autoComplete="off"
          />
        </div>

        <Button type="submit" className="w-full" disabled={isSubmitting}>
          {isSubmitting && <Loader2 className="w-4 h-4 me-2 animate-spin" />}
          إرسال
        </Button>
      </form>
    </Form>
  );
}
