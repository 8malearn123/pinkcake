/** Static option lists for the event builder wizard (kept out of the step
 *  components so fast-refresh stays happy and the page can reuse them). */
import type { Occasion } from '@/lib/eventPlanner';
import type { ServeStyle } from '@/lib/eventCatalog';

export const OCCASIONS: { id: Occasion; label: string; emoji: string }[] = [
  { id: 'wedding', label: 'زواج / عرس', emoji: '💍' },
  { id: 'corporate', label: 'فعالية شركة', emoji: '🏢' },
  { id: 'graduation', label: 'تخرّج', emoji: '🎓' },
  { id: 'newborn', label: 'استقبال مولود', emoji: '🍼' },
  { id: 'birthday', label: 'عيد ميلاد', emoji: '🎉' },
  { id: 'family', label: 'عزيمة عائلية', emoji: '🏡' },
  { id: 'other', label: 'أخرى', emoji: '✨' },
];

export const GUEST_BANDS = [
  { label: '١٠–٢٥', value: 20 },
  { label: '٢٦–٥٠', value: 40 },
  { label: '٥١–١٠٠', value: 80 },
  { label: '١٠١–٢٠٠', value: 150 },
  { label: '+٢٠٠', value: 250 },
];

export const SERVE_STYLES: { id: ServeStyle; label: string; emoji: string; hint: string }[] = [
  { id: 'centerpiece_cake', label: 'كيكة المناسبة', emoji: '🎂', hint: 'قطعة مركزية مميّزة' },
  { id: 'assorted_mini', label: 'حلا ميني متنوّع', emoji: '🍰', hint: 'طاولة حلا متنوّعة' },
  { id: 'chocolate', label: 'شوكولاتة ضيافة', emoji: '🍫', hint: 'لكل ضيف' },
  { id: 'cupcake', label: 'كب كيك', emoji: '🧁', hint: 'بنكهات متعددة' },
  { id: 'maamoul', label: 'معمول وبيتفور', emoji: '🍪', hint: 'لمسة تقليدية' },
  { id: 'trays', label: 'صواني حلا', emoji: '🍮', hint: 'مناسبة للأعداد الكبيرة' },
];
