import { useState, useEffect } from 'react';
import { useNavigate, Link, useLocation } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useAuth } from '@/contexts/AuthContext';
import { useMyRoles, AppRole } from '@/hooks/useMyRoles';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { toast } from '@/hooks/use-toast';
import { Loader2, LogIn, UserPlus, Phone, Mail, MapPin, User, Sparkles, Shield, Headphones, ChefHat, Store as StoreIcon, Truck, LifeBuoy, ShoppingBag } from 'lucide-react';
import { BrandLogo } from '@/components/brand';
import { useSettings } from '@/contexts/SettingsContext';

const DEMO_PASSWORD = 'Demo1234!';
const DEMO_ACCOUNTS = [
  { email: 'admin@demo.com', label: 'مدير النظام', icon: Shield, color: 'bg-primary' },
  { email: 'callcenter@demo.com', label: 'مركز الاتصال', icon: Headphones, color: 'bg-seasonal' },
  { email: 'kitchen@demo.com', label: 'المطبخ', icon: ChefHat, color: 'bg-success' },
  { email: 'branch@demo.com', label: 'الفرع', icon: StoreIcon, color: 'bg-info' },
  { email: 'driver@demo.com', label: 'السائق', icon: Truck, color: 'bg-ink-ink' },
  { email: 'support@demo.com', label: 'الدعم الفني', icon: LifeBuoy, color: 'bg-rose' },
  { email: 'customer@demo.com', label: 'عميل', icon: ShoppingBag, color: 'bg-gold-deep' },
];

const loginSchema = z.object({
  email: z.string().email('البريد الإلكتروني غير صحيح'),
  password: z.string().min(6, 'كلمة المرور يجب أن تكون 6 أحرف على الأقل'),
});

const signupSchema = z.object({
  name: z.string().min(2, 'الاسم يجب أن يكون حرفين على الأقل').max(100, 'الاسم طويل جداً'),
  phone: z.string().min(9, 'رقم الجوال غير صحيح').max(15, 'رقم الجوال غير صحيح'),
  email: z.string().email('البريد الإلكتروني غير صحيح'),
  password: z.string().min(6, 'كلمة المرور يجب أن تكون 6 أحرف على الأقل'),
  address: z.string().optional(),
});

type LoginFormValues = z.infer<typeof loginSchema>;
type SignupFormValues = z.infer<typeof signupSchema>;

// Get role-based landing page with fallback
const getRoleLandingPage = (roles: AppRole[]): string => {
  if (roles.includes('admin')) return '/dashboard';
  if (roles.includes('call_center')) return '/dashboard';
  if (roles.includes('kitchen')) return '/kitchen';
  if (roles.includes('branch')) return '/branch-orders';
  // Default fallback for customer or unknown roles - go to my-orders if customer
  if (roles.includes('customer')) return '/my-orders';
  return '/store';
};

export default function Login() {
  const [isLoading, setIsLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<string>('login');
  const [loginSuccess, setLoginSuccess] = useState(false);
  const { signIn, signUp, user, isLoading: authLoading } = useAuth();
  const { data: roles = [], isLoading: rolesLoading, isFetched: rolesFetched } = useMyRoles();
  const { settings } = useSettings();
  const navigate = useNavigate();
  const location = useLocation();

  // Get redirect destination from location state or default to store
  const from = location.state?.from?.pathname || '/store';
  const pendingOrder = location.state?.pendingOrder;

  // Initialize forms before any conditional returns
  const loginForm = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: '',
      password: '',
    },
  });

  const signupForm = useForm<SignupFormValues>({
    resolver: zodResolver(signupSchema),
    defaultValues: {
      name: '',
      phone: '',
      email: '',
      password: '',
      address: '',
    },
  });

  // Redirect after successful login when roles are loaded
  useEffect(() => {
    // Wait for auth to finish loading first
    if (authLoading) return;
    
    // If no user, don't redirect (show login form)
    if (!user) return;
    
    // Wait for roles to finish loading
    if (rolesLoading) return;
    
    // Roles have been fetched - redirect based on role
    if (rolesFetched) {
      const landingPage = getRoleLandingPage(roles);
      // Use pendingOrder for customer redirects back to store
      if (landingPage === '/store' && pendingOrder) {
        navigate('/store', { replace: true, state: { pendingOrder } });
      } else {
        navigate(landingPage, { replace: true });
      }
    }
  }, [user, roles, rolesLoading, rolesFetched, authLoading, navigate, pendingOrder]);

  // Show loading while auth is initializing
  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <Loader2 className="h-10 w-10 animate-spin text-primary mx-auto" />
          <p className="mt-4 text-muted-foreground">جاري التحميل...</p>
        </div>
      </div>
    );
  }

  // Show loading while checking roles after login success
  if (user && (rolesLoading || loginSuccess)) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <Loader2 className="h-10 w-10 animate-spin text-primary mx-auto" />
          <p className="mt-4 text-muted-foreground">جاري تحميل الصفحة...</p>
        </div>
      </div>
    );
  }

  const handleLogin = async (values: LoginFormValues) => {
    setIsLoading(true);
    const { error } = await signIn(values.email, values.password);
    setIsLoading(false);

    if (error) {
      let errorMessage = 'حدث خطأ أثناء تسجيل الدخول';
      if (error.message.includes('Invalid login credentials')) {
        errorMessage = 'البريد الإلكتروني أو كلمة المرور غير صحيحة';
      } else if (error.message.includes('Email not confirmed')) {
        errorMessage = 'يرجى تأكيد البريد الإلكتروني أولاً';
      }
      toast({
        title: 'فشل تسجيل الدخول',
        description: errorMessage,
        variant: 'destructive',
      });
    } else {
      setLoginSuccess(true);
      toast({
        title: 'تم تسجيل الدخول',
        description: 'مرحباً بك',
      });
      // Redirection will happen in useEffect when roles are loaded
    }
  };

  const handleDemoLogin = async (email: string) => {
    loginForm.setValue('email', email);
    loginForm.setValue('password', DEMO_PASSWORD);
    await handleLogin({ email, password: DEMO_PASSWORD });
  };

  const handleSignup = async (values: SignupFormValues) => {
    setIsLoading(true);
    
    // 1. Create auth user
    const { error: signUpError } = await signUp(values.email, values.password, values.name);
    
    if (signUpError) {
      setIsLoading(false);
      let errorMessage = 'حدث خطأ أثناء إنشاء الحساب';
      if (signUpError.message.includes('already registered')) {
        errorMessage = 'هذا البريد الإلكتروني مسجل مسبقاً';
      } else if (signUpError.message.includes('email')) {
        errorMessage = 'البريد الإلكتروني غير صالح أو مستخدم مسبقاً';
      }
      toast({
        title: 'فشل إنشاء الحساب',
        description: errorMessage,
        variant: 'destructive',
      });
      return;
    }

    // 2. Wait for auth session to be fully established
    // Poll for the session to ensure it's ready before calling RPC
    let attempts = 0;
    const maxAttempts = 10;
    let sessionReady = false;
    
    while (attempts < maxAttempts && !sessionReady) {
      await new Promise(resolve => setTimeout(resolve, 300));
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user?.id) {
        sessionReady = true;
      }
      attempts++;
    }

    if (!sessionReady) {
      setIsLoading(false);
      toast({
        title: 'تنبيه',
        description: 'تم إنشاء الحساب. يرجى تسجيل الدخول لإكمال التسجيل.',
      });
      setActiveTab('login');
      return;
    }
    
    // 3. Create customer record after signup (all new signups are customers)
    const { error: customerError } = await supabase.rpc('register_customer_after_signup', {
      _name: values.name,
      _phone: values.phone,
      _address: values.address || null,
    });

    setIsLoading(false);
    setLoginSuccess(true);

    if (customerError) {
      console.error('Customer registration error:', customerError);
      // Check specific error messages
      let errorDescription = 'تم إنشاء الحساب، لكن هناك مشكلة في حفظ البيانات.';
      if (customerError.message?.includes('unique') || customerError.message?.includes('duplicate')) {
        errorDescription = 'رقم الجوال مستخدم مسبقاً. يرجى استخدام رقم آخر.';
      }
      toast({
        title: 'تنبيه',
        description: errorDescription,
        variant: 'destructive',
      });
    } else {
      toast({
        title: 'أهلاً بك!',
        description: 'تم إنشاء حسابك بنجاح',
      });
    }
    // Redirection will happen in useEffect when roles are loaded
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-blush to-background p-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <BrandLogo variant="ar" className="mx-auto h-16 text-primary" />
          {/* The lockup already says the name; the heading stays for readers. */}
          <h1 className="sr-only">{settings.storeName}</h1>
          <p className="mt-5 text-muted-foreground">مرحباً بك</p>
        </div>

        <Card>
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <CardHeader className="pb-2">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="login" className="gap-2">
                  <LogIn className="w-4 h-4" />
                  تسجيل الدخول
                </TabsTrigger>
                <TabsTrigger value="signup" className="gap-2">
                  <UserPlus className="w-4 h-4" />
                  حساب جديد
                </TabsTrigger>
              </TabsList>
            </CardHeader>

            <CardContent>
              {/* Login Tab */}
              <TabsContent value="login" className="mt-0">
                <Form {...loginForm}>
                  <form onSubmit={loginForm.handleSubmit(handleLogin)} className="space-y-4">
                    <FormField
                      control={loginForm.control}
                      name="email"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>البريد الإلكتروني</FormLabel>
                          <FormControl>
                            <div className="relative">
                              <Mail className="absolute start-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                              <Input
                                type="email"
                                placeholder="example@email.com"
                                autoComplete="email"
                                className="ps-10"
                                {...field}
                              />
                            </div>
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={loginForm.control}
                      name="password"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>كلمة المرور</FormLabel>
                          <FormControl>
                            <Input
                              type="password"
                              placeholder="••••••••"
                              autoComplete="current-password"
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <Button type="submit" className="w-full" disabled={isLoading}>
                      {isLoading && <Loader2 className="w-4 h-4 me-2 animate-spin" />}
                      تسجيل الدخول
                    </Button>
                  </form>
                </Form>

                <div className="mt-4 text-center">
                  <Link to="/forgot-password">
                    <Button variant="link" className="text-sm text-muted-foreground">
                      نسيت كلمة المرور؟
                    </Button>
                  </Link>
                </div>
              </TabsContent>

              {/* Signup Tab */}
              <TabsContent value="signup" className="mt-0">
                <Form {...signupForm}>
                  <form onSubmit={signupForm.handleSubmit(handleSignup)} className="space-y-4">
                    <FormField
                      control={signupForm.control}
                      name="name"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>الاسم الكامل</FormLabel>
                          <FormControl>
                            <div className="relative">
                              <User className="absolute start-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                              <Input
                                placeholder="أدخل اسمك"
                                className="ps-10"
                                {...field}
                              />
                            </div>
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={signupForm.control}
                      name="phone"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>رقم الجوال</FormLabel>
                          <FormControl>
                            <div className="relative">
                              <Phone className="absolute start-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                              <Input
                                type="tel"
                                placeholder="05xxxxxxxx"
                                dir="ltr"
                                className="ps-10 text-start"
                                {...field}
                              />
                            </div>
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={signupForm.control}
                      name="email"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>البريد الإلكتروني</FormLabel>
                          <FormControl>
                            <div className="relative">
                              <Mail className="absolute start-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                              <Input
                                type="email"
                                placeholder="example@email.com"
                                autoComplete="email"
                                className="ps-10"
                                {...field}
                              />
                            </div>
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={signupForm.control}
                      name="password"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>كلمة المرور</FormLabel>
                          <FormControl>
                            <Input
                              type="password"
                              placeholder="6 أحرف على الأقل"
                              autoComplete="new-password"
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={signupForm.control}
                      name="address"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>العنوان (اختياري)</FormLabel>
                          <FormControl>
                            <div className="relative">
                              <MapPin className="absolute start-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                              <Input
                                placeholder="المدينة، الحي"
                                className="ps-10"
                                {...field}
                              />
                            </div>
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <Button type="submit" className="w-full" disabled={isLoading}>
                      {isLoading && <Loader2 className="w-4 h-4 me-2 animate-spin" />}
                      إنشاء حساب
                    </Button>
                  </form>
                </Form>
              </TabsContent>
            </CardContent>
          </Tabs>
          
          <CardFooter className="flex-col gap-2 border-t pt-4">
            <Link to="/store" className="w-full">
              <Button variant="outline" className="w-full">
                تصفح المتجر بدون تسجيل
              </Button>
            </Link>
          </CardFooter>
        </Card>

        {/* Demo Accounts Panel */}
        <Card className="mt-6 border-dashed border-2 border-primary/30 bg-blush/50">
          <CardHeader className="pb-3">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-primary" />
              <CardTitle className="text-base">حسابات تجريبية</CardTitle>
            </div>
            <CardDescription className="text-xs">
              اضغط على أي دور للدخول الفوري · كلمة المرور لجميع الحسابات:{' '}
              <code className="font-mono bg-muted px-1.5 py-0.5 rounded text-[11px]">{DEMO_PASSWORD}</code>
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-2">
              {DEMO_ACCOUNTS.map((acc) => {
                const Icon = acc.icon;
                return (
                  <button
                    key={acc.email}
                    type="button"
                    disabled={isLoading}
                    onClick={() => handleDemoLogin(acc.email)}
                    className="group relative flex items-center gap-2 rounded-lg border bg-card p-2.5 text-start transition-all hover:border-primary hover:shadow-md hover:-translate-y-0.5 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <div className={`grid size-8 shrink-0 place-items-center rounded-md text-white shadow-sm ${acc.color}`}>
                      <Icon className="w-4 h-4" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-xs font-semibold truncate">{acc.label}</div>
                      <div className="text-[10px] text-muted-foreground truncate" dir="ltr">{acc.email}</div>
                    </div>
                  </button>
                );
              })}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
