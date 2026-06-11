export type LozaCake = {
  id: string;
  name: string;
  vendor: string;
  vendorId: string;
  price: number;
  rating: number;
  reviews: number;
  emoji: string;
  category: string;
  tag?: string;
  description: string;
  ingredients: string[];
  servings: string;
  prepTime: string;
  flavors: string[];
  sizes: { id: string; name: string; price: number }[];
};

export type LozaVendor = {
  id: string;
  name: string;
  emoji: string;
  rating: number;
  distance: string;
  city: string;
  cover: string; // gradient
  cakeIds: string[];
  desc: string;
};

export const LOZA_CAKES: LozaCake[] = [
  {
    id: 'c1',
    name: 'كيكة الزعفران الملكية',
    vendor: 'حلويات الأمل',
    vendorId: 'v1',
    price: 220,
    rating: 4.9,
    reviews: 132,
    emoji: '🎂',
    category: 'أعياد ميلاد',
    tag: 'الأكثر طلباً',
    description: 'كيكة فاخرة بنكهة الزعفران الأصيل ومزينة بطبقة من الكريمة الذهبية والمكسرات.',
    ingredients: ['زعفران أصلي', 'كريمة طازجة', 'دقيق فاخر', 'فستق حلبي', 'ماء ورد'],
    servings: '8-10 أشخاص',
    prepTime: '24 ساعة',
    flavors: ['زعفران', 'فانيلا', 'فستق'],
    sizes: [
      { id: 's', name: 'صغير (6")', price: 220 },
      { id: 'm', name: 'وسط (8")', price: 320 },
      { id: 'l', name: 'كبير (10")', price: 440 },
    ],
  },
  {
    id: 'c2',
    name: 'تشيز كيك التوت',
    vendor: 'لمسة حلوة',
    vendorId: 'v2',
    price: 145,
    rating: 4.8,
    reviews: 89,
    emoji: '🍰',
    category: 'تشيز كيك',
    description: 'تشيز كيك بارد بطبقة سميكة من جبن الكريمة وصوص التوت الطازج.',
    ingredients: ['جبن كريمي', 'توت طازج', 'بسكويت', 'زبدة', 'ليمون'],
    servings: '6-8 أشخاص',
    prepTime: '12 ساعة',
    flavors: ['توت', 'فانيلا', 'ليمون'],
    sizes: [
      { id: 's', name: 'صغير', price: 145 },
      { id: 'm', name: 'وسط', price: 195 },
    ],
  },
  {
    id: 'c3',
    name: 'كيكة الشوكولاتة الفاخرة',
    vendor: 'بيت الكيك',
    vendorId: 'v3',
    price: 180,
    rating: 4.9,
    reviews: 210,
    emoji: '🍫',
    category: 'شوكولاتة',
    tag: 'مميزة',
    description: 'ثلاث طبقات من كيكة الشوكولاتة البلجيكية مع جناش كثيف وقطع شوكولاتة فاخرة.',
    ingredients: ['شوكولاتة بلجيكية', 'كاكاو', 'كريمة', 'بيض طازج', 'سكر بني'],
    servings: '8-12 شخص',
    prepTime: '18 ساعة',
    flavors: ['شوكولاتة', 'جناش', 'كاكاو'],
    sizes: [
      { id: 's', name: 'صغير', price: 180 },
      { id: 'm', name: 'وسط', price: 260 },
      { id: 'l', name: 'كبير', price: 360 },
    ],
  },
  {
    id: 'c4',
    name: 'كاب كيك ورود',
    vendor: 'حلويات الأمل',
    vendorId: 'v1',
    price: 95,
    rating: 4.7,
    reviews: 67,
    emoji: '🧁',
    category: 'كاب كيك',
    description: 'مجموعة من 12 كاب كيك مزينة بزهور الكريمة الملونة، مثالية للمناسبات الصغيرة.',
    ingredients: ['دقيق', 'زبدة', 'كريمة طبخ', 'ألوان طعام طبيعية'],
    servings: '12 قطعة',
    prepTime: '8 ساعات',
    flavors: ['فانيلا', 'شوكولاتة', 'فراولة'],
    sizes: [
      { id: '12', name: '12 قطعة', price: 95 },
      { id: '24', name: '24 قطعة', price: 175 },
    ],
  },
  {
    id: 'c5',
    name: 'كيكة الفستق الحلبي',
    vendor: 'بيت الكيك',
    vendorId: 'v3',
    price: 240,
    rating: 4.9,
    reviews: 88,
    emoji: '🥜',
    category: 'فستق',
    description: 'كيكة فاخرة محشوة بكريمة الفستق الحلبي ومزينة بشرائح الفستق المحمص.',
    ingredients: ['فستق حلبي', 'كريمة', 'دقيق', 'بيض', 'سكر'],
    servings: '8-10 أشخاص',
    prepTime: '20 ساعة',
    flavors: ['فستق', 'فانيلا'],
    sizes: [
      { id: 's', name: 'صغير', price: 240 },
      { id: 'm', name: 'وسط', price: 340 },
    ],
  },
  {
    id: 'c6',
    name: 'دونات لمسة',
    vendor: 'لمسة حلوة',
    vendorId: 'v2',
    price: 75,
    rating: 4.6,
    reviews: 54,
    emoji: '🍩',
    category: 'دونات',
    description: 'صندوق دونات طازجة بنكهات متنوعة وتزيين شهي.',
    ingredients: ['دقيق', 'حليب', 'سكر', 'شوكولاتة', 'سبرنكلز'],
    servings: '6 قطع',
    prepTime: '3 ساعات',
    flavors: ['شوكولاتة', 'فراولة', 'لوتس'],
    sizes: [
      { id: '6', name: '6 قطع', price: 75 },
      { id: '12', name: '12 قطعة', price: 140 },
    ],
  },
];

export const LOZA_VENDORS: LozaVendor[] = [
  {
    id: 'v1',
    name: 'حلويات الأمل',
    emoji: '🏪',
    rating: 4.9,
    distance: '2.4 كم',
    city: 'جازان',
    cover: 'from-[hsl(var(--loza-gold))] to-[hsl(var(--loza-gold-dark))]',
    cakeIds: ['c1', 'c4'],
    desc: 'متجر متخصص في الكيك الفاخر والحلويات الشرقية منذ ١٩٩٨',
  },
  {
    id: 'v2',
    name: 'لمسة حلوة',
    emoji: '🍩',
    rating: 4.8,
    distance: '3.1 كم',
    city: 'جازان',
    cover: 'from-[hsl(var(--loza-brown))] to-[hsl(var(--loza-brown-soft))]',
    cakeIds: ['c2', 'c6'],
    desc: 'حلويات معاصرة بلمسة جنوبية أصيلة',
  },
  {
    id: 'v3',
    name: 'بيت الكيك',
    emoji: '🎂',
    rating: 4.7,
    distance: '5.6 كم',
    city: 'جازان',
    cover: 'from-[hsl(var(--loza-gold-dark))] to-[hsl(var(--loza-brown))]',
    cakeIds: ['c3', 'c5'],
    desc: 'تخصصنا الكيك الفاخر للمناسبات والأعراس',
  },
];

export const LOZA_CATEGORIES = [
  { id: 'all', name: 'الكل', emoji: '✨' },
  { id: 'birthday', name: 'أعياد ميلاد', emoji: '🎂' },
  { id: 'wedding', name: 'زواج', emoji: '💍' },
  { id: 'engagement', name: 'خطوبة', emoji: '💐' },
  { id: 'graduation', name: 'تخرج', emoji: '🎓' },
  { id: 'cupcakes', name: 'كاب كيك', emoji: '🧁' },
  { id: 'cheesecake', name: 'تشيز كيك', emoji: '🍰' },
  { id: 'custom', name: 'كاستم', emoji: '🎨' },
];

export function findCake(id: string) {
  return LOZA_CAKES.find((c) => c.id === id);
}
export function findVendor(id: string) {
  return LOZA_VENDORS.find((v) => v.id === id);
}
