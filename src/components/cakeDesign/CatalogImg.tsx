import { ImageOff } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useCakeCatalog } from '@/contexts/CakeCatalogContext';

interface CatalogImgProps {
  imageId: string | null | undefined;
  alt: string;
  className?: string;
  /** Shown when the image id has no resolvable blob (evicted, or another browser). */
  fallbackClassName?: string;
  iconClassName?: string;
}

/**
 * The single place a catalog image id becomes pixels. Every consumer degrades
 * the same way when a blob is gone — these live in this browser's IndexedDB,
 * so "missing" is a normal state, not an error.
 */
export function CatalogImg({
  imageId,
  alt,
  className,
  fallbackClassName,
  iconClassName,
}: CatalogImgProps) {
  const { urlFor } = useCakeCatalog();
  const url = urlFor(imageId);

  if (!url) {
    return (
      <div
        className={cn(
          'flex items-center justify-center bg-muted text-muted-foreground',
          className,
          fallbackClassName,
        )}
        role="img"
        aria-label={alt}
      >
        <ImageOff className={cn('w-5 h-5', iconClassName)} />
      </div>
    );
  }

  return <img src={url} alt={alt} loading="lazy" className={cn('object-cover', className)} />;
}
