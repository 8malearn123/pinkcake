/**
 * التقويم الموسمي لبرنامج «دائرة المناسبات» — تقويمان لا واحد.
 *
 * المواسم الميلادية ثابتة ويمكن حسابها؛ المواسم الهجرية **لا يجوز تثبيتها في
 * الشيفرة**: رمضان والعيدان تتقدّم ١٠–١١ يوماً كل سنة ميلادية، وبدايتها مرتبطة
 * بالرؤية والإعلان الرسمي. لذلك تُدخَل سنوياً من لوحة المدير، وما هنا هو
 * الهيكل الذي يُعرض ويُحذّر حين تمضي سنة بلا تحديث.
 */

export type SeasonBasis = 'gregorian' | 'hijri';

export interface SeasonAnchor {
  id: string;
  name: string;
  basis: SeasonBasis;
  /** لليوم الثابت فقط. المواسم الهجرية تبقى null حتى تُضبط سنوياً. */
  month: number | null;
  day: number | null;
  /** ما نفعله في هذا الموسم — القاعدة التجارية لا الشعار. */
  play: string;
  note?: string;
}

/**
 * المواسم التي يبني عليها تقويم الحملات.
 *
 * ملاحظة على اليوم الوطني: وزارة التجارة أصدرت أكثر من ٤٧٠٠ رخصة تخفيضات في
 * أربعة أيام في أحد الأعوام — أي أن **الجميع يخفّض**. التمييز يكون بإصدار
 * محدود ونقاط مضاعفة، لا بالسعر.
 */
export const SEASON_ANCHORS: SeasonAnchor[] = [
  {
    id: 'founding_day',
    name: 'يوم التأسيس',
    basis: 'gregorian',
    month: 2,
    day: 22,
    play: 'تجميعة إهداء للشركات + إصدار محدود',
  },
  {
    id: 'mothers_day',
    name: 'يوم الأم',
    basis: 'gregorian',
    month: 3,
    day: 21,
    play: 'أعلى مناسبة نيّة شراء بعد أعياد الميلاد — تذكير مبكّر ١٤ يوماً',
    note: 'الكيك والحلويات والهدايا المخصّصة من أعلى فئات الإهداء في هذا اليوم.',
  },
  {
    id: 'graduation',
    name: 'موسم التخرّج',
    basis: 'gregorian',
    month: 6,
    day: 1,
    play: 'طلبات جماعية وعلب مشتركة — عائلية ومؤسسية',
  },
  {
    id: 'national_day',
    name: 'اليوم الوطني',
    basis: 'gregorian',
    month: 9,
    day: 23,
    play: 'إصدار محدود ونقاط مضاعفة — لا منافسة على السعر',
  },
  {
    id: 'ramadan',
    name: 'رمضان',
    basis: 'hijri',
    month: null,
    day: null,
    play: 'نوافذ طلب بعد الإفطار + شرائح ضيافة بالجملة',
    note: 'يتقدّم ~١٠–١١ يوماً سنوياً ويرتبط بالإعلان الرسمي — يُضبط كل سنة يدوياً.',
  },
  {
    id: 'eid_fitr',
    name: 'عيد الفطر',
    basis: 'hijri',
    month: null,
    day: null,
    play: 'ثلاث مراحل: اندفاع إهداء قبل العيد ← ركود ~٤٨ ساعة ← ارتداد الحلويات والكافيهات',
    note: 'نقاط البيع تنخفض بحدّة في أسبوع العيد ثم تعود الحلويات وحدها للنمو بعده.',
  },
  {
    id: 'eid_adha',
    name: 'عيد الأضحى',
    basis: 'hijri',
    month: null,
    day: null,
    play: 'صواني ضيافة للمجالس والعزائم العائلية',
  },
];

/** المواسم التي تحتاج ضبطاً يدوياً هذه السنة. */
export function unconfiguredSeasons(anchors: SeasonAnchor[] = SEASON_ANCHORS): SeasonAnchor[] {
  return anchors.filter((a) => a.basis === 'hijri' && (a.month === null || a.day === null));
}
