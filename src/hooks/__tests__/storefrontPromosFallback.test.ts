import { describe, it, expect, beforeEach } from 'vitest';
import { FALLBACK_ANNOUNCEMENTS, FALLBACK_OFFERS } from '@/hooks/useStorefrontPromos';
import { __resetDemoMarketing } from '@/lib/demo/marketing';
import { resolveRpc } from '@/lib/demo/rpc';
import type { StorefrontPromos } from '@/lib/marketing/types';

/**
 * حارس الانحراف بين البذرة والاحتياطي.
 *
 * المتجر يقرأ إعلاناته من «التسويق»، وعلى خادم لا يملك هذه الدوال يسقط إلى
 * `FALLBACK_*`. فإن عُدِّلت البذرة التجريبية ونُسي الاحتياطي، اختلف ما يراه
 * الزائر بين الوضع التجريبي (كل معاينات المشروع) والإنتاج — وهو فرق لا يظهر
 * في أي شاشة ولا يشتكي منه أحد حتى يُنشر.
 */

beforeEach(() => {
  __resetDemoMarketing();
});

const seeded = () => (resolveRpc('get_storefront_promos', {}) as StorefrontPromos[])[0];

describe('storefront fallback matches the demo seed', () => {
  it('ships the same ticker copy in both modes', () => {
    const seedTicker = seeded()
      .announcements.filter((a) => a.slot === 'ticker')
      .sort((a, b) => a.displayOrder - b.displayOrder)
      .map((a) => a.title);
    const fallbackTicker = FALLBACK_ANNOUNCEMENTS.filter((a) => a.slot === 'ticker')
      .sort((a, b) => a.displayOrder - b.displayOrder)
      .map((a) => a.title);

    expect(fallbackTicker).toEqual(seedTicker);
  });

  it('ships the same single-slot copy in both modes', () => {
    for (const slot of ['offer_banner', 'gift_box', 'seasonal_band'] as const) {
      const seed = seeded().announcements.find((a) => a.slot === slot);
      const fallback = FALLBACK_ANNOUNCEMENTS.find((a) => a.slot === slot);
      expect(fallback, `no fallback for ${slot}`).toBeTruthy();
      expect(
        {
          eyebrow: fallback.eyebrow,
          title: fallback.title,
          subtitle: fallback.subtitle,
          ctaLabel: fallback.ctaLabel,
        },
        `${slot} drifted between the seed and the fallback`,
      ).toEqual({
        eyebrow: seed.eyebrow,
        title: seed.title,
        subtitle: seed.subtitle,
        ctaLabel: seed.ctaLabel,
      });
    }
  });

  it('ships the same delivery economics in both modes', () => {
    const seed = seeded().offers;
    expect(FALLBACK_OFFERS.freeDeliveryThreshold).toBe(seed.freeDeliveryThreshold);
    expect(FALLBACK_OFFERS.deliveryFee).toBe(seed.deliveryFee);
    expect(FALLBACK_OFFERS.firstOrderCouponCode).toBe(seed.firstOrderCouponCode);
  });

  it('keeps the offer banner hidden by default in the fallback', () => {
    // البانر كان مكتوباً وغير معروض قبل هذا القسم. بلا لوحة تُوقفه، الافتراضي
    // الآمن أن يبقى مخفياً على خادم لا يملك القسم.
    expect(FALLBACK_OFFERS.showOfferBanner).toBe(false);
  });

  it('renders the riyal placeholder, never a bare token', () => {
    // «{riyal}» يجب أن يبقى رمزاً نائباً في النصّ لا حرفاً مطبوعاً؛ المكوّن
    // يستبدله. وجوده هنا مقصود، وغيابه من كل العناصر يعني أن أحداً كتب «ريال».
    const withToken = FALLBACK_ANNOUNCEMENTS.filter((a) => a.title.includes('{riyal}'));
    expect(withToken.length).toBeGreaterThan(0);
  });
});
