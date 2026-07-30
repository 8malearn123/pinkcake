import { useMemo, useState } from 'react';
import { Images, Plus, Search } from 'lucide-react';
import { EmptyState } from '@/components/ds';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Price } from '@/components/ui/riyal';
import { CatalogImg } from '@/components/cakeDesign/CatalogImg';
import { useCakeCatalog } from '@/contexts/CakeCatalogContext';
import { cakeCoverage, isReadyForCustomers } from '@/lib/cakeCatalog/catalog';

/** تمييز العدد في الفصحى: 1 مفرد، 2 مثنّى، 3–10 جمع، وما فوقها مفرد. */
function nounForm(count: number, one: string, two: string, plural: string): string {
  if (count === 1) return one;
  if (count === 2) return two;
  const tail = count % 100;
  return tail >= 3 && tail <= 10 ? plural : one;
}

function Counted({ count, one, two, plural }: { count: number; one: string; two: string; plural: string }) {
  return (
    <>
      <span dir="ltr" className="tabular-nums">
        {count}
      </span>{' '}
      {nounForm(count, one, two, plural)}
    </>
  );
}

/**
 * مكتبة الكيكات — البطاقات التي يبدأ منها الطاقم كل شيء: صورة العرض، السعر،
 * عدد الصور، وهل الكيكة جاهزة للعملاء أم تنقصها صور.
 */
export function LibraryTab() {
  const { catalog, fillHistogram, hasUrl, openCake } = useCakeCatalog();
  const [query, setQuery] = useState('');

  const cakes = useMemo(
    () => [...catalog.cakes].sort((a, b) => a.createdAt - b.createdAt),
    [catalog.cakes],
  );

  const needle = query.trim().toLowerCase();
  const visible = needle ? cakes.filter((cake) => cake.name.toLowerCase().includes(needle)) : cakes;

  if (catalog.cakes.length === 0) {
    return (
      <EmptyState
        icon={Images}
        title="لا توجد كيكات بعد"
        description="ابدأ بإضافة كيكة، ثم صوّر خياراتها واحداً واحداً حتى تكتمل."
        action={<Button onClick={() => openCake(null)}>أضف كيكة جديدة</Button>}
      />
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative w-full sm:max-w-md">
          <Search className="absolute start-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="ابحث عن كيكة…"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            className="ps-10"
          />
        </div>

        <p className="text-sm text-muted-foreground">
          <Counted count={catalog.cakes.length} one="كيكة" two="كيكتان" plural="كيكات" />
          {' · '}
          <Counted count={catalog.images.length} one="صورة" two="صورتان" plural="صور" />
        </p>
      </div>

      {visible.length === 0 ? (
        <EmptyState icon={Search} title="لا توجد كيكة مطابقة" description="جرّب اسماً آخر." />
      ) : (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {visible.map((cake) => {
            const coverage = cakeCoverage(catalog, cake.id, fillHistogram);
            const ready = isReadyForCustomers(catalog, cake, fillHistogram, hasUrl);
            const hasPreview = !!cake.previewImageId && hasUrl(cake.previewImageId);

            return (
              <button
                key={cake.id}
                type="button"
                onClick={() => openCake(cake.id)}
                className="text-start rounded-2xl border border-border bg-card overflow-hidden transition-colors hover:border-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
              >
                {hasPreview ? (
                  <CatalogImg imageId={cake.previewImageId} alt={cake.name} className="w-full aspect-[4/3]" />
                ) : (
                  <div className="w-full aspect-[4/3] p-3">
                    <div className="h-full w-full rounded-xl border-2 border-dashed border-border bg-muted/40 flex items-center justify-center px-4">
                      <span className="text-sm text-muted-foreground text-center">لم تُختر صورة العرض</span>
                    </div>
                  </div>
                )}

                <div className="p-4 space-y-2">
                  <div className="flex items-start justify-between gap-2">
                    <p className="font-semibold text-foreground">{cake.name}</p>
                    <Price amount={cake.basePrice} className="text-sm text-muted-foreground shrink-0" />
                  </div>

                  {/* عدد صور الكيكة هو نفسه ما يملأه المدرّج التكراري عند مفتاح الكيكة. */}
                  <p className="text-sm text-muted-foreground">
                    <Counted count={coverage.filled} one="صورة" two="صورتان" plural="صور" />
                  </p>

                  {ready ? (
                    <Badge className="bg-success/10 text-success border-success/30 hover:bg-success/10">
                      جاهزة للعملاء
                    </Badge>
                  ) : coverage.complete ? (
                    <p className="text-destructive text-sm">اختر صورة العرض</p>
                  ) : (
                    <p className="text-destructive text-sm">
                      <span dir="ltr" className="tabular-nums">
                        {coverage.filled}/{coverage.total}
                      </span>
                      {' · '}
                      <span dir="ltr" className="tabular-nums">
                        {coverage.missing}
                      </span>{' '}
                      ناقصة
                    </p>
                  )}
                </div>
              </button>
            );
          })}

          <button
            type="button"
            onClick={() => openCake(null)}
            className="min-h-[15rem] rounded-2xl border-2 border-dashed border-border flex flex-col items-center justify-center gap-3 p-6 transition-colors hover:border-primary hover:bg-primary/5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
          >
            <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
              <Plus className="w-6 h-6 text-primary" />
            </div>
            <span className="text-sm font-medium">أضف كيكة جديدة</span>
          </button>
        </div>
      )}
    </div>
  );
}
