import { useFormContext } from 'react-hook-form';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { CTA_TARGETS } from '@/lib/homepage/types';

/**
 * زرّ: نصّه ووجهته وإظهاره.
 *
 * الوجهة قائمة مغلقة لا حقل نصّ حرّ — المدير يختار قسماً أو صفحة في المتجر،
 * فلا يمكن أن يكتب رابطاً خارجياً في زرّ داخلي ولا مرساة إلى قسم غير موجود.
 */
export function CtaField({ name, label }: { name: string; label: string }) {
  const form = useFormContext();

  return (
    <div className="space-y-3 rounded-lg border border-border bg-muted/30 p-4">
      <div className="flex items-center justify-between gap-4">
        <p className="text-sm font-bold">{label}</p>
        <FormField
          control={form.control}
          name={`${name}.visible`}
          render={({ field }) => (
            <FormItem className="flex items-center gap-2 space-y-0">
              <FormLabel className="text-xs font-normal text-muted-foreground">إظهار</FormLabel>
              <FormControl>
                <Switch checked={field.value} onCheckedChange={field.onChange} aria-label={`إظهار ${label}`} />
              </FormControl>
            </FormItem>
          )}
        />
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <FormField
          control={form.control}
          name={`${name}.label`}
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-xs">النص</FormLabel>
              <FormControl>
                <Input {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name={`${name}.target`}
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-xs">الوجهة</FormLabel>
              <Select value={field.value} onValueChange={field.onChange} dir="rtl">
                <FormControl>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {CTA_TARGETS.map((t) => (
                    <SelectItem key={t.value} value={t.value}>
                      {t.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />
      </div>
    </div>
  );
}
