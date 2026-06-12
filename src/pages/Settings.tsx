import { useState } from 'react';
import { MainLayout } from '@/components/layout/MainLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ColorPicker } from '@/components/settings/ColorPicker';
import { PresetColors } from '@/components/settings/PresetColors';
import { NotificationSettings } from '@/components/settings/NotificationSettings';
import { useSettings } from '@/contexts/SettingsContext';
import { NOTIFICATIONS_UI_ENABLED } from '@/lib/featureFlags';
import { Settings as SettingsIcon, Store, Palette, RotateCcw, Save, Check, Bell } from 'lucide-react';
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
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl gradient-pink flex items-center justify-center">
                <SettingsIcon className="w-5 h-5 text-white" />
              </div>
              الإعدادات
            </h1>
            <p className="text-muted-foreground mt-1">تخصيص مظهر النظام ومعلومات المتجر</p>
          </div>
          <Button variant="outline" onClick={handleResetColors} className="gap-2">
            <RotateCcw className="w-4 h-4" />
            إعادة التعيين
          </Button>
        </div>

        <Tabs defaultValue="store" className="w-full">
          <TabsList className={NOTIFICATIONS_UI_ENABLED ? 'grid w-full max-w-xl grid-cols-3' : 'grid w-full max-w-md grid-cols-2'}>
            <TabsTrigger value="store" className="gap-2">
              <Store className="w-4 h-4" />
              المتجر
            </TabsTrigger>
            <TabsTrigger value="colors" className="gap-2">
              <Palette className="w-4 h-4" />
              الألوان
            </TabsTrigger>
            {NOTIFICATIONS_UI_ENABLED && (
              <TabsTrigger value="notifications" className="gap-2">
                <Bell className="w-4 h-4" />
                الإشعارات
              </TabsTrigger>
            )}
          </TabsList>

          <TabsContent value="store" className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Store className="w-5 h-5" />
                  معلومات المتجر
                </CardTitle>
                <CardDescription>
                  تخصيص اسم المتجر والوصف الذي يظهر في الشريط الجانبي
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
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
              </CardContent>
            </Card>
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
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Palette className="w-5 h-5" />
                  تخصيص الألوان يدوياً
                </CardTitle>
                <CardDescription>
                  اختر الألوان المناسبة لعلامتك التجارية
                </CardDescription>
              </CardHeader>
              <CardContent>
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
              </CardContent>
            </Card>

            {/* Live Preview */}
            <Card>
              <CardHeader>
                <CardTitle>معاينة مباشرة</CardTitle>
                <CardDescription>شاهد كيف تبدو الألوان المختارة</CardDescription>
              </CardHeader>
              <CardContent>
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
              </CardContent>
            </Card>
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
