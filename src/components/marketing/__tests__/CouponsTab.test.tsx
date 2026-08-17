import { fireEvent, render, screen, within } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { CouponsTab } from '@/components/marketing/CouponsTab';
import type { Coupon } from '@/lib/marketing/types';

/**
 * اختبار الواجهة وحدها: الخطّافات مُستبدَلة، والقواعد مغطّاة في
 * `src/lib/marketing/__tests__/coupon.test.ts`. ما يهمّ هنا أمران يسهل كسرهما
 * بلا أن يلاحظهما أحد: أن تُعرض **الحالة المحسوبة** لا مفتاح التفعيل، وأن
 * تصل «مرّات الاستخدام» و«الإيراد المنسوب» إلى الشاشة أصلاً.
 */

const hooks = vi.hoisted(() => ({
  coupons: [] as Coupon[],
  isLoading: false,
  error: null as Error | null,
  create: vi.fn(),
  update: vi.fn(),
  remove: vi.fn(),
  toggle: vi.fn(),
}));

vi.mock('@/hooks/useMarketing', () => ({
  useCoupons: () => ({
    data: hooks.coupons,
    isLoading: hooks.isLoading,
    error: hooks.error,
  }),
  useCreateCoupon: () => ({ mutate: hooks.create, isPending: false }),
  useUpdateCoupon: () => ({ mutate: hooks.update, isPending: false }),
  useDeleteCoupon: () => ({ mutate: hooks.remove, isPending: false }),
  useSetCouponActive: () => ({ mutate: hooks.toggle, isPending: false }),
}));

vi.mock('@/hooks/useProducts', () => ({ useProducts: () => ({ data: [] }) }));

const coupon = (partial: Partial<Coupon> = {}): Coupon => ({
  id: 'c1',
  code: 'CAKE15',
  kind: 'percent',
  value: 15,
  maxDiscount: 40,
  minOrder: 100,
  startsAt: null,
  endsAt: null,
  usageLimit: null,
  perCustomerLimit: 1,
  firstOrderOnly: true,
  scope: 'all',
  scopeValues: [],
  stackableWithLoyalty: false,
  isActive: true,
  note: '',
  createdAt: 0,
  redemptions: 38,
  discountGiven: 1140,
  revenue: 9260,
  ...partial,
});

beforeEach(() => {
  hooks.coupons = [];
  hooks.isLoading = false;
  hooks.error = null;
  hooks.create.mockClear();
  hooks.toggle.mockClear();
});

describe('CouponsTab', () => {
  it('invites the first coupon when there are none', () => {
    render(<CouponsTab />);
    expect(screen.getByText('لا توجد كوبونات بعد')).toBeInTheDocument();
  });

  it('shows the code, its summary and its attribution', () => {
    hooks.coupons = [coupon()];
    render(<CouponsTab />);

    // مقصور على الجدول: البطاقات العلوية تعرض المجاميع نفسها.
    const table = within(screen.getByRole('table'));
    expect(table.getByText('CAKE15')).toBeInTheDocument();
    expect(table.getByText('خصم ١٥٪ حتى ٤٠ ريال')).toBeInTheDocument();
    expect(table.getByText('٣٨')).toBeInTheDocument();
    expect(table.getByText('٩٢٦٠')).toBeInTheDocument();
  });

  it('labels an expired coupon as expired even though it is switched on', () => {
    // أخطر حالة في هذا الجدول: مفعّل في القاعدة ومرفوض عند العميلة.
    hooks.coupons = [coupon({ endsAt: '2020-01-01', isActive: true })];
    render(<CouponsTab />);
    expect(within(screen.getByRole('table')).getByText('منتهٍ')).toBeInTheDocument();
  });

  it('filters by computed state', () => {
    hooks.coupons = [
      coupon({ id: 'a', code: 'LIVE' }),
      coupon({ id: 'b', code: 'OFF', isActive: false }),
    ];
    render(<CouponsTab />);
    const table = () => within(screen.getByRole('table'));
    expect(table().getByText('LIVE')).toBeInTheDocument();
    expect(table().getByText('OFF')).toBeInTheDocument();

    const filters = within(screen.getByRole('group', { name: 'تصفية الكوبونات' }));
    fireEvent.click(filters.getByRole('button', { name: 'موقوف' }));
    expect(table().queryByText('LIVE')).not.toBeInTheDocument();
    expect(table().getByText('OFF')).toBeInTheDocument();
  });

  it('toggles a coupon to the opposite of its current state', () => {
    hooks.coupons = [coupon()];
    render(<CouponsTab />);
    fireEvent.click(screen.getByLabelText('إيقاف CAKE15'));
    expect(hooks.toggle).toHaveBeenCalledWith({ id: 'c1', isActive: false });
  });

  it('creates a coupon from the dialog', () => {
    render(<CouponsTab />);
    fireEvent.click(screen.getAllByRole('button', { name: /كوبون جديد/ })[0]);

    const dialog = within(screen.getByRole('dialog'));
    fireEvent.change(dialog.getByLabelText('الرمز *'), { target: { value: 'new20' } });
    fireEvent.click(dialog.getByRole('button', { name: 'إنشاء الكوبون' }));

    expect(hooks.create).toHaveBeenCalledTimes(1);
    expect(hooks.create.mock.calls[0][0]).toMatchObject({ code: 'NEW20', kind: 'percent' });
  });

  it('blocks a malformed code with a reason instead of saving it', () => {
    render(<CouponsTab />);
    fireEvent.click(screen.getAllByRole('button', { name: /كوبون جديد/ })[0]);

    const dialog = within(screen.getByRole('dialog'));
    fireEvent.change(dialog.getByLabelText('الرمز *'), { target: { value: 'X' } });
    fireEvent.click(dialog.getByRole('button', { name: 'إنشاء الكوبون' }));

    expect(hooks.create).not.toHaveBeenCalled();
    expect(dialog.getByRole('alert')).toBeInTheDocument();
  });
});
