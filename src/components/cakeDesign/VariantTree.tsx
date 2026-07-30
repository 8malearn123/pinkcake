import { useState } from 'react';
import { ChevronDown, ChevronLeft, ImageOff, ListTree, Loader2, Plus } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { EmptyState } from '@/components/ds';
import { RiyalSymbol } from '@/components/ui/riyal';
import { formatSAR } from '@/lib/currency';
import { cn } from '@/lib/utils';
import { dragCarriesFiles } from '@/lib/cakeCatalog/validate';
import type { TreeAddRow, TreeItem } from '@/lib/cakeCatalog/types';

export interface VariantTreeProps {
  /** Already flattened and ordered by `buildTreeRows` — render as-is. */
  items: TreeItem[];
  levelCount: number;
  selectedKey: string | null;
  thumbUrlFor: (imageId: string | null) => string | undefined;
  onSelect: (key: string, path: string[]) => void;
  onToggle: (key: string) => void;
  onDropFile: (path: string[], file: File) => void;
  /** Resolves false when the name is rejected — the typed draft is kept. */
  onAddValue: (levelIndex: number, name: string) => Promise<boolean>;
  busyKey?: string | null;
}

const INDENT_BASE = 12;
const INDENT_STEP = 24;

function counterTone(fill: number, total: number): string {
  if (fill === 0) return 'text-destructive';
  if (fill >= total) return 'text-success';
  return 'text-muted-foreground';
}

/**
 * شجرة الخيارات — تعرض صفوف الشجرة المُسطّحة مع صورة كل عقدة وعدّاد التغطية،
 * وتقبل إفلات صورة من الجهاز مباشرةً على أي صف.
 *
 * المكوّن عرضٌ خالص: كل البيانات والإجراءات تصل عبر الخصائص، فلا يقرأ المتجر
 * ولا سياق الكتالوج — ما يجعله قابلاً للاختبار دون مزوّد ولا IndexedDB.
 */
export function VariantTree({
  items,
  levelCount,
  selectedKey,
  thumbUrlFor,
  onSelect,
  onToggle,
  onDropFile,
  onAddValue,
  busyKey,
}: VariantTreeProps) {
  const [dragKey, setDragKey] = useState<string | null>(null);
  const [drafts, setDrafts] = useState<Record<string, string>>({});
  // The single tab stop: the selected row when it is visible (filters can hide
  // it), otherwise the first row.
  const selectedVisible =
    !!selectedKey && items.some((item) => item.kind === 'node' && item.key === selectedKey);
  const rovingKey = selectedVisible
    ? selectedKey
    : items.find((item) => item.kind === 'node')?.key ?? null;

  if (items.length === 0) {
    return (
      <EmptyState
        icon={ListTree}
        title="لا توجد خيارات بعد"
        description="أضف المستويات وخياراتها أولاً."
      />
    );
  }

  // Clear the draft only when the add actually landed — a duplicate-name
  // rejection must leave the text in place for the admin to correct.
  const submitDraft = async (item: TreeAddRow) => {
    const name = (drafts[item.key] ?? '').trim();
    if (!name) return;
    const ok = await onAddValue(item.levelIndex, name);
    if (ok) setDrafts((current) => ({ ...current, [item.key]: '' }));
  };

  return (
    <div role="tree" aria-label="شجرة التشكيلات" className="space-y-1">
      {items.map((item) => {
        if (item.kind === 'add') {
          const draft = drafts[item.key] ?? '';
          return (
            <div key={item.key} style={{ paddingInlineStart: INDENT_BASE + item.depth * INDENT_STEP }}>
              <div className="flex items-center gap-2 rounded-lg border border-dashed border-border p-1">
                <Input
                  value={draft}
                  onChange={(event) =>
                    setDrafts((current) => ({ ...current, [item.key]: event.target.value }))
                  }
                  onKeyDown={(event) => {
                    if (event.key !== 'Enter') return;
                    event.preventDefault();
                    void submitDraft(item);
                  }}
                  placeholder={`أضف ${item.levelName} (لكل الكيكات)…`}
                  className="h-8 border-0 bg-transparent shadow-none focus-visible:ring-0"
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="shrink-0 gap-1"
                  disabled={draft.trim().length === 0}
                  onClick={() => void submitDraft(item)}
                >
                  <Plus className="h-4 w-4" />
                  أضف
                </Button>
              </div>
            </div>
          );
        }

        const row = item;
        const selected = selectedKey === row.key;
        const dragging = dragKey === row.key;
        const thumbUrl = thumbUrlFor(row.imageId);

        return (
          <div
            key={row.key}
            // A treeitem, not a nested role="button": a button may not contain
            // another button, and the row's accessible name would otherwise be
            // computed from its contents — absorbing the caret's «توسيع» label.
            role="treeitem"
            // Roving tabindex: one stop for the whole tree, arrows move within
            // it — a fully expanded cake is 120 rows, which as individual tab
            // stops would bury everything after the tree.
            tabIndex={rovingKey === row.key ? 0 : -1}
            aria-label={`${row.valueName} — ${row.levelName}`}
            aria-level={row.depth + 1}
            aria-selected={selected}
            aria-expanded={row.hasChildren ? row.expanded : undefined}
            title={`${row.valueName} — ${row.levelName} (المستوى ${row.depth + 1} من ${levelCount})`}
            style={{ paddingInlineStart: INDENT_BASE + row.depth * INDENT_STEP }}
            onClick={() => onSelect(row.key, row.path)}
            onKeyDown={(event) => {
              if (event.key === 'Enter' || event.key === ' ') {
                event.preventDefault();
                onSelect(row.key, row.path);
                return;
              }
              if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
                event.preventDefault();
                const target = event.currentTarget;
                const tree = target.closest('[role="tree"]');
                if (!tree) return;
                const rows = [...tree.querySelectorAll<HTMLElement>('[role="treeitem"]')];
                const next = rows[rows.indexOf(target) + (event.key === 'ArrowDown' ? 1 : -1)];
                next?.focus();
                return;
              }
              // RTL: the inline-start arrow (→ visually) collapses, ← expands.
              if (event.key === 'ArrowLeft' && row.hasChildren && !row.expanded) {
                event.preventDefault();
                onToggle(row.key);
                return;
              }
              if (event.key === 'ArrowRight' && row.hasChildren && row.expanded) {
                event.preventDefault();
                onToggle(row.key);
              }
            }}
            onDragOver={(event) => {
              if (!dragCarriesFiles(event.dataTransfer)) return;
              event.preventDefault();
              setDragKey(row.key);
            }}
            // `dragleave` fires again whenever the cursor crosses a child span,
            // so only clear once the pointer has truly left the row.
            onDragLeave={(event) => {
              if (event.currentTarget.contains(event.relatedTarget as Node | null)) return;
              setDragKey((current) => (current === row.key ? null : current));
            }}
            onDrop={(event) => {
              event.preventDefault();
              event.stopPropagation();
              setDragKey(null);
              const file = event.dataTransfer.files?.[0];
              if (file) onDropFile(row.path, file);
            }}
            className={cn(
              'flex min-w-0 cursor-pointer items-center gap-2 rounded-xl border py-1.5 pe-3 transition-colors',
              selected ? 'bg-primary/10 border-primary' : 'border-transparent hover:bg-muted/60',
              dragging && 'border-primary bg-primary/10',
            )}
          >
            {row.hasChildren ? (
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="h-7 w-7 shrink-0"
                aria-label={row.expanded ? 'طيّ' : 'توسيع'}
                onClick={(event) => {
                  event.stopPropagation();
                  onToggle(row.key);
                }}
              >
                {row.expanded ? (
                  <ChevronDown className="h-4 w-4" />
                ) : (
                  <ChevronLeft className="h-4 w-4" />
                )}
              </Button>
            ) : (
              <span className="h-7 w-7 shrink-0" aria-hidden="true" />
            )}

            {thumbUrl ? (
              <img
                src={thumbUrl}
                alt=""
                className="h-7 w-7 shrink-0 overflow-hidden rounded-lg border border-border object-cover"
              />
            ) : (
              <span
                aria-hidden="true"
                className="flex h-7 w-7 shrink-0 items-center justify-center overflow-hidden rounded-lg border border-dashed border-border text-muted-foreground"
              >
                <ImageOff className="h-3 w-3" />
              </span>
            )}

            <span className="truncate font-medium">{row.valueName}</span>
            <Badge variant="secondary" className="shrink-0 font-normal text-muted-foreground">
              {row.levelName}
            </Badge>

            {row.priceDelta !== 0 && (
              <Badge variant="outline" className="shrink-0 gap-1 font-normal">
                <span dir="ltr" className="tabular-nums">
                  {row.priceDelta > 0 ? '+' : '−'}
                  {formatSAR(Math.abs(row.priceDelta))}
                </span>
                <RiyalSymbol />
              </Badge>
            )}

            {dragging && (
              <span className="shrink-0 text-xs text-muted-foreground">أفلت الصورة للحفظ هنا</span>
            )}

            {busyKey === row.key ? (
              <span role="status" aria-label="جارٍ الحفظ" className="ms-auto shrink-0">
                <Loader2 className="h-4 w-4 animate-spin text-primary" aria-hidden="true" />
              </span>
            ) : (
              <span
                dir="ltr"
                className={cn(
                  'ms-auto shrink-0 text-xs tabular-nums',
                  counterTone(row.fill, row.total),
                )}
              >
                {row.fill}/{row.total}
              </span>
            )}
          </div>
        );
      })}
    </div>
  );
}
