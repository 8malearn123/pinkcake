/**
 * الطبقة التجريبية لبرنامج «دائرة المناسبات».
 *
 * الوضع التجريبي هو الوضع الافتراضي في هذا المستودع (وهو ما تعمل به كل معاينات
 * Vercel)، وأي دالة RPC غير مُسجّلة هنا تعود بنجاح عام **بلا أن تغيّر شيئاً** —
 * أي زرّ يعمل ويُظهر رسالة نجاح ولا يفعل شيئاً. لذلك كل دوال الولاء ممثّلة هنا
 * بحالة حقيقية قابلة للتغيّر، لا بردود ثابتة.
 *
 * تُحفظ الحالة في `sessionStorage` لأن مبدّل الأدوار التجريبي يُعيد تحميل
 * الصفحة، فبدونها تضيع كل خطوة يجرّبها المستخدم.
 */

const STORAGE_KEY = 'pinkcake:demo-loyalty:v1';

export interface DemoOccasion {
  id: string;
  label: string;
  occasion_type: string;
  occasion_day: number;
  occasion_month: number;
}

export interface DemoRedemption {
  redemption_code: string;
  reward_code: string;
  name: string;
  description: string | null;
  kind: string;
  retail_value: number;
  min_order_amount: number;
  status: string;
  origin: string;
  available_from: string;
  expires_at: string | null;
}

interface DemoLoyaltyState {
  settings: Record<string, unknown>;
  stampBalance: number;
  lifetimeStamps: number;
  tier: 'member' | 'circle';
  windowSpend: number;
  consentMarketing: boolean;
  occasions: DemoOccasion[];
  redemptions: DemoRedemption[];
  referral: { invited: number; vested: number; rewarded: number };
}

const DEFAULT_SETTINGS: Record<string, unknown> = {
  enabled: true,
  program_name: 'دائرة المناسبات',
  stamps_required: 5,
  endowed_stamps: 1,
  stamp_min_order: 150,
  redemption_min_order: 150,
  redemption_max_pct: 40,
  inactivity_expiry_months: 12,
  registry_unlock_occasions: 3,
  tier_threshold_amount: 3000,
  tier_window_months: 24,
  referral_cap_per_year: 10,
  referral_vesting_hours: 72,
};

const REWARD_CATALOG: Record<string, Omit<DemoRedemption, 'redemption_code' | 'status' | 'origin' | 'available_from' | 'expires_at'>> = {
  PERSONALISATION: {
    reward_code: 'PERSONALISATION',
    name: 'لمسة التخصيص',
    description: 'لوحة الاسم والتوبر والشموع وعلبة الإهداء الفاخرة — مجاناً مع طلبك.',
    kind: 'personalisation',
    retail_value: 45,
    min_order_amount: 150,
  },
  CUPCAKE_BOX_6: {
    reward_code: 'CUPCAKE_BOX_6',
    name: 'علبة ٦ كب كيك',
    description: 'علبة كب كيك مجانية تُضاف إلى طلبك.',
    kind: 'product',
    retail_value: 90,
    min_order_amount: 150,
  },
};

function seed(): DemoLoyaltyState {
  const now = new Date();
  const soon = new Date(now.getTime() + 21 * 86_400_000);

  return {
    settings: { ...DEFAULT_SETTINGS },
    // ٣ من ٥ — الكرت في منتصفه، وهو أنفع حال للعرض من كرت فارغ أو مكتمل.
    stampBalance: 3,
    lifetimeStamps: 7,
    tier: 'member',
    windowSpend: 1840,
    consentMarketing: true,
    occasions: [
      { id: 'occ-1', label: 'ماما', occasion_type: 'birthday', occasion_day: soon.getDate(), occasion_month: soon.getMonth() + 1 },
      { id: 'occ-2', label: 'ذكرى زواجنا', occasion_type: 'anniversary', occasion_day: 14, occasion_month: 11 },
    ],
    redemptions: [
      {
        ...REWARD_CATALOG.PERSONALISATION,
        redemption_code: 'RW-8F3A21B9',
        status: 'available',
        origin: 'registry_unlock',
        available_from: new Date(now.getTime() - 86_400_000).toISOString(),
        expires_at: new Date(now.getTime() + 300 * 86_400_000).toISOString(),
      },
    ],
    referral: { invited: 2, vested: 1, rewarded: 1 },
  };
}

let state: DemoLoyaltyState | null = null;

function load(): DemoLoyaltyState {
  if (state) return state;
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY);
    state = raw ? (JSON.parse(raw) as DemoLoyaltyState) : seed();
  } catch {
    state = seed();
  }
  return state;
}

function save() {
  try {
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {
    /* الوضع الخاص أو التخزين ممتلئ — الحالة تبقى في الذاكرة فقط */
  }
}

/** يُستخدم في الاختبارات لإعادة الحالة إلى بذرتها. */
export function __resetDemoLoyalty(next?: Partial<DemoLoyaltyState>) {
  state = { ...seed(), ...next };
  save();
}

/* ── اليوم/الشهر → كم يوماً حتى الدورة القادمة ─────────────────────────── */
function daysUntil(month: number, day: number): number {
  const today = new Date();
  const midnight = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  const lastDay = new Date(today.getFullYear(), month, 0).getDate();
  let next = new Date(today.getFullYear(), month - 1, Math.min(day, lastDay));
  if (next < midnight) {
    const nextLast = new Date(today.getFullYear() + 1, month, 0).getDate();
    next = new Date(today.getFullYear() + 1, month - 1, Math.min(day, nextLast));
  }
  return Math.round((next.getTime() - midnight.getTime()) / 86_400_000);
}

const nextId = (prefix: string) =>
  `${prefix}-${Date.now().toString(36)}-${Math.floor(Math.random() * 1e4)}`;

/* ── المعالِجات، بنفس أشكال الردود الحقيقية ────────────────────────────── */

export const loyaltyRpc: Record<string, (args?: Record<string, unknown>) => unknown> = {
  get_loyalty_settings: () => [load().settings],

  update_loyalty_settings: (a) => {
    const s = load();
    const patch = (a?.['_patch'] ?? {}) as Record<string, unknown>;
    s.settings = { ...s.settings, ...patch };
    save();
    return { success: true };
  },

  get_my_loyalty: () => {
    const s = load();
    const required = Number(s.settings.stamps_required ?? 5);
    const unlockAt = Number(s.settings.registry_unlock_occasions ?? 3);
    return [
      {
        enabled: !!s.settings.enabled,
        program_name: s.settings.program_name,
        tier: s.tier,
        stamp_balance: s.stampBalance,
        stamps_required: required,
        stamps_to_next: Math.max(required - s.stampBalance, 0),
        lifetime_stamps: s.lifetimeStamps,
        window_spend: s.windowSpend,
        tier_threshold: Number(s.settings.tier_threshold_amount ?? 3000),
        occasions_count: s.occasions.length,
        registry_unlock_occasions: unlockAt,
        registry_unlocked: s.redemptions.some((r) => r.origin === 'registry_unlock'),
        available_rewards: s.redemptions.filter((r) => r.status === 'available').length,
        referral_code: 'PC4K2M9X',
        consent_marketing: s.consentMarketing,
      },
    ];
  },

  get_my_occasions: () =>
    load()
      .occasions.map((o) => ({ ...o, days_until: daysUntil(o.occasion_month, o.occasion_day) }))
      .sort((a, b) => a.days_until - b.days_until),

  upsert_my_occasion: (a) => {
    const s = load();
    const id = (a?.['_id'] as string | null) ?? null;
    const row: DemoOccasion = {
      id: id ?? nextId('occ'),
      label: String(a?.['_label'] ?? '').trim(),
      occasion_type: String(a?.['_occasion_type'] ?? 'other'),
      occasion_day: Number(a?.['_day'] ?? 1),
      occasion_month: Number(a?.['_month'] ?? 1),
    };

    const i = s.occasions.findIndex((o) => o.id === row.id);
    if (i >= 0) s.occasions[i] = row;
    else s.occasions.push(row);

    // نفس شرط المُشغّل في القاعدة: تعبئة السجل تفتح مكافأة التخصيص مرّة واحدة.
    const unlockAt = Number(s.settings.registry_unlock_occasions ?? 3);
    if (s.occasions.length >= unlockAt && !s.redemptions.some((r) => r.origin === 'registry_unlock')) {
      s.redemptions.push({
        ...REWARD_CATALOG.PERSONALISATION,
        redemption_code: `RW-${nextId('X').toUpperCase().slice(-8)}`,
        status: 'available',
        origin: 'registry_unlock',
        available_from: new Date().toISOString(),
        expires_at: null,
      });
    }

    save();
    return row.id;
  },

  delete_my_occasion: (a) => {
    const s = load();
    s.occasions = s.occasions.filter((o) => o.id !== a?.['_id']);
    save();
    return { success: true };
  },

  get_my_rewards: () => {
    const s = load();
    const now = Date.now();
    const rows = s.redemptions
      .filter((r) => r.status === 'available' || r.status === 'held')
      .map((r) => ({
        ...r,
        is_usable:
          r.status === 'available' &&
          new Date(r.available_from).getTime() <= now &&
          (!r.expires_at || new Date(r.expires_at).getTime() > now),
      }));

    if (s.tier === 'circle') {
      rows.push({
        redemption_code: null as unknown as string,
        reward_code: 'CIRCLE_PRIORITY',
        name: 'أولوية الموعد',
        description: 'أولوية حجز مواعيد الخميس والجمعة ومواسم العيد والتخرّج.',
        kind: 'access',
        retail_value: 0,
        min_order_amount: 0,
        status: 'tier',
        origin: 'tier',
        available_from: new Date().toISOString(),
        expires_at: null,
        is_usable: false,
      });
    }

    return rows;
  },

  validate_loyalty_reward: (a) => {
    const s = load();
    const code = String(a?.['_code'] ?? '').trim().toUpperCase();
    const subtotal = Number(a?.['_subtotal'] ?? 0);
    const row = s.redemptions.find((r) => r.redemption_code === code);

    if (!row) return { valid: false, message: 'رمز المكافأة غير صحيح' };
    if (row.status === 'captured') return { valid: false, message: 'استُخدمت هذه المكافأة سابقاً' };
    if (new Date(row.available_from).getTime() > Date.now()) {
      return { valid: false, message: 'مكافأة الإحالة تُفعّل بعد ٧٢ ساعة من تسليم طلب صديقتك' };
    }

    const min = Math.max(row.min_order_amount, Number(s.settings.redemption_min_order ?? 0));
    if (subtotal < min) {
      return { valid: false, message: `الحد الأدنى لاستخدام المكافأة ${min} ريال` };
    }

    const maxPct = Number(s.settings.redemption_max_pct ?? 40);
    if (subtotal > 0 && row.retail_value > (subtotal * maxPct) / 100) {
      return {
        valid: false,
        message: 'قيمة المكافأة أعلى من المسموح لهذا الطلب — أضيفي صنفاً آخر لاستخدامها',
      };
    }

    return {
      valid: true,
      code: row.redemption_code,
      reward_code: row.reward_code,
      name: row.name,
      kind: row.kind,
      retail_value: row.retail_value,
      message: 'أضفنا مكافأتك إلى الطلب',
    };
  },

  /** يُستدعى من `create_customer_order` التجريبي عند إتمام طلب يحمل مكافأة. */
  __captureReward: (a) => {
    const s = load();
    const code = String(a?.['_code'] ?? '').trim().toUpperCase();
    const row = s.redemptions.find((r) => r.redemption_code === code);
    if (!row) return null;
    row.status = 'captured';

    // الطلب المكتمل يضيف ختماً، والكرت المكتمل يُصدر مكافأة ويخصم أختامه.
    s.stampBalance += 1;
    s.lifetimeStamps += 1;
    const required = Number(s.settings.stamps_required ?? 5);
    while (s.stampBalance >= required) {
      s.stampBalance -= required;
      s.redemptions.push({
        ...REWARD_CATALOG.CUPCAKE_BOX_6,
        redemption_code: `RW-${nextId('X').toUpperCase().slice(-8)}`,
        status: 'available',
        origin: 'stamp_card',
        available_from: new Date().toISOString(),
        expires_at: null,
      });
    }

    save();
    return row.name;
  },

  get_my_referral_summary: () => {
    const s = load();
    return [{ code: 'PC4K2M9X', ...s.referral }];
  },

  register_my_referral: (a) => {
    const code = String(a?.['_code'] ?? '').trim().toUpperCase();
    if (!code || code.length < 6) return { valid: false, message: 'رمز الدعوة غير صحيح' };
    if (code === 'PC4K2M9X') return { valid: false, message: 'لا يمكن استخدام رمز دعوتك الخاص' };
    return { valid: true, message: 'تم تسجيل الدعوة — مكافأتك تصلك بعد أول طلب مكتمل' };
  },

  set_my_consent: (a) => {
    const s = load();
    if (a?.['_purpose'] === 'marketing') s.consentMarketing = !!a?.['_granted'];
    save();
    return { success: true };
  },

  get_customer_loyalty_badge: () => {
    const s = load();
    const usable = s.redemptions.filter((r) => r.status === 'available');
    return [
      {
        tier: s.tier,
        has_reward: usable.length > 0,
        reward_label: usable.map((r) => r.name).join(' + ') || null,
        stamps_to_next: Math.max(Number(s.settings.stamps_required ?? 5) - s.stampBalance, 0),
      },
    ];
  },

  get_loyalty_overview: () => {
    const s = load();
    // أرقام معقولة لسوق واحد، لا أرقام مثالية: نسبة الموافقة دون الهدف عمداً
    // حتى تظهر الشارة التحذيرية ويرى المستخدم ما يفترض أن يراقبه.
    return [
      {
        members: 1284,
        circle_members: 96,
        occasions_stored: 2417,
        members_with_occasions: 806,
        marketing_consent_rate: 58.4,
        outstanding_stamps: 2960,
        rewards_available: 214,
        rewards_captured_90d: 173,
        reward_cost_90d: 5190,
        member_revenue_90d: 214_800,
        cost_pct_of_revenue: 2.42,
        reminders_sent_90d: 4820,
        referrals_vested_90d: 61,
        _settings: s.settings,
      },
    ];
  },

  get_loyalty_risk_report: () => [
    {
      metric: 'top_decile_share',
      label: 'حصة أعلى عُشر إنفاقاً من قيمة المكافآت',
      value: 38.5,
      detail: 'تجاوز ٥٠٪ يعني أننا نموّل سلوكاً قائماً — أعِد تصميم العتبات',
    },
    {
      metric: 'staff_originated',
      label: 'طلبات مُستحقّة أنشأها موظّفون (لا عبر المتجر)',
      value: 24,
      detail: 'قارنها بحجم الطلبات عبر الفروع — التركّز في حساب واحد إشارة',
    },
    {
      metric: 'ledger_drift',
      label: 'حسابات لا يطابق رصيدها الدفتر',
      value: 0,
      detail: 'أي رقم غير الصفر خلل يستوجب التوقّف',
    },
    {
      metric: 'referrals_review',
      label: 'إحالات موقوفة للمراجعة',
      value: 2,
      detail: 'تُراجَع يدوياً — لا تُرفض تلقائياً في سوق صغير',
    },
  ],

  get_business_accounts: () => [
    {
      id: 'biz-1',
      customer_id: 'c1',
      company_name: 'شركة نسيج للتطوير',
      vat_number: '310123456700003',
      contact_name: 'إدارة المكتب',
      credit_rate: 4,
      credit_balance: 640,
      orders_90d: 9,
      spend_90d: 16_000,
      is_active: true,
    },
    {
      id: 'biz-2',
      customer_id: 'c2',
      company_name: 'مجموعة الواحة الطبية',
      vat_number: '311998877600003',
      contact_name: 'قسم العلاقات',
      credit_rate: 4,
      credit_balance: 212,
      orders_90d: 4,
      spend_90d: 5_300,
      is_active: true,
    },
  ],
};
