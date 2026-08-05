import { useMemo, useState } from 'react';
import { ArrowDown, ArrowUp, ImageOff, Search, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { RiyalSymbol } from '@/components/ui/riyal';
import { cn } from '@/lib/utils';
import { MAX_COMBO_MEMBERS, MIN_COMBO_MEMBERS } from '@/lib/combosCatalog/types';

export interface PickableProduct {
  id: string;
  name: string;
  price: number;
  image_url?: string | null;
  category?: string | null;
}

interface ComboProductPickerProps {
  products: PickableProduct[];
  /** Selected product ids, in the order they appear on the card. */
  value: string[];
  onChange: (ids: string[]) => void;
  disabled?: boolean;
}

function Thumb({ product }: { product: PickableProduct }) {
  if (!product.image_url) {
    return (
      <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-muted">
        <ImageOff className="size-4 text-muted-foreground" />
      </div>
    );
  }
  return (
    <img
      src={product.image_url}
      alt=""
      className="size-10 shrink-0 rounded-lg object-cover"
      loading="lazy"
    />
  );
}

/**
 * Pick the products a combo bundles.
 *
 * Order matters — it drives the thumbnail row on the storefront card — so the
 * chosen items are a separate ordered list with move controls rather than just
 * a set of ticks. Selection is capped at MAX_COMBO_MEMBERS because past that
 * the card's overlapping avatars stop reading as a set.
 */
export function ComboProductPicker({ products, value, onChange, disabled }: ComboProductPickerProps) {
  const [query, setQuery] = useState('');

  const byId = useMemo(() => new Map(products.map((p) => [p.id, p])), [products]);
  const chosen = useMemo(
    () => value.map((id) => byId.get(id)).filter((p): p is PickableProduct => !!p),
    [value, byId],
  );

  // Ids the catalogue no longer has: a product was deleted (or these are demo
  // seeds against a real backend). Surfaced so staff can clear them out.
  const missing = useMemo(() => value.filter((id) => !byId.has(id)), [value, byId]);

  const results = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return products;
    return products.filter(
      (p) => p.name.toLowerCase().includes(q) || (p.category ?? '').toLowerCase().includes(q),
    );
  }, [products, query]);

  const atCap = value.length >= MAX_COMBO_MEMBERS;

  const toggle = (id: string) => {
    if (disabled) return;
    if (value.includes(id)) {
      onChange(value.filter((existing) => existing !== id));
    } else if (!atCap) {
      onChange([...value, id]);
    }
  };

  const move = (index: number, delta: number) => {
    const target = index + delta;
    if (disabled || target < 0 || target >= value.length) return;
    const next = [...value];
    [next[index], next[target]] = [next[target], next[index]];
    onChange(next);
  };

  return (
    <div className="space-y-3">
      {/* Chosen, in card order */}
      {value.length > 0 && (
        <ul className="space-y-2 rounded-xl border border-border/60 bg-muted/30 p-2">
          {chosen.map((product, index) => (
            <li key={product.id} className="flex items-center gap-2 rounded-lg bg-card p-2">
              <span className="grid size-6 shrink-0 place-items-center rounded-md bg-primary/10 text-xs font-bold text-primary">
                {index + 1}
              </span>
              <Thumb product={product} />
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium">{product.name}</p>
                <p className="flex items-baseline gap-1 text-xs text-muted-foreground">
                  {product.price} <RiyalSymbol className="text-[10px]" />
                </p>
              </div>
              <div className="flex shrink-0 items-center">
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="size-7"
                  aria-label={`تحريك ${product.name} للأعلى`}
                  disabled={disabled || index === 0}
                  onClick={() => move(index, -1)}
                >
                  <ArrowUp className="size-3.5" />
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="size-7"
                  aria-label={`تحريك ${product.name} للأسفل`}
                  disabled={disabled || index === value.length - 1}
                  onClick={() => move(index, 1)}
                >
                  <ArrowDown className="size-3.5" />
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="size-7 text-destructive"
                  aria-label={`إزالة ${product.name}`}
                  disabled={disabled}
                  onClick={() => toggle(product.id)}
                >
                  <X className="size-3.5" />
                </Button>
              </div>
            </li>
          ))}

          {missing.map((id) => (
            <li
              key={id}
              className="flex items-center gap-2 rounded-lg border border-warning/40 bg-warning/5 p-2"
            >
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium text-warning">منتج غير موجود في الكتالوج</p>
                <p className="truncate text-xs text-muted-foreground">{id}</p>
              </div>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="size-7 text-destructive"
                aria-label="إزالة المنتج المفقود"
                disabled={disabled}
                onClick={() => onChange(value.filter((existing) => existing !== id))}
              >
                <X className="size-3.5" />
              </Button>
            </li>
          ))}
        </ul>
      )}

      <div className="relative">
        <Search className="absolute start-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder="ابحث عن منتج لإضافته..."
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          disabled={disabled}
          className="ps-10"
        />
      </div>

      <div className="max-h-56 overflow-y-auto rounded-xl border border-border/60">
        {results.length === 0 ? (
          <p className="p-4 text-center text-sm text-muted-foreground">لا توجد منتجات مطابقة</p>
        ) : (
          <ul className="divide-y divide-border/60">
            {results.map((product) => {
              const selected = value.includes(product.id);
              const blocked = !selected && atCap;
              return (
                <li key={product.id}>
                  <label
                    className={cn(
                      'flex cursor-pointer items-center gap-3 p-2.5 transition-colors hover:bg-muted/50',
                      blocked && 'cursor-not-allowed opacity-50',
                    )}
                  >
                    <Checkbox
                      checked={selected}
                      disabled={disabled || blocked}
                      onCheckedChange={() => toggle(product.id)}
                    />
                    <Thumb product={product} />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium">{product.name}</p>
                      <p className="truncate text-xs text-muted-foreground">
                        {product.category || 'بدون تصنيف'}
                      </p>
                    </div>
                    <span className="flex shrink-0 items-baseline gap-1 text-sm font-semibold">
                      {product.price} <RiyalSymbol className="text-[10px]" />
                    </span>
                  </label>
                </li>
              );
            })}
          </ul>
        )}
      </div>

      <p className="text-xs text-muted-foreground">
        اختر من {MIN_COMBO_MEMBERS} إلى {MAX_COMBO_MEMBERS} منتجات — الترتيب هو نفسه الظاهر على
        بطاقة الكومبو.
      </p>
    </div>
  );
}
