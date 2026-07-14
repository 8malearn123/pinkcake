import { useState } from 'react';
import { MainLayout } from '@/components/layout/MainLayout';
import { PageHeader, SectionCard } from '@/components/ds';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ColorPicker } from '@/components/settings/ColorPicker';
import { PresetColors } from '@/components/settings/PresetColors';
import { NotificationSettings } from '@/components/settings/NotificationSettings';
import { CouponsSettings } from '@/components/settings/CouponsSettings';
import { OperationsSettings } from '@/components/settings/OperationsSettings';
import { useSettings } from '@/contexts/SettingsContext';
import { NOTIFICATIONS_UI_ENABLED } from '@/lib/featureFlags';
import { Settings as SettingsIcon, Store, Palette, RotateCcw, Save, Check, Bell, TicketPercent, SlidersHorizontal } from 'lucide-react';
import { toast } from '@/hooks/use-toast';

export default function Settings() {
  const { settings, updateSettings, updateColors, resetToDefaults } = useSettings();
  const [localStoreName, setLocalStoreName] = useState(settings.storeName);
  const [localStoreDescription, setLocalStoreDescription] = useState(settings.storeDescription);
  const [saved, setSaved] = useState(false);

  const handleSaveStoreInfo = () => {
    updateSettings({
      storeName: localStoreName,
      storeDescription: localStoreDescription,
    });
    setSaved(true);
    toast({
      title: 'تم الحفظ',
      description: 'تم حفظ معلومات المتجر بنجاح',
    });
    setTimeout(() => setSaved(false), 2000);
  };

  const handleResetColors = () => {
    resetToDefaults();
    setLocalStoreName('Pink Cake');
    setLocalStoreDescription('نظام إدارة الطلبات');
    toast({
      title: 'تم إعادة التعيين',
      description: 'تم إعادة جميع الإعدادات إلى الوضع الافتراضي',
    });
  };

  return (
    <MainLayout>
      <div className="space-y-6">
        <PageHeader
          title="الإعدادات"
          description="تخصيص مظهر النظام ومعلومات المتجر"
          icon={SettingsIcon}
          actions={
            <Button variant="outline" onClick={handleResetColors} className="gap-2">
              <RotateCcw className="w-4 h-4" />
              إعادة التعيين
            </Button>
          }
        />

        <Tabs defaultValue="store" dir="rtl" className="w-full">
          <TabsList className={NOTIFICATIONS_UI_ENABLED ? 'grid w-full max-w-3xl grid-cols-5' : 'grid w-full max-w-2xl grid-cols-4'}>
            <TabsTrigger value="store" className="gap-2">
              <Store className="w-4 h-4" />
              المتجر
            </TabsTrigger>
            <TabsTrigger value="colors" className="gap-2">
              <Palette className="w-4 h-4" />
              الألوان
            </TabsTrigger>
            <TabsTrigger value="coupons" className="gap-2">
              <TicketPercent className="w-4 h-4" />
              الخصومات
            </TabsTrigger>
            <TabsTrigger value="operations" className="gap-2">
              <SlidersHorizontal className="w-4 h-4" />
              التشغيل
            </TabsTrigger>
            {NOTIFICATIONS_UI_ENABLED && (
              <TabsTrigger value="notifications" className="gap-2">
                <Bell className="w-4 h-4" />
                الإشعارات
              </TabsTrigger>
            )}
          </TabsList>

          <TabsContent value="store" className="mt-6">
            <SectionCard title="معلومات المتجر" icon={Store} contentClassName="space-y-6">
                <p className="text-sm text-muted-foreground -mt-2">
                  تخصيص اسم المتجر والوصف الذي يظهر في الشريط الجانبي
                </p>
                <div className="space-y-2">
                  <Label htmlFor="storeName">اسم المتجر</Label>
                  <Input
                    id="storeName"
                    value={localStoreName}
                    onChange={(e) => setLocalStoreName(e.target.value)}
                    placeholder="أدخل اسم المتجر"
                    className="max-w-md"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="storeDescription">وصف المتجر</Label>
                  <Input
                    id="storeDescription"
                    value={localStoreDescription}
                    onChange={(e) => setLocalStoreDescription(e.target.value)}
                    placeholder="أدخل وصف المتجر"
                    className="max-w-md"
                  />
                </div>

                {/* Preview */}
                <div className="p-4 rounded-lg bg-sidebar text-sidebar-foreground max-w-sm">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-xl gradient-pink flex items-center justify-center shadow-warm">
                      <Store className="w-7 h-7 text-white" />
                    </div>
                    <div>
                      <h3 className="text-lg font-bold">{localStoreName || 'اسم المتجر'}</h3>
                      <p className="text-xs text-sidebar-foreground/60">
                        {localStoreDescription || 'وصف المتجر'}
                      </p>
                    </div>
                  </div>
                </div>

                <Button onClick={handleSaveStoreInfo} className="gap-2">
                  {saved ? (
                    <>
                      <Check className="w-4 h-4" />
                      تم الحفظ
                    </>
                  ) : (
                    <>
                      <Save className="w-4 h-4" />
                      حفظ التغييرات
                    </>
                  )}
                </Button>
            </SectionCard>
          </TabsContent>

          <TabsContent value="colors" className="mt-6 space-y-6">
            {/* Preset Colors */}
            <PresetColors
              onSelect={(preset) => {
                updateColors({
                  primary: preset.primary,
                  primaryLight: preset.primaryLight,
                  primaryDark: preset.primaryDark,
                  accent: preset.accent,
                });
                toast({
                  title: 'تم تطبيق الألوان',
                  description: `تم تطبيق نمط "${preset.name}" بنجاح`,
                });
              }}
            />

            {/* Custom Colors */}
            <SectionCard title="تخصيص الألوان يدوياً" icon={Palette}>
                <p className="text-sm text-muted-foreground -mt-2 mb-6">
                  اختر الألوان المناسبة لعلامتك التجارية
                </p>
                <div className="grid gap-6 md:grid-cols-2">
                  <ColorPicker
                    label="اللون الرئيسي"
                    value={settings.colors.primary}
                    onChange={(value) => updateColors({ primary: value })}
                  />
                  <ColorPicker
                    label="اللون الثانوي"
                    value={settings.colors.accent}
                    onChange={(value) => updateColors({ accent: value })}
                  />
                  <ColorPicker
                    label="اللون الفاتح"
                    value={settings.colors.primaryLight}
                    onChange={(value) => updateColors({ primaryLight: value })}
                  />
                  <ColorPicker
                    label="اللون الداكن"
                    value={settings.colors.primaryDark}
                    onChange={(value) => updateColors({ primaryDark: value })}
                  />
                </div>
            </SectionCard>

            {/* Live Preview */}
            <SectionCard title="معاينة مباشرة" icon={Palette}>
                <p className="text-sm text-muted-foreground -mt-2 mb-4">شاهد كيف تبدو الألوان المختارة</p>
                <div className="flex flex-wrap gap-4">
                  <Button>زر رئيسي</Button>
                  <Button variant="secondary">زر ثانوي</Button>
                  <Button variant="outline">زر محدد</Button>
                  <Button variant="ghost">زر شفاف</Button>
                </div>
                <div className="mt-4 flex gap-3">
                  <div className="px-4 py-2 rounded-full bg-primary text-primary-foreground text-sm">
                    شارة رئيسية
                  </div>
                  <div className="px-4 py-2 rounded-full bg-accent text-accent-foreground text-sm">
                    شارة ثانوية
                  </div>
                </div>
                <div className="mt-4 p-4 rounded-lg gradient-pink text-white">
                  <p className="font-medium">خلفية متدرجة</p>
                  <p className="text-sm opacity-90">هذا مثال على التدرج اللوني</p>
                </div>
            </SectionCard>
          </TabsContent>

          <TabsContent value="coupons" className="mt-6">
            <CouponsSettings />
          </TabsContent>

          <TabsContent value="operations" className="mt-6">
            <OperationsSettings />
          </TabsContent>

          {NOTIFICATIONS_UI_ENABLED && (
            <TabsContent value="notifications" className="mt-6">
              <NotificationSettings />
            </TabsContent>
          )}
        </Tabs>
      </div>
    </MainLayout>
  );
}
