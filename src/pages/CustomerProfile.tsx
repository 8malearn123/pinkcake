import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useSettings } from '@/contexts/SettingsContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from '@/hooks/use-toast';
import { ArrowRight, User, Phone, MapPin, Loader2, Cake, Save } from 'lucide-react';

interface CustomerProfile {
  id: string;
  name: string;
  phone: string;
  address: string | null;
}

export default function CustomerProfile() {
  const { user, signOut } = useAuth();
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
            <Button className="w-full" onClick={() => navigate('/customer-auth')}>
              تسجيل الدخول
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b">
        <div className="container mx-auto px-4 py-3">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" onClick={() => navigate('/store')}>
              <ArrowRight className="w-5 h-5" />
            </Button>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl gradient-pink flex items-center justify-center">
                <User className="w-5 h-5 text-white" />
              </div>
              <div>
                <h1 className="font-bold">الملف الشخصي</h1>
                <p className="text-xs text-muted-foreground">{user.email}</p>
              </div>
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-6 max-w-lg">
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
            <CardContent>
              <Button className="w-full" onClick={() => signOut()}>
                تسجيل الخروج
              </Button>
            </CardContent>
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

        {/* Account Actions */}
        <Card className="mt-4">
          <CardHeader>
            <CardTitle className="text-base">إعدادات الحساب</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <Button
              variant="outline"
              className="w-full justify-start"
              onClick={() => navigate('/my-orders')}
            >
              طلباتي
            </Button>
            <Button
              variant="outline"
              className="w-full justify-start text-destructive hover:text-destructive"
              onClick={() => signOut()}
            >
              تسجيل الخروج
            </Button>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
