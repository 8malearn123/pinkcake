import { useCatalogSession } from '@/hooks/useCatalogSession';
import {
  ADDONS,
  isLegacyDesign,
  legacyLabel,
  type AnyCakeDesign,
  type CartCakeDesign,
  type LegacyCakeDesign,
} from '@/lib/cakeStudio';
import { cn } from '@/lib/utils';

// The retired CSS-art stage's warm backdrop, kept as the photo frame's fill.
const STAGE_BG =
  'radial-gradient(70% 56% at 50% 30%, hsl(28 44% 97.5%), transparent 72%), linear-gradient(180deg, hsl(28 30% 97%), hsl(20 18% 93.5%))';

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-start justify-between gap-3 py-1.5 border-b border-border/40 last:border-0">
      <span className="text-muted-foreground shrink-0">{label}</span>
      <span className="font-medium text-end">{value}</span>
    </div>
  );
}

function addonName(id: string): string {
  return ADDONS.find((a) => a.id === id)?.name ?? id;
}

/** Paid orders from the retired builder carry option ids only — label them via the frozen map. */
function LegacyBrief({ design }: { design: LegacyCakeDesign }) {
  const addons: string[] = [];
  if (design.addons?.candle) addons.push(legacyLabel('addon', 'candle'));
  if (design.addons?.topper) addons.push(legacyLabel('addon', 'topper'));
  return (
    <div className="rounded-xl bg-muted/50 p-4 text-sm">
      <div>
        <Row label="الشكل" value={legacyLabel('shape', design.shape)} />
        <Row label="النكهة" value={legacyLabel('flavor', design.flavor)} />
        <Row label="اللون" value={legacyLabel('color', design.color)} />
        <Row label="التزيين" value={legacyLabel('design', design.design)} />
        {design.text && <Row label="الرسالة" value={`«${design.text}»`} />}
        {addons.length > 0 && <Row label="إضافات" value={addons.join('، ')} />}
      </div>
      <div className="mt-3">
        <span className="inline-flex items-center rounded-full bg-muted px-2.5 py-1 text-xs text-muted-foreground">
          تصميم من النظام السابق — بدون صورة
        </span>
      </div>
    </div>
  );
}

function StudioBrief({ design }: { design: CartCakeDesign }) {
  const { urlFor } = useCatalogSession();
  const pathLabels = Array.isArray(design.pathLabels) ? design.pathLabels : [];
  const levelLabels = Array.isArray(design.levelLabels) ? design.levelLabels : [];
  const addonIds = Array.isArray(design.addons) ? design.addons : [];
  const url = urlFor(design.photoImageId);
  const crumb = [design.cakeName, ...pathLabels].filter(Boolean).join(' · ');

  const metaRows = (
    <>
      {design.text && <Row label="الرسالة" value={`«${design.text}»`} />}
      {addonIds.length > 0 && <Row label="إضافات" value={addonIds.map(addonName).join('، ')} />}
    </>
  );

  if (url) {
    return (
      <div className="space-y-3">
        <div
          className="aspect-[4/3] overflow-hidden rounded-2xl border border-border/50"
          style={{ background: STAGE_BG }}
        >
          <img src={url} alt={crumb} className="h-full w-full object-cover" />
        </div>
        {crumb && <p className="text-sm font-medium">{crumb}</p>}
        {(design.text || addonIds.length > 0) && (
          <div className="rounded-xl bg-muted/50 p-4 text-sm">{metaRows}</div>
        )}
      </div>
    );
  }

  // The catalog (and its photos) is browser-local: on any other device the
  // kitchen still gets the full text brief plus the durable asset key.
  return (
    <div className="rounded-xl bg-muted/50 p-4 text-sm">
      <div>
        {crumb && <Row label="الكيكة" value={crumb} />}
        {levelLabels.map((level, i) => (
          <Row key={`${level}-${i}`} label={level} value={pathLabels[i] ?? '—'} />
        ))}
        {metaRows}
      </div>
      <div className="mt-3 space-y-1">
        <p className="text-xs text-muted-foreground">الصورة غير متوفرة على هذا الجهاز</p>
        {design.photoKey && (
          <p dir="ltr" className="break-all font-mono text-xs text-muted-foreground/70">
            {design.photoKey}
          </p>
        )}
      </div>
    </div>
  );
}

/**
 * The kitchen's visual reference for a customer-designed cake: the catalog
 * photo when it resolves on this device, otherwise a full Arabic text brief.
 * Replaces the retired CSS-art CakePreview everywhere staff read designs.
 */
export function CakeDesignPreview({
  design,
  className,
}: {
  design: AnyCakeDesign | null | undefined;
  className?: string;
}) {
  if (design == null) return null;
  return (
    <div className={cn(className)}>
      {isLegacyDesign(design) ? <LegacyBrief design={design} /> : <StudioBrief design={design} />}
    </div>
  );
}
