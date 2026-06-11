import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { toast } from '@/hooks/use-toast';
import { Cake, Loader2, ArrowRight, Mail, CheckCircle2 } from 'lucide-react';
import { useSettings } from '@/contexts/SettingsContext';

const forgotPasswordSchema = z.object({
  email: z.string().email('البريد الإلكتروني غير صحيح'),
});

type ForgotPasswordFormValues = z.infer<typeof forgotPasswordSchema>;

export default function ForgotPassword() {
  const [isLoading, setIsLoading] = useState(false);
  const [isEmailSent, setIsEmailSent] = useState(false);
  const { settings } = useSettings();

  const form = useForm<ForgotPasswordFormValues>({
    resolver: zodResolver(forgotPasswordSchema),
    defaultValues: {
      email: '',
    },
  });

  const handleSubmit = async (values: ForgotPasswordFormValues) => {
    setIsLoading(true);
    
    const { error } = await supabase.auth.resetPasswordForEmail(values.email, {
      redirectTo: `${window.location.origin}/reset-password`,
    });
    
    setIsLoading(false);

    if (error) {
      toast({
        title: 'خطأ',
        description: 'حدث خطأ أثناء إرسال رابط إعادة التعيين',
        variant: 'destructive',
      });
    } else {
      setIsEmailSent(true);
      toast({
        title: 'تم الإرسال',
        description: 'تم إرسال رابط إعادة تعيين كلمة المرور إلى بريدك الإلكتروني',
      });
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="w-20 h-20 rounded-2xl gradient-pink flex items-center justify-center shadow-warm mx-auto mb-4">
            <Cake className="w-10 h-10 text-white" />
          </div>
          <h1 className="text-2xl font-bold">{settings.storeName}</h1>
        </div>

        <Card>
          <CardHeader className="text-center">
            <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-2">
              {isEmailSent ? (
                <CheckCircle2 className="w-6 h-6 text-primary" />
              ) : (
                <Mail className="w-6 h-6 text-primary" />
              )}
            </div>
            <CardTitle>
              {isEmailSent ? 'تم إرسال الرابط' : 'نسيت كلمة المرور؟'}
            </CardTitle>
            <CardDescription>
              {isEmailSent
                ? 'تحقق من بريدك الإلكتروني للحصول على رابط إعادة التعيين'
                : 'أدخل بريدك الإلكتروني وسنرسل لك رابط إعادة تعيين كلمة المرور'}
            </CardDescription>
          </CardHeader>

          <CardContent>
            {isEmailSent ? (
              <div className="text-center space-y-4">
                <p className="text-sm text-muted-foreground">
                  إذا لم تستلم الرسالة، تحقق من مجلد البريد العشوائي أو أعد المحاولة
                </p>
                <Button
                  variant="outline"
                  onClick={() => setIsEmailSent(false)}
                  className="w-full"
                >
                  إعادة المحاولة
                </Button>
              </div>
            ) : (
              <Form {...form}>
                <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
                  <FormField
                    control={form.control}
                    name="email"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>البريد الإلكتروني</FormLabel>
                        <FormControl>
                          <Input
                            type="email"
                            placeholder="example@email.com"
                            autoComplete="email"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <Button type="submit" className="w-full" disabled={isLoading}>
                    {isLoading && <Loader2 className="w-4 h-4 ml-2 animate-spin" />}
                    إرسال رابط إعادة التعيين
                  </Button>
                </form>
              </Form>
            )}

            <div className="mt-6 pt-4 border-t text-center">
              <Link to="/auth">
                <Button variant="ghost" className="text-sm">
                  <ArrowRight className="w-4 h-4 ml-1" />
                  العودة لتسجيل الدخول
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
