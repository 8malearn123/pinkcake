import { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import { Search, Cake, ArrowLeft, TrendingUp, X } from 'lucide-react';
import type { StoreProduct } from '@/hooks/useCustomerStore';

interface StoreSearchProps {
  products: StoreProduct[];
  value: string;
  onChange: (q: string) => void;
  /** Called on Enter / "view all" — e.g. scroll to the filtered results grid. */
  onSubmit: () => void;
  placeholder?: string;
  className?: string;
}

const MAX_RESULTS = 6;

/**
 * Live storefront search: an instant-results dropdown under the input. Typing
 * filters `products` in place (name / description / category); results link
 * straight to the product page, and "view all" hands off to the grid via
 * onSubmit. Keyboard: ↑/↓ to move, Enter to open the active result (or view all),
 * Esc to close.
 */
export function StoreSearch({
  products,
  value,
  onChange,
  onSubmit,
  placeholder = 'ابحث عن كيكة أو نكهة...',
  className,
}: StoreSearchProps) {
  const navigate = useNavigate();
  const wrapRef = useRef<HTMLDivElement>(null);
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(-1);

  const q = value.trim().toLowerCase();

  const matches = useMemo(() => {
    if (!q) return [];
    return products
      .filter(
        (p) =>
          p.name.toLowerCase().includes(q) ||
          !!p.description?.toLowerCase().includes(q) ||
          !!p.category?.toLowerCase().includes(q),
      )
      .slice(0, MAX_RESULTS);
  }, [products, q]);

  const suggestions = useMemo(() => products.slice(0, 4), [products]);
  const categories = useMemo(
    () => [...new Set(products.map((p) => p.category).filter(Boolean))] as string[],
    [products],
  );

  // Close on outside click.
  useEffect(() => {
    const onDoc = (e: MouseEvent) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', onDoc);
    return () => document.removeEventListener('mousedown', onDoc);
  }, []);

  // Reset highlight when the query changes.
  useEffect(() => setActive(-1), [q]);

  const go = (id: string) => {
    setOpen(false);
    navigate(`/product/${id}`);
  };

  const submitAll = () => {
    setOpen(false);
    onSubmit();
  };

  const onKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Escape') {
      setOpen(false);
      e.currentTarget.blur();
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      if (!open) setOpen(true);
      else setActive((a) => Math.min(a + 1, matches.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setActive((a) => Math.max(a - 1, -1));
    } else if (e.key === 'Enter') {
      if (active >= 0 && matches[active]) go(matches[active].id);
      else if (q) submitAll();
    }
  };

  return (
    <div ref={wrapRef} className={cn('relative', className)}>
      <Search className="absolute start-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none z-10" />
      <Input
        value={value}
        onChange={(e) => {
          onChange(e.target.value);
          setOpen(true);
        }}
        onFocus={() => setOpen(true)}
        onKeyDown={onKeyDown}
        placeholder={placeholder}
        role="combobox"
        aria-expanded={open}
        aria-autocomplete="list"
        className="ps-10 pe-9 h-10 rounded-full bg-secondary/60 border-transparent focus-visible:bg-card"
      />
      {value && (
        <button
          type="button"
          aria-label="مسح البحث"
          onClick={() => {
            onChange('');
            setOpen(true);
          }}
          className="absolute end-2.5 top-1/2 -translate-y-1/2 w-6 h-6 rounded-full grid place-items-center text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors"
        >
          <X className="w-4 h-4" />
        </button>
      )}

      {open && (
        <div className="absolute z-50 mt-2 inset-x-0 rounded-2xl border border-border/60 bg-card shadow-soft-lift overflow-hidden">
          {q ? (
            matches.length > 0 ? (
              <div className="py-1.5 max-h-[min(70vh,420px)] overflow-y-auto">
                {matches.map((p, i) => (
                  <button
                    key={p.id}
                    onClick={() => go(p.id)}
                    onMouseEnter={() => setActive(i)}
                    className={cn(
                      'w-full flex items-center gap-3 px-3 py-2 text-start transition-colors',
                      active === i ? 'bg-secondary' : 'hover:bg-secondary/60',
                    )}
                  >
                    <span
                      className="w-11 h-11 rounded-xl overflow-hidden shrink-0 grid place-items-center"
                      style={{ background: 'linear-gradient(135deg, hsl(var(--blush)), hsl(var(--secondary)))' }}
                    >
                      {p.image_url ? (
                        <img src={p.image_url} alt="" className="w-full h-full object-cover" loading="lazy" />
                      ) : (
                        <Cake className="w-5 h-5 text-primary/40" />
                      )}
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block font-medium text-sm line-clamp-1">{p.name}</span>
                      {p.category && <span className="block text-[11px] text-muted-foreground">{p.category}</span>}
                    </span>
                    <span className="font-display text-base text-primary whitespace-nowrap">
                      {p.price} <span className="text-[10px] text-muted-foreground font-sans">ر.س</span>
                    </span>
                  </button>
                ))}
                <button
                  onClick={submitAll}
                  className="w-full flex items-center justify-center gap-1.5 px-3 py-2.5 mt-1 border-t border-border/60 text-sm text-primary font-medium hover:bg-primary/5 transition-colors"
                >
                  عرض كل النتائج <ArrowLeft className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <div className="px-4 py-8 text-center">
                <div className="w-12 h-12 mx-auto rounded-full bg-secondary grid place-items-center mb-3">
                  <Search className="w-5 h-5 text-muted-foreground" />
                </div>
                <p className="text-sm font-medium">لا توجد نتائج لـ «{value.trim()}»</p>
                <p className="text-xs text-muted-foreground mt-1">جرّب كلمة أخرى مثل: شوكولاتة، تشيز كيك…</p>
              </div>
            )
          ) : suggestions.length === 0 ? (
            <div className="px-4 py-6 text-center text-sm text-muted-foreground">ابدأ بالكتابة للبحث…</div>
          ) : (
            <div className="p-3">
              {categories.length > 0 && (
                <>
                  <div className="text-[11px] text-muted-foreground px-1 mb-2 tracking-widest uppercase">تصفّح حسب الفئة</div>
                  <div className="flex flex-wrap gap-1.5 mb-3">
                    {categories.map((c) => (
                      <button
                        key={c}
                        onClick={() => onChange(c)}
                        className="press text-xs rounded-full border border-border bg-card px-3 py-1.5 hover:border-primary/40 hover:text-primary transition-colors"
                      >
                        {c}
                      </button>
                    ))}
                  </div>
                </>
              )}
              <div className="text-[11px] text-muted-foreground px-1 mb-1 tracking-widest uppercase inline-flex items-center gap-1">
                <TrendingUp className="w-3 h-3" /> الأكثر رواجاً
              </div>
              {suggestions.map((p) => (
                <button
                  key={p.id}
                  onClick={() => go(p.id)}
                  className="w-full flex items-center gap-3 px-1.5 py-2 text-start rounded-lg hover:bg-secondary/60 transition-colors"
                >
                  <span
                    className="w-9 h-9 rounded-lg overflow-hidden shrink-0 grid place-items-center"
                    style={{ background: 'linear-gradient(135deg, hsl(var(--blush)), hsl(var(--secondary)))' }}
                  >
                    {p.image_url ? (
                      <img src={p.image_url} alt="" className="w-full h-full object-cover" loading="lazy" />
                    ) : (
                      <Cake className="w-4 h-4 text-primary/40" />
                    )}
                  </span>
                  <span className="flex-1 min-w-0 text-sm line-clamp-1">{p.name}</span>
                  <span className="text-xs text-muted-foreground whitespace-nowrap">{p.price} ر.س</span>
                </button>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
