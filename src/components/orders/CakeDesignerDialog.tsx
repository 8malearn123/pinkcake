import { useMemo, useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { CakeGallery } from '@/components/cake/CakeGallery';
import { CakeStage } from '@/components/cake/CakeStage';
import { LevelStep } from '@/components/cake/LevelStep';
import { useCatalogSession } from '@/hooks/useCatalogSession';
import { toast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import '@/components/cake/cakeStudio.css';
import {
  applyPick, availableValues, contiguousPath, deepestMatch, galleryCakes, pathLabels,
  seedPicks, stageCaption,
} from '@/lib/cakeSelect';
import { imageStorageKey } from '@/lib/cakeCatalog/catalog';
import type { CartCakeDesign } from '@/lib/cakeStudio';
import { ArrowRight, ArrowLeft, Check, Wand2 } from 'lucide-react';

interface CakeDesignerDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Handed the finished design; the caller stores it on the order. */
  onConfirm: (design: CartCakeDesign) => void;
}

/**
 * The photo studio from /customize, in a dialog for staff.
 *
 * Same catalogue, same photo rule (only photographed combinations are offered)
 * and the same `CartCakeDesign` payload the storefront produces — so a cake a
 * branch builds over the counter reaches the kitchen looking exactly like one
 * the customer built themselves. Pricing and the customer-facing extras
 * (message, add-ons, edible photo) stay out: the chef prices custom orders.
 */
export function CakeDesignerDialog({ open, onOpenChange, onConfirm }: CakeDesignerDialogProps) {
  const { status, catalog, urlFor, byKey } = useCatalogSession();
  const levels = catalog.levels;

  const [cakeId, setCakeId] = useState<string | null>(null);
  const [rawPicks, setRawPicks] = useState<(string | null)[]>([]);
  const [step, setStep] = useState(0);

  const cake = cakeId ? catalog.cakes.find((c) => c.id === cakeId) ?? null : null;
  const inDesign = !!cake;

  // A stale-length picks array must never index into the wrong level (the admin
  // can edit the catalogue while this dialog is open).
  const picks = rawPicks.length === levels.length ? rawPicks : seedPicks(levels);
  const path = contiguousPath(picks);
  const labels = pathLabels(levels, path);
  const level = step < levels.length ? levels[step] : null;
  const last = !level;

  const stepPrefix = useMemo(() => {
    const prefix = picks.slice(0, step);
    return prefix.every(Boolean) ? (prefix as string[]) : null;
  }, [picks, step]);

  const values = useMemo(
    () => (inDesign && level && stepPrefix ? availableValues(catalog, byKey, urlFor, cake.id, stepPrefix) : []),
    [inDesign, level, stepPrefix, catalog, byKey, urlFor, cake],
  );

  const gallery = useMemo(() => galleryCakes(catalog, urlFor), [catalog, urlFor]);

  const match = useMemo(
    () => (inDesign ? deepestMatch(catalog, byKey, urlFor, cake, path) : { url: null, imageId: null, depth: -1 }),
    [inDesign, catalog, byKey, urlFor, cake, path],
  );

  const reset = () => {
    setCakeId(null);
    setRawPicks([]);
    setStep(0);
  };

  const openCake = (id: string) => {
    setCakeId(id);
    setRawPicks(seedPicks(levels));
    setStep(0);
  };

  const back = () => {
    if (step > 0) setStep((s) => s - 1);
    else reset();
  };

  const next = () => {
    // An empty level has nothing to pick, so it can't block the flow.
    if (!last && values.length > 0 && picks[step] == null) {
      toast({ title: 'الرجاء الإكمال', description: 'اختر خياراً للمتابعة', variant: 'destructive' });
      return;
    }
    if (!last) {
      setStep((s) => s + 1);
      return;
    }
    if (!cake || path.length === 0) {
      toast({ title: 'الرجاء الإكمال', description: 'اختر خياراً واحداً على الأقل', variant: 'destructive' });
      return;
    }
    // Ids AND Arabic labels: catalogue photos are per-browser, so the labels are
    // what actually survive to the kitchen.
    onConfirm({
      v: 2,
      cakeId: cake.id,
      cakeName: cake.name,
      path,
      pathLabels: labels,
      levelLabels: levels.slice(0, path.length).map((l) => l.name),
      photoKey: imageStorageKey(cake.id, path),
      photoImageId: match.imageId ?? undefined,
    });
    reset();
    onOpenChange(false);
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        if (!next) reset();
        onOpenChange(next);
      }}
    >
      <DialogContent className="max-h-[92vh] max-w-3xl overflow-y-auto p-0">
        <DialogHeader className="px-6 pt-6 text-start">
          <DialogTitle className="flex items-center gap-2">
            <Wand2 className="h-5 w-5 text-primary" />
            تصميم الكيك
          </DialogTitle>
          <DialogDescription>
            {inDesign
              ? `${cake.name} — الخطوة ${step + 1} من ${levels.length + 1}`
              : 'اختر قاعدة الكيك ثم خصّصها خطوة بخطوة. كل ما يظهر مصوّر ومتوفر فعلاً.'}
          </DialogDescription>
        </DialogHeader>

        <div className="cake-studio in-dialog px-6 pb-6" dir="rtl">
          {inDesign && (
            <div className="stage">
              <div className="spot" />
              <CakeStage
                url={match.url}
                alt={[cake.name, ...labels].join(' · ')}
                caption={stageCaption(cake, labels, match)}
                serves={cake.serves}
                leadTime={cake.leadTime}
                empty={match.url == null}
              />
            </div>
          )}

          <div className="panel">
            {!inDesign ? (
              status === 'loading' ? (
                <div className="py-10 text-center text-sm text-muted-foreground">جارٍ تحضير الاستوديو…</div>
              ) : (
                <CakeGallery items={gallery} onPick={openCake} onBrowse={() => onOpenChange(false)} />
              )
            ) : (
              <div key={step}>
                {level ? (
                  <LevelStep
                    level={level}
                    values={values}
                    selectedId={picks[step]}
                    onPick={(valueId) => setRawPicks(applyPick(picks, step, valueId))}
                    onBack={back}
                    prevLevelName={step > 0 ? levels[step - 1].name : undefined}
                  />
                ) : (
                  <div className="rounded-xl border border-border bg-muted/30 p-4">
                    <p className="font-semibold text-foreground">التصميم جاهز</p>
                    <p className="mt-1 text-sm text-muted-foreground">
                      {[cake.name, ...labels].join(' · ')}
                    </p>
                  </div>
                )}
              </div>
            )}
          </div>

          {inDesign && (
            <div className={cn('mt-4 flex items-center justify-between gap-3')}>
              <Button type="button" variant="outline" onClick={back}>
                <ArrowRight className="me-2 h-4 w-4" />
                {step === 0 ? 'الكيكات' : 'السابق'}
              </Button>
              <Button type="button" onClick={next} className="min-w-[140px]">
                {last ? (
                  <>
                    <Check className="me-2 h-4 w-4" />
                    اعتماد التصميم
                  </>
                ) : (
                  <>
                    التالي
                    <ArrowLeft className="ms-2 h-4 w-4" />
                  </>
                )}
              </Button>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
