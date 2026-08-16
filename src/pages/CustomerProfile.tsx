import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useSettings } from '@/contexts/SettingsContext';
import { Button } from '@/components/ui/button';
import { StorefrontMasthead } from '@/components/store/StorefrontMasthead';
import { Marquee } from '@/components/store/StorefrontDecor';
import { Eyebrow, Title } from '@/components/ds';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from '@/hooks/use-toast';
import { ArrowRight, User, Phone, MapPin, Loader2, Cake, Save, Package, Heart, Truck, ChevronLeft, LogOut } from 'lucide-react';

interface CustomerProfile {
  id: string;
  name: string;
  phone: string;
  address: string | null;
}

export default function CustomerProfile() {
  const { user, isLoading: authLoading, signOut } = useAuth();
  const { settings } = useSettings();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');

  // Fetch customer profile
  const { data: profile, isLoading } = useQuery({
    queryKey: ['my-customer-profile'],
    queryFn: async () => {
      const { data, error } = await supabase.rpc('get_my_customer_profile');
      if (error) throw error;
      return data?.[0] as CustomerProfile | null;
    },
    enabled: !!user,
  });

  // Set form values when profile loads
  useEffect(() => {
    if (profile) {
      setName(profile.name || '');
      setPhone(profile.phone || '');
      setAddress(profile.address || '');
    }
  }, [profile]);

  // Update profile mutation
  const updateProfile = useMutation({
    mutationFn: async () => {
      const { data, error } = await supabase.rpc('update_my_customer_profile', {
        _name: name.trim(),
        _phone: phone.trim(),
        _address: address.trim() || null,
      });
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['my-customer-profile'] });
      toast({
        title: 'تم الحفظ',
        description: 'تم تحديث بياناتك بنجاح',
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'خطأ',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!name.trim()) {
      toast({
        title: 'الاسم مطلوب',
        variant: 'destructive',
      });
      return;
    }
    
    if (!phone.trim()) {
      toast({
        title: 'رقم الجوال مطلوب',
        variant: 'destructive',
      });
      return;
    }
    
    updateProfile.mutate();
  };

  const quickLinks = [
    { icon: Package, title: 'طلباتي', desc: 'تتبّع طلباتك السابقة', to: '/my-orders' },
    { icon: Heart, title: 'المفضلة', desc: 'منتجاتك المحفوظة', to: '/wishlist' },
    { icon: Truck, title: 'تتبّع طلب', desc: 'حالة طلبك الحالي', to: '/track' },
  ];

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Card className="w-full max-w-md mx-4">
          <CardHeader className="text-center">
            <div className="w-16 h-16 rounded-2xl gradient-pink flex items-center justify-center shadow-warm mx-auto mb-4">
              <Cake className="w-8 h-8 text-white" />
            </div>
            <CardTitle>{settings.storeName}</CardTitle>
            <CardDescription>سجل دخولك للوصول إلى ملفك الشخصي</CardDescription>
          </CardHeader>
          <CardContent>
            <Button className="w-full" onClick={() => navigate('/login')}>
              تسجيل الدخول
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="store-surface min-h-screen bg-background text-foreground">
      <Marquee />
      <StorefrontMasthead />

      <main className="mx-auto max-w-2xl space-y-5 px-5 py-10 sm:px-8 lg:py-14">
        <div className="mb-2 flex items-center gap-4 border-b border-primary/15 pb-6">
          <div className="gradient-pink grid size-14 shrink-0 place-items-center rounded-2xl text-primary-foreground">
            <User className="size-7" />
          </div>
          <div className="min-w-0">
            <Eyebrow>حسابي</Eyebrow>
            <Title variant="h2" as="h1" className="mt-1 truncate text-2xl sm:text-3xl">
              {user.email}
            </Title>
          </div>
        </div>

        {/* Quick access — the items that moved out of the top nav */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {quickLinks.map((l) => (
            <button
              key={l.to}
              onClick={() => navigate(l.to)}
              className="press group text-start rounded-2xl border border-border bg-card p-4 transition-all duration-300 hover:-translate-y-1 hover:border-primary/30 hover:shadow-berry-soft"
            >
              <div className="flex items-center justify-between">
                <span className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
                  <l.icon className="w-5 h-5" />
                </span>
                <ChevronLeft className="w-4 h-4 text-muted-foreground group-hover:text-primary transition-colors" />
              </div>
              <div className="font-semibold mt-3">{l.title}</div>
              <div className="text-xs text-muted-foreground mt-0.5">{l.desc}</div>
            </button>
          ))}
        </div>

        {/* Profile details */}
        {isLoading ? (
          <Card>
            <CardHeader>
              <Skeleton className="h-6 w-32" />
              <Skeleton className="h-4 w-48" />
            </CardHeader>
            <CardContent className="space-y-4">
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-20 w-full" />
            </CardContent>
          </Card>
        ) : !profile ? (
          <Card>
            <CardHeader className="text-center">
              <CardTitle>لم يتم العثور على الملف الشخصي</CardTitle>
              <CardDescription>
                يبدو أن حسابك غير مرتبط بملف عميل
              </CardDescription>
            </CardHeader>
          </Card>
        ) : (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="w-5 h-5" />
                بياناتي
              </CardTitle>
              <CardDescription>
                يمكنك تعديل بياناتك الشخصية من هنا
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                {/* Name */}
                <div className="space-y-2">
                  <Label htmlFor="name" className="flex items-center gap-2">
                    <User className="w-4 h-4" />
                    الاسم الكامل
                  </Label>
                  <Input
                    id="name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="أدخل اسمك الكامل"
                    required
                    maxLength={100}
                  />
                </div>

                {/* Phone */}
                <div className="space-y-2">
                  <Label htmlFor="phone" className="flex items-center gap-2">
                    <Phone className="w-4 h-4" />
                    رقم الجوال
                  </Label>
                  <Input
                    id="phone"
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="05xxxxxxxx"
                    required
                    maxLength={20}
                    dir="ltr"
                    className="text-end"
                  />
                </div>

                {/* Address */}
                <div className="space-y-2">
                  <Label htmlFor="address" className="flex items-center gap-2">
                    <MapPin className="w-4 h-4" />
                    العنوان (اختياري)
                  </Label>
                  <Textarea
                    id="address"
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    placeholder="أدخل عنوانك للتوصيل"
                    rows={3}
                    maxLength={500}
                  />
                </div>

                {/* Submit Button */}
                <Button
                  type="submit"
                  className="w-full"
                  disabled={updateProfile.isPending}
                >
                  {updateProfile.isPending ? (
                    <Loader2 className="w-4 h-4 me-2 animate-spin" />
                  ) : (
                    <Save className="w-4 h-4 me-2" />
                  )}
                  حفظ التغييرات
                </Button>
              </form>
            </CardContent>
          </Card>
        )}

        {/* Logout */}
        <Button
          variant="outline"
          className="w-full justify-center gap-2 text-destructive hover:text-destructive hover:border-destructive/40"
          onClick={() => signOut()}
        >
          <LogOut className="w-4 h-4" />
          تسجيل الخروج
        </Button>
      </main>
    </div>
  );
}
