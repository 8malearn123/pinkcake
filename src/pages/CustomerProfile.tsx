import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { BrandLogo } from '@/components/brand';
import { useSettings } from '@/contexts/SettingsContext';
import { Button } from '@/components/ui/button';
import { StorefrontMasthead } from '@/components/store/StorefrontMasthead';
import { StorefrontFooter } from '@/components/store/StorefrontFooter';
import { FloatingContactButton } from '@/components/store/FloatingContactButton';
import { BackToTop } from '@/components/store/BackToTop';
import { Marquee } from '@/components/store/StorefrontDecor';
import { Reveal } from '@/components/Reveal';
import { Eyebrow, GoldDivider, Lede, Title } from '@/components/ds';
import { AccountHero, AccountQuickLinks } from '@/components/account';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from '@/hooks/use-toast';
import {
  ConsentToggles,
  OccasionRegistry,
  ReferralPanel,
  RewardsPanel,
  StampCard,
} from '@/components/loyalty';
import { Loader2, LogOut, MapPin, Phone, Save, User } from 'lucide-react';

interface CustomerProfile {
  id: string;
  name: string;
  phone: string;
  address: string | null;
}

/**
 * «حسابي».
 *
 * The page is read in one direction: *who am I here* (the band), *where was I
 * going* (the shortcuts), *what am I owed* (دائرة المناسبات), and only then
 * *my details* — the form is settings, not the point of the visit, so it sits
 * last instead of competing with the program for the fold.
 *
 * The panels below are unchanged in behaviour; what they gained is rhythm. A
 * flat run of seven identical cards reads as a settings screen, and this is a
 * boutique's account page — the eyebrow bands and the gold breaks are what tell
 * the eye where one idea ends and the next begins.
 */
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

  /**
   * A save button that is always live invites the customer to press it and get
   * «تم الحفظ» for having changed nothing. It disables until something actually
   * differs from what we already hold.
   */
  const isDirty = useMemo(() => {
    if (!profile) return false;
    return (
      name.trim() !== (profile.name || '') ||
      phone.trim() !== (profile.phone || '') ||
      address.trim() !== (profile.address || '')
    );
  }, [profile, name, phone, address]);

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
        title: 'تعذّر حفظ التعديل',
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
        description: 'نحتاج اسمك ليصلك الطلب باسمك الصحيح.',
        variant: 'destructive',
      });
      return;
    }

    if (!phone.trim()) {
      toast({
        title: 'رقم الجوال مطلوب',
        description: 'نتواصل معك عليه عند التسليم — يبدأ بـ ٠٥.',
        variant: 'destructive',
      });
      return;
    }

    updateProfile.mutate();
  };

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
            <BrandLogo variant="ar" className="mx-auto mb-4 h-12 text-primary" />
            <CardTitle className="sr-only">{settings.storeName}</CardTitle>
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

      <AccountHero
        name={profile?.name ?? null}
        email={user.email ?? ''}
        phone={profile?.phone ?? null}
        isLoading={isLoading}
      />

      <main className="mx-auto max-w-[820px] px-5 pb-16 sm:px-8 lg:pb-20">
        {/* Lifted into the scalloped edge of the band, so the shortcuts read as
            part of the header rather than as the first row of the body. */}
        <div className="relative z-10 -mt-9">
          <AccountQuickLinks />
        </div>

        {/* ── دائرة المناسبات ────────────────────────────────────────────
            The reason this page is worth opening, so it comes before
            «بياناتي». The registry drives the program; the rest supports it. */}
        <section id="occasions" className="scroll-mt-24 pt-14 lg:pt-20">
          <Reveal>
            <Eyebrow rule caps>
              برنامجك
            </Eyebrow>
            <Title variant="h2" className="mt-3">
              دائرة المناسبات
            </Title>
            <Lede className="mt-3 max-w-xl">
              نحفظ مناسباتك، ونذكّرك قبلها بوقت كافٍ للتجهيز — وكل طلب مكتمل يقرّبك من
              مكافأة تُضاف إلى طلبك القادم.
            </Lede>
          </Reveal>

          <div className="mt-7 space-y-5">
            <Reveal>
              <StampCard />
            </Reveal>
            <Reveal>
              <OccasionRegistry />
            </Reveal>
            <Reveal>
              <div id="rewards" className="scroll-mt-24">
                <RewardsPanel />
              </div>
            </Reveal>
            <Reveal>
              <ReferralPanel />
            </Reveal>
          </div>
        </section>

        <div className="py-12 lg:py-16">
          <GoldDivider />
        </div>

        {/* ── بياناتي ──────────────────────────────────────────────────── */}
        <section id="details" className="scroll-mt-24">
          <Reveal>
            <Eyebrow rule caps>
              الإعدادات
            </Eyebrow>
            <Title variant="h2" className="mt-3">
              بياناتي
            </Title>
            <Lede className="mt-3 max-w-xl">
              الاسم والجوال اللذان يصل بهما طلبك، والعنوان الذي نوصّل إليه.
            </Lede>
          </Reveal>

          <div className="mt-7 space-y-5">
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
                  <CardDescription>يبدو أن حسابك غير مرتبط بملف عميل</CardDescription>
                </CardHeader>
              </Card>
            ) : (
              <Reveal>
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <User className="size-5 text-primary" />
                      بيانات التواصل
                    </CardTitle>
                    <CardDescription className="mt-1">
                      نستخدمها عند التجهيز والتسليم فقط.
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <form onSubmit={handleSubmit} className="space-y-5">
                      {/* Name */}
                      <div className="space-y-2">
                        <Label htmlFor="name" className="flex items-center gap-2">
                          <User className="size-4 text-primary" />
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
                          <Phone className="size-4 text-primary" />
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
                        <p className="text-xs text-muted-foreground">
                          نتواصل معك عليه عند التجهيز والتسليم.
                        </p>
                      </div>

                      {/* Address */}
                      <div className="space-y-2">
                        <Label htmlFor="address" className="flex items-center gap-2">
                          <MapPin className="size-4 text-primary" />
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

                      <div className="gold-rule" />

                      {/* Submit */}
                      <div className="flex flex-wrap items-center justify-between gap-3">
                        <p className="text-xs text-muted-foreground">
                          {isDirty ? 'لديك تعديل غير محفوظ' : 'بياناتك محدّثة'}
                        </p>
                        <Button
                          type="submit"
                          variant="brandFlat"
                          size="cta"
                          disabled={updateProfile.isPending || !isDirty}
                        >
                          {updateProfile.isPending ? (
                            <Loader2 className="size-4 animate-spin" />
                          ) : (
                            <Save className="size-4" />
                          )}
                          احفظ التغييرات
                        </Button>
                      </div>
                    </form>
                  </CardContent>
                </Card>
              </Reveal>
            )}

            <Reveal>
              <ConsentToggles />
            </Reveal>
          </div>

          {/* Logout — a quiet exit, not a red banner competing with the CTA. */}
          <div className="mt-8 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-dashed border-border px-5 py-4">
            <div className="min-w-0">
              <p className="font-bold">تسجيل الخروج</p>
              <p className="mt-0.5 text-xs text-muted-foreground">
                مناسباتك ومكافآتك تبقى محفوظة، وتجدينها عند عودتك.
              </p>
            </div>
            <Button
              variant="outline"
              size="pill"
              className="shrink-0 text-destructive hover:border-destructive/40 hover:text-destructive"
              onClick={() => signOut()}
            >
              <LogOut className="size-4" />
              خروج
            </Button>
          </div>
        </section>
      </main>

      <StorefrontFooter storeName={settings.storeName} onNavigate={navigate} />
      <FloatingContactButton />
      <BackToTop />
    </div>
  );
}
