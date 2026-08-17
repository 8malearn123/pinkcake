/**
 * تقويم الحملات — ضبط المواسم الهجرية.
 *
 * `src/lib/loyalty/calendar.ts` يقول إن المواسم الهجرية «تُدخَل سنوياً من لوحة
 * المدير»، ولم تكن هناك أداة إدخال. هذا الملف هو الطبقة النقيّة لتلك الأداة:
 * الضبط يخصّ **سنة ميلادية بعينها** ويسقط بانقضائها، لأن رمضان يتقدّم ١٠–١١
 * يوماً كل سنة — فضبط العام الماضي معروضاً هذا العام أسوأ من لا ضبط.
 */

import { SEASON_ANCHORS, type SeasonAnchor } from '@/lib/loyalty/calendar';
import type { SeasonOverride } from './types';

/** يطبّق ضبط السنة المعطاة على المراسي، ويترك الميلادية كما هي. */
export function applySeasonOverrides(
  overrides: SeasonOverride[],
  year: number = new Date().getFullYear(),
  anchors: SeasonAnchor[] = SEASON_ANCHORS,
): SeasonAnchor[] {
  return anchors.map((anchor) => {
    if (anchor.basis !== 'hijri') return anchor;
    const match = overrides.find((o) => o.id === anchor.id && o.year === year);
    if (!match) return anchor;
    return { ...anchor, month: match.month, day: match.day };
  });
}

/** المواسم التي ما زالت بلا ضبط لهذه السنة. */
export function pendingSeasons(
  overrides: SeasonOverride[],
  year: number = new Date().getFullYear(),
  anchors: SeasonAnchor[] = SEASON_ANCHORS,
): SeasonAnchor[] {
  return applySeasonOverrides(overrides, year, anchors).filter(
    (a) => a.basis === 'hijri' && (a.month === null || a.day === null),
  );
}

/** كم يوماً حتى الدورة القادمة لموسم مضبوط — null لموسم بلا تاريخ. */
export function daysUntilSeason(anchor: SeasonAnchor, from: Date = new Date()): number | null {
  if (anchor.month == null || anchor.day == null) return null;
  const midnight = new Date(from.getFullYear(), from.getMonth(), from.getDate());
  const lastDay = new Date(from.getFullYear(), anchor.month, 0).getDate();
  let next = new Date(from.getFullYear(), anchor.month - 1, Math.min(anchor.day, lastDay));
  if (next < midnight) {
    const nextLast = new Date(from.getFullYear() + 1, anchor.month, 0).getDate();
    next = new Date(from.getFullYear() + 1, anchor.month - 1, Math.min(anchor.day, nextLast));
  }
  return Math.round((next.getTime() - midnight.getTime()) / 86_400_000);
}
