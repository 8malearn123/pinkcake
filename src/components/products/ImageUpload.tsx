import { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from '@/hooks/use-toast';
import { Upload, X, Loader2, ImageIcon } from 'lucide-react';
import { cn } from '@/lib/utils';
import { uploadStoreImage } from '@/lib/imageUpload';

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

    setIsUploading(true);
    // التحقّق والرفع في `@/lib/imageUpload` كي يشترك معه محرِّر الصفحة الرئيسية
    const result = await uploadStoreImage(file, 'products');
    setIsUploading(false);
    if (inputRef.current) inputRef.current.value = '';

    if (result.error) {
      toast({ ...result.error, variant: 'destructive' });
      return;
    }

    setPreview(result.url);
    onChange(result.url);
    toast({ title: 'تم الرفع', description: 'تم رفع الصورة بنجاح' });
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
