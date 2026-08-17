import { describe, it, expect, beforeEach } from 'vitest';
import { __resetDemoMarketing, recordCouponUse } from '../marketing';
import { resolveRpc, resolveFunction } from '../rpc';
import type { Coupon, StorefrontPromos } from '@/lib/marketing/types';

/** الرد العام الذي تعود به أي دالة غير مُسجّلة — أي «زرّ ميت». */
const GENERIC = { success: true, message: 'تم تنفيذ العملية (وضع تجريبي)' };

/**
 * كل دوال التسويق التي تناديها الواجهة. الغرض من القائمة أن تفشل إن أُضيفت
 * دالة جديدة ونُسي تسجيلها في الطبقة التجريبية — وهي الحالة التي تُنتج زرّاً
 * يُظهر رسالة نجاح ولا يغيّر شيئاً، في الوضع الذي تعمل به كل معاينات المشروع.
 */
const MARKETING_RPCS = [
  'get_coupons',
  'create_coupon',
  'update_coupon',
  'delete_coupon',
  'set_coupon_active',
  'get_announcements',
  'create_announcement',
  'update_announcement',
  'delete_announcement',
  'set_announcement_active',
  'reorder_announcements',
  'get_store_offers',
  'update_store_offers',
  'get_storefront_promos',
  'get_campaigns',
  'create_campaign',
  'update_campaign',
  'delete_campaign',
  'get_audience_size',
  'record_campaign_send',
  'get_season_overrides',
  'set_season_override',
  'get_marketing_overview',
  'get_coupon_performance',
  'get_referrals_for_admin',
  'validate_coupon',
];

const coupons = () => resolveRpc('get_coupons', {}) as Coupon[];
const find = (code: string) => coupons().find((c) => c.code === code);

beforeEach(() => {
  __resetDemoMarketing();
});

describe('demo mode wiring', () => {
  it('maps every marketing RPC — an unmapped one is a dead button, not an error', () => {
    for (const name of MARKETING_RPCS) {
      expect(resolveRpc(name, {}), `${name} falls through to the generic success`).not.toEqual(
        GENERIC,
      );
    }
  });
});

describe('coupon CRUD', () => {
  it('seeds the codes the storefront already advertises', () => {
    expect(find('CAKE15')).toBeTruthy();
    expect(find('CAKE15')?.firstOrderOnly).toBe(true);
  });

  it('creates a coupon and normalises its code', () => {
    const res = resolveRpc('create_coupon', {
      _draft: { code: ' new25 ', kind: 'fixed', value: 25, minOrder: 100 },
    }) as { success: boolean };
    expect(res.success).toBe(true);
    expect(find('NEW25')?.value).toBe(25);
  });

  it('refuses a duplicate code instead of silently succeeding', () => {
    const res = resolveRpc('create_coupon', {
      _draft: { code: 'cake15', kind: 'percent', value: 5 },
    }) as { success: boolean; message: string };
    expect(res.success).toBe(false);
    expect(res.message).toMatch(/مستخدم/);
  });

  it('refuses an invalid draft', () => {
    const res = resolveRpc('create_coupon', {
      _draft: { code: 'X', kind: 'percent', value: 10 },
    }) as { success: boolean };
    expect(res.success).toBe(false);
  });

  it('updates a coupon without touching its metrics', () => {
    const before = find('WELCOME10');
    resolveRpc('update_coupon', {
      _id: before?.id,
      _draft: { code: 'WELCOME10', kind: 'percent', value: 12, minOrder: 100 },
    });
    const after = find('WELCOME10');
    expect(after?.value).toBe(12);
    expect(after?.redemptions).toBe(before?.redemptions);
  });

  it('deactivates and deletes', () => {
    const row = find('SWEET15');
    resolveRpc('set_coupon_active', { _id: row?.id, _is_active: false });
    expect(find('SWEET15')?.isActive).toBe(false);

    resolveRpc('delete_coupon', { _id: row?.id });
    expect(find('SWEET15')).toBeUndefined();
  });
});

describe('validate_coupon reads the admin-authored coupons', () => {
  it('accepts an active code and returns the applied envelope', () => {
    const res = resolveRpc('validate_coupon', { _code: 'cake15', _subtotal: 200 }) as {
      valid: boolean;
      code: string;
      kind: string;
      value: number;
    };
    expect(res.valid).toBe(true);
    expect(res.code).toBe('CAKE15');
    expect(res.kind).toBe('percent');
    expect(res.value).toBe(15);
  });

  it('refuses a code the admin deactivated', () => {
    resolveRpc('set_coupon_active', { _id: find('CAKE15')?.id, _is_active: false });
    const res = resolveRpc('validate_coupon', { _code: 'CAKE15', _subtotal: 200 }) as {
      valid: boolean;
      message: string;
    };
    expect(res.valid).toBe(false);
    expect(res.message).toMatch(/موقوف/);
  });

  it('refuses a basket below the coupon minimum', () => {
    const res = resolveRpc('validate_coupon', { _code: 'CAKE15', _subtotal: 50 }) as {
      valid: boolean;
      message: string;
    };
    expect(res.valid).toBe(false);
    expect(res.message).toContain('100');
  });

  it('refuses an unknown code', () => {
    const res = resolveRpc('validate_coupon', { _code: 'NOPE', _subtotal: 500 }) as {
      valid: boolean;
    };
    expect(res.valid).toBe(false);
  });

  it('reports free delivery as its own outcome, not as a discount', () => {
    resolveRpc('set_coupon_active', { _id: find('TAWSEEL')?.id, _is_active: true });
    const res = resolveRpc('validate_coupon', { _code: 'TAWSEEL', _subtotal: 200 }) as {
      valid: boolean;
      free_delivery: boolean;
      value: number;
    };
    expect(res.valid).toBe(true);
    expect(res.free_delivery).toBe(true);
    expect(res.value).toBe(0);
  });
});

describe('redemption attribution', () => {
  it('moves the counters when an order carries the code', () => {
    // لقطة بالقيم لا بالمرجع: الطبقة التجريبية تعيد الصفوف الحيّة نفسها،
    // فحفظ الكائن يعني مقارنة الشيء بنفسه بعد تغيّره.
    const before = { ...find('PINK25') };
    recordCouponUse({ code: 'pink25', discount: 25, total: 300 });
    const after = find('PINK25');
    expect(after?.redemptions).toBe((before.redemptions ?? 0) + 1);
    expect(after?.discountGiven).toBe((before.discountGiven ?? 0) + 25);
    expect(after?.revenue).toBe((before.revenue ?? 0) + 300);
  });

  it('ignores an order with no code', () => {
    const before = coupons().reduce((n, c) => n + c.redemptions, 0);
    recordCouponUse({ code: null, discount: 0, total: 300 });
    expect(coupons().reduce((n, c) => n + c.redemptions, 0)).toBe(before);
  });

  it('enforces the per-customer limit once the code has been used', () => {
    // CAKE15 محدودة بمرّة واحدة لكل عميلة — الاستخدام الثاني يُرفض.
    recordCouponUse({ code: 'CAKE15', discount: 30, total: 200 });
    const res = resolveRpc('validate_coupon', { _code: 'CAKE15', _subtotal: 200 }) as {
      valid: boolean;
      message: string;
    };
    expect(res.valid).toBe(false);
    expect(res.message).toMatch(/من قبل/);
  });
});

describe('storefront promos', () => {
  it('returns only the active announcements plus the offers', () => {
    const [promos] = resolveRpc('get_storefront_promos', {}) as StorefrontPromos[];
    expect(promos.announcements.every((a) => a.isActive)).toBe(true);
    expect(promos.announcements.filter((a) => a.slot === 'ticker')).toHaveLength(5);
    expect(promos.offers.freeDeliveryThreshold).toBe(200);
  });

  it('drops an announcement the admin deactivated', () => {
    const rows = resolveRpc('get_announcements', {}) as { id: string; slot: string }[];
    const gift = rows.find((r) => r.slot === 'gift_box');
    resolveRpc('set_announcement_active', { _id: gift?.id, _is_active: false });

    const [promos] = resolveRpc('get_storefront_promos', {}) as StorefrontPromos[];
    expect(promos.announcements.some((a) => a.slot === 'gift_box')).toBe(false);
  });

  it('persists an offers patch', () => {
    resolveRpc('update_store_offers', { _patch: { freeDeliveryThreshold: 120 } });
    const [promos] = resolveRpc('get_storefront_promos', {}) as StorefrontPromos[];
    expect(promos.offers.freeDeliveryThreshold).toBe(120);
    // التصحيح جزئي — بقية الحقول لا تُمحى.
    expect(promos.offers.deliveryFee).toBe(25);
  });
});

describe('campaigns', () => {
  it('marks a campaign scheduled when it carries a time', () => {
    resolveRpc('create_campaign', {
      _draft: { name: 'اختبار', audience: 'lapsed_90d', channel: 'sms', body: 'نصّ', scheduledAt: '2026-09-01T11:00' },
    });
    const rows = resolveRpc('get_campaigns', {}) as { name: string; status: string }[];
    expect(rows.find((c) => c.name === 'اختبار')?.status).toBe('scheduled');
  });

  it('refuses to edit a campaign that already went out', () => {
    const rows = resolveRpc('get_campaigns', {}) as { id: string; status: string }[];
    const sent = rows.find((c) => c.status === 'sent');
    const res = resolveRpc('update_campaign', {
      _id: sent?.id,
      _draft: { name: 'تعديل', audience: 'all_consented', channel: 'sms', body: 'آخر' },
    }) as { success: boolean };
    expect(res.success).toBe(false);
  });

  it('records a send against the campaign row', () => {
    const rows = resolveRpc('get_campaigns', {}) as { id: string; status: string }[];
    const draft = rows.find((c) => c.status === 'draft');
    resolveRpc('record_campaign_send', {
      _id: draft?.id,
      _recipients: 100,
      _delivered: 97,
      _failed: 3,
    });
    const after = (resolveRpc('get_campaigns', {}) as { id: string; status: string; delivered: number }[])
      .find((c) => c.id === draft?.id);
    expect(after?.status).toBe('sent');
    expect(after?.delivered).toBe(97);
  });
});

describe('send-campaign edge function (demo)', () => {
  it('is mapped — an unmapped function name would fake a successful send', () => {
    const { data } = resolveFunction('send-campaign', {
      audience: 'all_consented',
      body: 'رسالة تجريبية للاختبار',
      dryRun: true,
    });
    expect(data).not.toEqual({ success: true });
    expect((data as { recipients: number }).recipients).toBeGreaterThan(0);
  });

  it('never reports a send during a dry run', () => {
    const { data } = resolveFunction('send-campaign', {
      audience: 'circle_tier',
      body: 'رسالة تجريبية للاختبار',
      dryRun: true,
    }) as { data: { dryRun: boolean; sent: number } };
    expect(data.dryRun).toBe(true);
    expect(data.sent).toBe(0);
  });
});

describe('season overrides', () => {
  it('stores and replaces a per-year override', () => {
    resolveRpc('set_season_override', { _id: 'ramadan', _year: 2026, _month: 2, _day: 18 });
    let rows = resolveRpc('get_season_overrides', {}) as { id: string; day: number }[];
    expect(rows).toHaveLength(1);
    expect(rows[0].day).toBe(18);

    resolveRpc('set_season_override', { _id: 'ramadan', _year: 2026, _month: 2, _day: 19 });
    rows = resolveRpc('get_season_overrides', {}) as { id: string; day: number }[];
    expect(rows).toHaveLength(1);
    expect(rows[0].day).toBe(19);
  });

  it('clears the override when given an impossible date', () => {
    resolveRpc('set_season_override', { _id: 'ramadan', _year: 2026, _month: 2, _day: 18 });
    resolveRpc('set_season_override', { _id: 'ramadan', _year: 2026, _month: 0, _day: 0 });
    expect(resolveRpc('get_season_overrides', {})).toHaveLength(0);
  });
});
