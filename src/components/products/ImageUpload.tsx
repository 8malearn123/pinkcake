import { useState, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from '@/hooks/use-toast';
import { Upload, X, Loader2, ImageIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ImageUploadProps {
  value?: string | null;
  onChange: (url: string | null) => void;
  disabled?: boolean;
}

export function ImageUpload({ value, onChange, disabled }: ImageUploadProps) {
  const [isUploading, setIsUploading] = useState(false);
  const [preview, setPreview] = useState<string | null>(value || null);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
    if (!allowedTypes.includes(file.type)) {
      toast({
        title: 'نوع ملف غير مدعوم',
        description: 'يرجى اختيار صورة بصيغة JPG أو PNG أو WebP أو GIF',
        variant: 'destructive',
      });
      return;
    }

    // Validate file size (5MB max)
    if (file.size > 5 * 1024 * 1024) {
      toast({
        title: 'حجم الملف كبير جداً',
        description: 'الحد الأقصى لحجم الصورة هو 5 ميجابايت',
        variant: 'destructive',
      });
      return;
    }

    setIsUploading(true);

    try {
      // Create unique filename
      const fileExt = file.name.split('.').pop();
      const fileName = `${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`;
      const filePath = `products/${fileName}`;

      // Upload to Supabase Storage
      const { error: uploadError } = await supabase.storage
        .from('product-images')
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: false,
        });

      if (uploadError) {
        throw uploadError;
      }

      // Get public URL
      const { data: urlData } = supabase.storage
        .from('product-images')
        .getPublicUrl(filePath);

      setPreview(urlData.publicUrl);
      onChange(urlData.publicUrl);

      toast({
        title: 'تم الرفع',
        description: 'تم رفع الصورة بنجاح',
      });
    } catch (error: any) {
      console.error('Upload error:', error);
      toast({
        title: 'فشل الرفع',
        description: error.message || 'حدث خطأ أثناء رفع الصورة',
        variant: 'destructive',
      });
    } finally {
      setIsUploading(false);
      // Reset input
      if (inputRef.current) {
        inputRef.current.value = '';
      }
    }
  };

  const handleRemove = () => {
    setPreview(null);
    onChange(null);
  };

  return (
    <div className="space-y-3">
      <Label>صورة المنتج</Label>
      
      {preview ? (
        <div className="relative w-full max-w-[200px]">
          <img
            src={preview}
            alt="معاينة الصورة"
            className="w-full h-40 object-cover rounded-lg border"
          />
          <Button
            type="button"
            variant="destructive"
            size="icon" aria-label="حذف الصورة"
            className="absolute -top-2 -end-2 h-7 w-7"
            onClick={handleRemove}
            disabled={disabled || isUploading}
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      ) : (
        <div
          className={cn(
            'relative border-2 border-dashed rounded-lg p-6 flex flex-col items-center justify-center gap-2 cursor-pointer transition-colors',
            'hover:border-primary hover:bg-primary/5',
            isUploading && 'pointer-events-none opacity-50'
          )}
          onClick={() => inputRef.current?.click()}
        >
          {isUploading ? (
            <>
              <Loader2 className="h-8 w-8 text-primary animate-spin" />
              <span className="text-sm text-muted-foreground">جاري الرفع...</span>
            </>
          ) : (
            <>
              <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                <ImageIcon className="h-6 w-6 text-primary" />
              </div>
              <span className="text-sm font-medium">اختر صورة أو اسحبها هنا</span>
              <span className="text-xs text-muted-foreground">
                JPG, PNG, WebP, GIF - الحد الأقصى 5 ميجابايت
              </span>
            </>
          )}
        </div>
      )}

      <Input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp,image/gif"
        className="hidden"
        onChange={handleFileChange}
        disabled={disabled || isUploading}
      />

      {!preview && (
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="gap-2"
          onClick={() => inputRef.current?.click()}
          disabled={disabled || isUploading}
        >
          <Upload className="h-4 w-4" />
          رفع صورة
        </Button>
      )}
    </div>
  );
}
