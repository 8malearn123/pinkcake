import { describe, it, expect, beforeEach } from 'vitest';
import { loyaltyRpc, __resetDemoLoyalty } from '../loyalty';
import { resolveRpc } from '../rpc';

/** الرد العام الذي تعود به أي دالة غير مُسجّلة — أي «زرّ ميت». */
const GENERIC = { success: true, message: 'تم تنفيذ العملية (وضع تجريبي)' };

/**
 * كل دوال الولاء التي تناديها الواجهة. الغرض من القائمة أن تفشل إن أُضيفت دالة
 * جديدة ونُسي تسجيلها في الطبقة التجريبية — وهي الحالة التي تُنتج زرّاً يُظهر
 * رسالة نجاح ولا يغيّر شيئاً، في الوضع الذي تعمل به كل معاينات المشروع.
 */
const LOYALTY_RPCS = [
  'get_loyalty_settings',
  'update_loyalty_settings',
  'get_my_loyalty',
  'get_my_occasions',
  'upsert_my_occasion',
  'delete_my_occasion',
  'get_my_rewards',
  'validate_loyalty_reward',
  'get_my_referral_summary',
  'register_my_referral',
  'set_my_consent',
  'get_customer_loyalty_badge',
  'get_loyalty_overview',
  'get_loyalty_risk_report',
  'get_business_accounts',
];

beforeEach(() => {
  __resetDemoLoyalty();
});

describe('demo mode wiring', () => {
  it('maps every loyalty RPC — an unmapped one is a dead button, not an error', () => {
    for (const name of LOYALTY_RPCS) {
      expect(resolveRpc(name, {}), `${name} falls through to the generic success`).not.toEqual(
        GENERIC,
      );
    }
  });
});

describe('occasion registry', () => {
  it('adds an occasion and returns it with a countdown', () => {
    const before = (loyaltyRpc.get_my_occasions() as unknown[]).length;

    loyaltyRpc.upsert_my_occasion({
      _label: 'سارة',
      _occasion_type: 'graduation',
      _day: 12,
      _month: 6,
    });

    const rows = loyaltyRpc.get_my_occasions() as { label: string; days_until: number }[];
    expect(rows).toHaveLength(before + 1);

    const added = rows.find((r) => r.label === 'سارة');
    expect(added).toBeDefined();
    expect(added!.days_until).toBeGreaterThanOrEqual(0);
    expect(added!.days_until).toBeLessThanOrEqual(366);
  });

  it('edits in place instead of duplicating when an id is supplied', () => {
    const id = loyaltyRpc.upsert_my_occasion({
      _label: 'خالة',
      _occasion_type: 'birthday',
      _day: 3,
      _month: 3,
    }) as string;
    const afterAdd = (loyaltyRpc.get_my_occasions() as unknown[]).length;

    loyaltyRpc.upsert_my_occasion({
      _id: id,
      _label: 'خالتي',
      _occasion_type: 'birthday',
      _day: 4,
      _month: 3,
    });

    const rows = loyaltyRpc.get_my_occasions() as { label: string }[];
    expect(rows).toHaveLength(afterAdd);
    expect(rows.some((r) => r.label === 'خالتي')).toBe(true);
    expect(rows.some((r) => r.label === 'خالة')).toBe(false);
  });

  it('deletes', () => {
    const id = loyaltyRpc.upsert_my_occasion({
      _label: 'مؤقّتة',
      _occasion_type: 'other',
      _day: 1,
      _month: 1,
    }) as string;

    loyaltyRpc.delete_my_occasion({ _id: id });
    const rows = loyaltyRpc.get_my_occasions() as { label: string }[];
    expect(rows.some((r) => r.label === 'مؤقّتة')).toBe(false);
  });

  /** ندفع مقابل التقاط التواريخ، لا مقابل التسجيل — ومرّة واحدة فقط. */
  it('unlocks the personalisation reward once the registry hits the threshold', () => {
    __resetDemoLoyalty({ occasions: [], redemptions: [] });

    loyaltyRpc.upsert_my_occasion({ _label: 'أ', _occasion_type: 'other', _day: 1, _month: 1 });
    loyaltyRpc.upsert_my_occasion({ _label: 'ب', _occasion_type: 'other', _day: 2, _month: 1 });
    expect(
      (loyaltyRpc.get_my_rewards() as { origin: string }[]).filter(
        (r) => r.origin === 'registry_unlock',
      ),
    ).toHaveLength(0);

    loyaltyRpc.upsert_my_occasion({ _label: 'ج', _occasion_type: 'other', _day: 3, _month: 1 });
    const unlocked = (loyaltyRpc.get_my_rewards() as { origin: string }[]).filter(
      (r) => r.origin === 'registry_unlock',
    );
    expect(unlocked).toHaveLength(1);

    // مناسبة رابعة لا تُصدر مكافأة ثانية.
    loyaltyRpc.upsert_my_occasion({ _label: 'د', _occasion_type: 'other', _day: 4, _month: 1 });
    expect(
      (loyaltyRpc.get_my_rewards() as { origin: string }[]).filter(
        (r) => r.origin === 'registry_unlock',
      ),
    ).toHaveLength(1);
  });
});

describe('reward validation', () => {
  const code = () =>
    (loyaltyRpc.get_my_rewards() as { redemption_code: string; is_usable: boolean }[]).find(
      (r) => r.is_usable,
    )!.redemption_code;

  it('accepts a usable reward on a qualifying basket', () => {
    const res = loyaltyRpc.validate_loyalty_reward({ _code: code(), _subtotal: 300 }) as {
      valid: boolean;
      name: string;
    };
    expect(res.valid).toBe(true);
    expect(res.name).toBeTruthy();
  });

  it('enforces the minimum order — the main anti-cannibalisation lever', () => {
    const res = loyaltyRpc.validate_loyalty_reward({ _code: code(), _subtotal: 80 }) as {
      valid: boolean;
      message: string;
    };
    expect(res.valid).toBe(false);
    expect(res.message).toContain('الحد الأدنى');
  });

  it('enforces the reward-value cap relative to the order', () => {
    // مكافأة بقيمة ٤٥ على طلب ١٥٠ = ٣٠٪ ⇒ مقبولة تحت سقف ٤٠٪.
    expect(
      (loyaltyRpc.validate_loyalty_reward({ _code: code(), _subtotal: 150 }) as { valid: boolean })
        .valid,
    ).toBe(true);

    // نُضيّق السقف إلى ١٠٪ فتصير المكافأة نفسها مرفوضة.
    loyaltyRpc.update_loyalty_settings({ _patch: { redemption_max_pct: 10 } });
    const res = loyaltyRpc.validate_loyalty_reward({ _code: code(), _subtotal: 150 }) as {
      valid: boolean;
      message: string;
    };
    expect(res.valid).toBe(false);
    expect(res.message).toContain('أعلى من المسموح');
  });

  it('rejects an unknown code', () => {
    const res = loyaltyRpc.validate_loyalty_reward({ _code: 'RW-NOPE', _subtotal: 500 }) as {
      valid: boolean;
    };
    expect(res.valid).toBe(false);
  });

  it('refuses to reuse a captured reward', () => {
    const c = code();
    loyaltyRpc.__captureReward({ _code: c });
    const res = loyaltyRpc.validate_loyalty_reward({ _code: c, _subtotal: 500 }) as {
      valid: boolean;
      message: string;
    };
    expect(res.valid).toBe(false);
    expect(res.message).toContain('سابقاً');
  });
});

describe('stamp card', () => {
  it('issues a reward and resets the card when it completes', () => {
    __resetDemoLoyalty({ stampBalance: 4, redemptions: [] });

    const before = (loyaltyRpc.get_my_rewards() as { origin: string }[]).filter(
      (r) => r.origin === 'stamp_card',
    ).length;

    // الطلب المكتمل يضيف الختم الخامس ⇒ يكتمل الكرت.
    loyaltyRpc.__captureReward({ _code: 'RW-NONE' });
    const summaryBefore = (loyaltyRpc.get_my_loyalty() as { stamp_balance: number }[])[0];
    expect(summaryBefore.stamp_balance).toBe(4); // رمز غير موجود ⇒ لا شيء يتغيّر

    __resetDemoLoyalty({ stampBalance: 4, redemptions: [] });
    const c = 'RW-SEED';
    __resetDemoLoyalty({
      stampBalance: 4,
      redemptions: [
        {
          redemption_code: c,
          reward_code: 'PERSONALISATION',
          name: 'لمسة التخصيص',
          description: null,
          kind: 'personalisation',
          retail_value: 45,
          min_order_amount: 150,
          status: 'available',
          origin: 'registry_unlock',
          available_from: new Date(Date.now() - 1000).toISOString(),
          expires_at: null,
        },
      ],
    });

    loyaltyRpc.__captureReward({ _code: c });

    const summary = (loyaltyRpc.get_my_loyalty() as { stamp_balance: number }[])[0];
    expect(summary.stamp_balance).toBe(0);

    const after = (loyaltyRpc.get_my_rewards() as { origin: string }[]).filter(
      (r) => r.origin === 'stamp_card',
    ).length;
    expect(after).toBe(before + 1);
  });
});

describe('consent', () => {
  it('round-trips the marketing flag', () => {
    loyaltyRpc.set_my_consent({ _purpose: 'marketing', _granted: false });
    expect((loyaltyRpc.get_my_loyalty() as { consent_marketing: boolean }[])[0].consent_marketing)
      .toBe(false);

    loyaltyRpc.set_my_consent({ _purpose: 'marketing', _granted: true });
    expect((loyaltyRpc.get_my_loyalty() as { consent_marketing: boolean }[])[0].consent_marketing)
      .toBe(true);
  });
});

describe('staff badge', () => {
  it('surfaces the reward name, never a balance number', () => {
    const badge = (loyaltyRpc.get_customer_loyalty_badge() as {
      has_reward: boolean;
      reward_label: string | null;
    }[])[0];

    expect(badge.has_reward).toBe(true);
    expect(badge.reward_label).toBeTruthy();
    expect(badge.reward_label).not.toMatch(/^\d+$/);
  });
});
