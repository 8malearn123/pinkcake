import { cn } from '@/lib/utils';
import { formatSAR } from '@/lib/currency';
import type { CatalogLevel } from '@/lib/cakeCatalog/types';
import type { AvailableValue } from '@/lib/cakeSelect';

interface LevelStepProps {
  level: CatalogLevel;
  /** Already filtered by the photo rule — only photo-backed values arrive here. */
  values: AvailableValue[];
  selectedId: string | null;
  onPick: (valueId: string) => void;
  /** Wired by the page to step back when this level has nothing to offer. */
  onBack?: () => void;
  prevLevelName?: string;
}

const deltaHint = (delta: number): string =>
  delta === 0 ? 'مشمول' : delta > 0 ? `+${formatSAR(delta)}` : formatSAR(delta);

export function LevelStep({ level, values, selectedId, onPick, onBack, prevLevelName }: LevelStepProps) {
  if (values.length === 0) {
    return (
      <div className="lvl-empty sect">
        <p>لا خيارات متاحة لهذه التركيبة بعد.</p>
        {onBack && prevLevelName && (
          <button onClick={onBack}>غيّر {prevLevelName}</button>
        )}
      </div>
    );
  }

  return (
    <div className="vchips sect" role="group" aria-label={level.name}>
      {values.map((value) => {
        const hint = deltaHint(value.priceDelta);
        return (
          <button
            key={value.id}
            className={cn('vchip', selectedId === value.id && 'sel')}
            onClick={() => onPick(value.id)}
          >
            <img className="th" src={value.thumbUrl} alt="" />
            <span className="nm">{value.name}</span>
            <span className="pd">{value.priceDelta === 0 ? hint : <bdi dir="ltr">{hint}</bdi>}</span>
          </button>
        );
      })}
    </div>
  );
}
