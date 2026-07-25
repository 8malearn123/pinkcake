import { ArrowUpDown } from 'lucide-react';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import { CategoryChips } from '@/components/store/CategoryChips';
import { SORTS } from '@/lib/shopSort';

interface ShopToolbarProps {
  categories: string[];
  selectedCategory: string;
  onSelectCategory: (c: string) => void;
  sort: string;
  onSort: (v: string) => void;
  count: number;
  isNarrowed: boolean;
}

/**
 * The storefront control strip: category filter + sort + live result count.
 * Sticky under the header on md+ (the mobile header carries a second search
 * row, so it stays static below md to avoid overlap). Full-bleed blurred band
 * via a symmetric negative margin — RTL-safe (no directional utilities).
 */
export function ShopToolbar({
  categories, selectedCategory, onSelectCategory, sort, onSort, count, isNarrowed,
}: ShopToolbarProps) {
  return (
    <div className="md:sticky md:top-16 z-30 -mx-4 lg:-mx-6 px-4 lg:px-6 py-3 bg-background/90 backdrop-blur-xl border-b border-border/60">
      <div className="flex items-center gap-3 flex-wrap">
        <div className="flex-1 min-w-0">
          <CategoryChips categories={categories} selected={selectedCategory} onSelect={onSelectCategory} />
        </div>
        <Select value={sort} onValueChange={onSort}>
          <SelectTrigger className="w-[185px] h-10 rounded-full shrink-0 gap-1">
            <ArrowUpDown className="w-4 h-4 text-muted-foreground" />
            <SelectValue placeholder="ترتيب" />
          </SelectTrigger>
          <SelectContent>
            {SORTS.map((s) => (
              <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      {count > 0 && (
        <div className="text-sm text-muted-foreground mt-2">
          {count} منتج{isNarrowed ? ' مطابق' : ''}
        </div>
      )}
    </div>
  );
}
