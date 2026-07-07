/** Static option lists for the event builder wizard (kept out of the step
 *  components so fast-refresh stays happy and the page can reuse them). */
import {
  Gem, Building2, GraduationCap, Baby, PartyPopper, Home, Sparkles,
  Cake, LayoutGrid, Candy, CakeSlice, Cookie, UtensilsCrossed, type LucideIcon,
} from 'lucide-react';
import type { Occasion } from '@/lib/eventPlanner';
import type { ServeStyle } from '@/lib/eventCatalog';

export const OCCASIONS: { id: Occasion; label: string; icon: LucideIcon }[] = [
  { id: 'wedding', label: 'زواج / عرس', icon: Gem },
  { id: 'corporate', label: 'فعالية شركة', icon: Building2 },
  { id: 'graduation', label: 'تخرّج', icon: GraduationCap },
  { id: 'newborn', label: 'استقبال مولود', icon: Baby },
  { id: 'birthday', label: 'عيد ميلاد', icon: PartyPopper },
  { id: 'family', label: 'عزيمة عائلية', icon: Home },
  { id: 'other', label: 'أخرى', icon: Sparkles },
];

export const GUEST_BANDS = [
  { label: '10–25', value: 20 },
  { label: '26–50', value: 40 },
  { label: '51–100', value: 80 },
  { label: '101–200', value: 150 },
  { label: '+200', value: 250 },
];

export const SERVE_STYLES: { id: ServeStyle; label: string; icon: LucideIcon; hint: string }[] = [
  { id: 'centerpiece_cake', label: 'كيكة المناسبة', icon: Cake, hint: 'قطعة مركزية مميّزة' },
  { id: 'assorted_mini', label: 'حلا ميني متنوّع', icon: LayoutGrid, hint: 'طاولة حلا متنوّعة' },
  { id: 'chocolate', label: 'شوكولاتة ضيافة', icon: Candy, hint: 'لكل ضيف' },
  { id: 'cupcake', label: 'كب كيك', icon: CakeSlice, hint: 'بنكهات متعددة' },
  { id: 'maamoul', label: 'معمول وبيتفور', icon: Cookie, hint: 'لمسة تقليدية' },
  { id: 'trays', label: 'صواني حلا', icon: UtensilsCrossed, hint: 'مناسبة للأعداد الكبيرة' },
];
