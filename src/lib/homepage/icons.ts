/**
 * `IconKey` → أيقونة lucide.
 *
 * خريطة صريحة لا `import * as icons`: أسماء الأيقونات تأتي من محتوى مُحرَّر في
 * قاعدة البيانات، وقراءة الاسم من كائن lucide الكامل تعني إمّا سحب المكتبة كلها
 * إلى الحزمة النهائية أو `undefined` يُسقط الصفحة عند اسم قديم.
 */
import {
  Cake,
  Camera,
  CheckCircle2,
  ChefHat,
  Clock,
  Gift,
  Heart,
  MapPin,
  PartyPopper,
  Phone,
  ShoppingBag,
  Sparkles,
  Star,
  Sun,
  Truck,
  Wand2,
  type LucideIcon,
} from 'lucide-react';
import type { IconKey } from './types';

const ICONS: Record<IconKey, LucideIcon> = {
  truck: Truck,
  star: Star,
  clock: Clock,
  camera: Camera,
  sparkles: Sparkles,
  gift: Gift,
  cake: Cake,
  partyPopper: PartyPopper,
  sun: Sun,
  mapPin: MapPin,
  phone: Phone,
  shoppingBag: ShoppingBag,
  wand: Wand2,
  chefHat: ChefHat,
  heart: Heart,
  checkCircle: CheckCircle2,
};

/** يعود إلى نجمة بدل الانهيار حين يحمل صفّ قديم مفتاحاً لم يعد موجوداً. */
export function iconFor(key: string | undefined): LucideIcon {
  return ICONS[key as IconKey] ?? Star;
}
