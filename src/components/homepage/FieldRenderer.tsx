import { useFormContext } from 'react-hook-form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import type { FieldDescriptor } from '@/lib/homepage/types';
import { ImageField } from './fields/ImageField';
import { CtaField } from './fields/CtaField';
import { ItemListEditor } from './ItemListEditor';

/**
 * واصف حقل → عنصر إدخال.
 *
 * ليس محرّك نماذج عاماً: خمسة أنواع إدخال ومصفوفة واصفات، وهو ما يكفي للأقسام
 * الاثني عشر بلا اثني عشر نموذجاً مكتوباً يدوياً ولا طبقة تجريد تُخفي ما يجري.
 */
export function FieldRenderer({ field, prefix }: { field: FieldDescriptor; prefix?: string }) {
  const form = useFormContext();
  const name = prefix ? `${prefix}.${field.name}` : field.name;

  if (field.kind === 'image') return <ImageField name={name} label={field.label} />;
  if (field.kind === 'cta') return <CtaField name={name} label={field.label} />;
  if (field.kind === 'list') return <ItemListEditor name={name} field={field} />;

  return (
    <FormField
      control={form.control}
      name={name}
      render={({ field: rhf }) => (
        <FormItem className={field.kind === 'toggle' ? 'flex items-center justify-between gap-4 space-y-0' : undefined}>
          <FormLabel className={field.kind === 'toggle' ? 'font-normal' : undefined}>{field.label}</FormLabel>

          <FormControl>
            {field.kind === 'toggle' ? (
              <Switch checked={!!rhf.value} onCheckedChange={rhf.onChange} aria-label={field.label} />
            ) : field.kind === 'textarea' ? (
              <Textarea {...rhf} rows={3} />
            ) : field.kind === 'number' ? (
              // الأرقام تُكتب لاتينية في النموذج وتُعرض هندية على المتجر
              <Input {...rhf} type="number" inputMode="numeric" dir="ltr" className="max-w-32 text-start" />
            ) : field.kind === 'select' ? (
              <Select value={String(rhf.value ?? '')} onValueChange={rhf.onChange} dir="rtl">
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {(field.options ?? []).map((o) => (
                    <SelectItem key={o.value} value={o.value}>
                      {o.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            ) : (
              <Input {...rhf} />
            )}
          </FormControl>

          {field.hint && <FormDescription>{field.hint}</FormDescription>}
          <FormMessage />
        </FormItem>
      )}
    />
  );
}
