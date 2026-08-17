import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { isMissingFunction } from '@/hooks/useMarketing';
import { DELIVERY_FEE, FREE_DELIVERY_THRESHOLD } from '@/lib/delivery';
import type { Announcement, PromoSlot, StoreOffers, StorefrontPromos } from '@/lib/marketing/types';

/**
 * ما يقرأه المتجر من قسم «التسويق».
 *
 * **الاحتياطي ليس تفصيلاً — هو العقد.** القسم بلا هجرات في هذه المرحلة، فعلى
 * خادم حقيقي لا توجد الدالة أصلاً. لو سقط المتجر حينها إلى لا شيء لاختفى
 * الشريط المتحرّك وصندوق الهدية وعنوان الموسم دفعةً واحدة. لذلك الافتراضي هنا
 * هو **النصّ المثبّت اليوم حرفياً**: بلا خادم يبقى المتجر كما هو تماماً، ومع
 * خادم يصير محرَّراً.
 */

const fallbackAnnouncement = (
  slot: PromoSlot,
  partial: Partial<Announcement> & Pick<Announcement, 'title'>,
): Announcement => ({
  id: `fallback-${slot}-${partial.title.slice(0, 8)}`,
  slot,
  eyebrow: '',
  subtitle: '',
  couponCode: null,
  ctaLabel: '',
  ctaHref: '',
  imageUrl: null,
  startsAt: null,
  endsAt: null,
  isActive: true,
  displayOrder: 0,
  ...partial,
});

/** نسخة طبق الأصل عمّا كان مثبّتاً في `StorefrontDecor` و`GiftBox` و`SeasonalSection`. */
export const FALLBACK_ANNOUNCEMENTS: Announcement[] = [
  fallbackAnnouncement('ticker', { title: 'توصيل مجاني داخل جازان للطلبات فوق ٢٠٠ {riyal}', displayOrder: 0 }),
  fallbackAnnouncement('ticker', { title: '🥭 موسم المنجا الجازانية متوفر الآن', displayOrder: 1 }),
  fallbackAnnouncement('ticker', { title: 'اطلب قبل ٣ مساءً لتوصيل الغد', displayOrder: 2 }),
  fallbackAnnouncement('ticker', { title: 'خصم ١٥٪ على أول طلب مع كود CAKE15', displayOrder: 3 }),
  fallbackAnnouncement('ticker', { title: 'تورتات طازجة تُخبز يومياً في جازان', displayOrder: 4 }),
  fallbackAnnouncement('offer_banner', {
    eyebrow: 'هديّة ترحيبية',
    title: 'خصم ١٥٪ على أوّل طلب',
    subtitle: 'استخدم الكود التالي عند إتمام الطلب',
    couponCode: 'CAKE15',
    ctaLabel: 'تسوّقي الآن',
    ctaHref: '#shop',
  }),
  fallbackAnnouncement('gift_box', {
    eyebrow: '🎁 هدية ترحيبية · لزوّار {store} لأول مرة',
    title: 'لديك هديّة بانتظارك!',
    subtitle: 'خصم ١٥٪ على أوّل طلب',
    couponCode: 'CAKE15',
    ctaLabel: '👆 اضغط لفتح الهدية',
  }),
  fallbackAnnouncement('seasonal_band', {
    eyebrow: 'تشكيلة الصيف · لفترة محدودة',
    title: 'موسم المنجا الجازانية 🥭',
    subtitle:
      'من مزارع جازان مباشرةً — منجا طبيعية طازجة في تورتات وتشيز كيك بنكهة الصيف. متوفرة ما دام الموسم مستمر.',
    ctaLabel: 'نفاد سريع — احجز الآن',
  }),
];

export const FALLBACK_OFFERS: StoreOffers = {
  freeDeliveryThreshold: FREE_DELIVERY_THRESHOLD,
  deliveryFee: DELIVERY_FEE,
  firstOrderCouponCode: 'CAKE15',
  showFreeDeliveryMeter: true,
  showGiftBox: true,
  // البانر كان مكتوباً وغير معروض قبل هذا القسم؛ الاحتياطي يبقيه مخفياً كي لا
  // يظهر بانر جديد على متجر لا يملك أحد إيقافه من لوحة.
  showOfferBanner: false,
};

const FALLBACK: StorefrontPromos = {
  announcements: FALLBACK_ANNOUNCEMENTS,
  offers: FALLBACK_OFFERS,
};

export interface UseStorefrontPromosResult extends StorefrontPromos {
  /** كل عناصر الشريط المتحرّك المفعّلة، بالترتيب. */
  ticker: Announcement[];
  /** أوّل عنصر مفعّل في الخانة — الخانات المفردة لا تعرض أكثر من واحد. */
  slot: (slot: PromoSlot) => Announcement | null;
}

export function useStorefrontPromos(): UseStorefrontPromosResult {
  const { data } = useQuery({
    queryKey: ['storefront-promos'],
    queryFn: async (): Promise<StorefrontPromos> => {
      const client = supabase as unknown as {
        rpc: (fn: string, args?: Record<string, unknown>) => Promise<{ data: unknown; error: unknown }>;
      };
      const { data: rows, error } = await client.rpc('get_storefront_promos');
      if (error) {
        if (isMissingFunction(error)) return FALLBACK;
        throw error as Error;
      }
      const row = (Array.isArray(rows) ? rows[0] : rows) as StorefrontPromos | null;
      if (!row) return FALLBACK;
      return {
        announcements: row.announcements?.length ? row.announcements : FALLBACK.announcements,
        offers: { ...FALLBACK.offers, ...(row.offers ?? {}) },
      };
    },
    // خمس دقائق: محتوى تحريري يتغيّر بالساعات لا بالثواني، والمتجر يُفتح كثيراً.
    staleTime: 5 * 60_000,
    // فشل الشبكة يجب أن يعطي النصّ الافتراضي لا شاشة فارغة.
    placeholderData: FALLBACK,
    retry: 0,
  });

  const promos = data ?? FALLBACK;

  return useMemo(
    () => ({
      ...promos,
      ticker: promos.announcements
        .filter((a) => a.slot === 'ticker' && a.isActive)
        .sort((a, b) => a.displayOrder - b.displayOrder),
      slot: (wanted: PromoSlot) =>
        promos.announcements.find((a) => a.slot === wanted && a.isActive) ?? null,
    }),
    [promos],
  );
}
