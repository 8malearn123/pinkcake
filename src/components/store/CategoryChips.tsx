import { cn } from '@/lib/utils';

interface CategoryChipsProps {
  categories: string[];
  selected: string;
  onSelect: (cat: string) => void;
}

export function CategoryChips({ categories, selected, onSelect }: CategoryChipsProps) {
  if (categories.length === 0) return null;
  const all = ['all', ...categories];
  return (
    <div className="flex gap-2 overflow-x-auto pb-2 -mx-2 px-2 scrollbar-none">
      {all.map((cat) => {
        const active = selected === cat;
        const label = cat === 'all' ? 'الكل' : cat;
        return (
          <button
            key={cat}
            onClick={() => onSelect(cat)}
            className={cn(
              'shrink-0 px-5 h-10 rounded-full text-sm font-medium transition-all border',
              active
                ? 'bg-foreground text-background border-foreground shadow-soft-lift'
                : 'bg-card text-foreground border-border hover:border-primary/50 hover:text-primary'
            )}
          >
            {label}
          </button>
        );
      })}
    </div>
  );
}
