import { useRef, useState } from 'react';
import { ImagePlus, Loader2, Plus, Upload, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { dragCarriesFiles } from '@/lib/imageFiles';

type DropVariant = 'block' | 'row' | 'slot';

interface LocalImageDropProps {
  variant?: DropVariant;
  /** Resolved object URL of the current image, if any. */
  previewUrl?: string;
  onSelect: (file: File) => void | Promise<void>;
  onClear?: () => void;
  disabled?: boolean;
  busy?: boolean;
  /** Accessible name — required for `slot`, which is icon-only. */
  label: string;
  title?: string;
  hint?: string;
  className?: string;
}

/**
 * The local-blob counterpart of products/ImageUpload: same Arabic copy and the
 * same limits, but the bytes go to IndexedDB instead of Supabase Storage.
 *
 * Unlike ImageUpload, the "drag it here" affordance is real — the cake variant
 * tree needs genuine drop targets, so the handlers live here and are reused by
 * every slot. Shared by «تصميم الكيك» and the combos hero picker.
 */
export function LocalImageDrop({
  variant = 'block',
  previewUrl,
  onSelect,
  onClear,
  disabled,
  busy,
  label,
  title,
  hint,
  className,
}: LocalImageDropProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);
  const locked = disabled || busy;

  const pick = (file: File | undefined) => {
    if (!file || locked) return;
    void onSelect(file);
  };

  const handlers = {
    onDragOver: (event: React.DragEvent) => {
      if (locked || !dragCarriesFiles(event.dataTransfer)) return;
      event.preventDefault();
      setDragging(true);
    },
    // `dragleave` also fires when the cursor crosses a child element, which
    // would make the highlight flicker — only clear when it truly leaves.
    onDragLeave: (event: React.DragEvent) => {
      if (event.currentTarget.contains(event.relatedTarget as Node | null)) return;
      setDragging(false);
    },
    onDrop: (event: React.DragEvent) => {
      if (locked) return;
      event.preventDefault();
      event.stopPropagation();
      setDragging(false);
      pick(event.dataTransfer.files?.[0]);
    },
  };

  const input = (
    <input
      ref={inputRef}
      type="file"
      accept="image/jpeg,image/png,image/webp,image/gif"
      className="hidden"
      disabled={locked}
      onChange={(event) => {
        pick(event.target.files?.[0]);
        event.target.value = '';
      }}
    />
  );

  if (variant === 'slot') {
    return (
      <div className={cn('relative', className)}>
        <button
          type="button"
          aria-label={label}
          title={label}
          disabled={locked}
          onClick={() => inputRef.current?.click()}
          {...handlers}
          className={cn(
            'h-14 w-14 rounded-xl overflow-hidden border-2 border-dashed flex items-center justify-center transition-colors',
            'hover:border-primary hover:bg-primary/5 disabled:opacity-50',
            dragging ? 'border-primary bg-primary/10' : 'border-border',
            previewUrl && 'border-solid',
          )}
        >
          {busy ? (
            <Loader2 className="w-4 h-4 animate-spin text-primary" />
          ) : previewUrl ? (
            <img src={previewUrl} alt={label} className="h-full w-full object-cover" />
          ) : (
            <Plus className="w-4 h-4 text-muted-foreground" />
          )}
        </button>
        {previewUrl && onClear && (
          <Button
            type="button"
            variant="destructive"
            size="icon"
            aria-label={`إزالة ${label}`}
            className="absolute -top-2 -end-2 h-5 w-5"
            disabled={locked}
            onClick={onClear}
          >
            <X className="h-3 w-3" />
          </Button>
        )}
        {input}
      </div>
    );
  }

  if (previewUrl) {
    return (
      <div className={cn('relative w-full max-w-[240px]', className)}>
        <img
          src={previewUrl}
          alt={label}
          className="w-full h-40 object-cover rounded-xl border border-border"
        />
        {onClear && (
          <Button
            type="button"
            variant="destructive"
            size="icon"
            aria-label={`إزالة ${label}`}
            className="absolute -top-2 -end-2 h-7 w-7"
            disabled={locked}
            onClick={onClear}
          >
            <X className="h-4 w-4" />
          </Button>
        )}
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="mt-3 gap-2"
          disabled={locked}
          onClick={() => inputRef.current?.click()}
        >
          <Upload className="h-4 w-4" />
          استبدال الصورة
        </Button>
        {input}
      </div>
    );
  }

  return (
    <div
      role="button"
      tabIndex={locked ? -1 : 0}
      aria-label={label}
      onClick={() => inputRef.current?.click()}
      onKeyDown={(event) => {
        if (event.key === 'Enter' || event.key === ' ') {
          event.preventDefault();
          inputRef.current?.click();
        }
      }}
      {...handlers}
      className={cn(
        'border-2 border-dashed rounded-xl flex flex-col items-center justify-center gap-2 cursor-pointer transition-colors text-center',
        variant === 'row' ? 'p-4' : 'p-6',
        'hover:border-primary hover:bg-primary/5',
        dragging ? 'border-primary bg-primary/10' : 'border-border',
        locked && 'pointer-events-none opacity-50',
        className,
      )}
    >
      {busy ? (
        <>
          <Loader2 className="h-8 w-8 text-primary animate-spin" />
          <span className="text-sm text-muted-foreground">جاري الحفظ...</span>
        </>
      ) : (
        <>
          <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
            <ImagePlus className="h-6 w-6 text-primary" />
          </div>
          <span className="text-sm font-medium">{title ?? 'اختر صورة أو اسحبها هنا'}</span>
          <span className="text-xs text-muted-foreground">
            {hint ?? 'JPG, PNG, WebP, GIF — الحد الأقصى 5 ميجابايت'}
          </span>
        </>
      )}
      {input}
    </div>
  );
}
