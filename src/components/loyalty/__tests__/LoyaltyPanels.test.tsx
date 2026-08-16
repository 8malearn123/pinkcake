import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import type { ReactNode } from 'react';
import { OccasionRegistry } from '../OccasionRegistry';
import { StampCard } from '../StampCard';
import { RewardsPanel } from '../RewardsPanel';
import { LoyaltyBadge } from '../LoyaltyBadge';
import { __resetDemoLoyalty } from '@/lib/demo/loyalty';

/**
 * اختبار دخان: تُركّب اللوحات على الطبقة التجريبية (وهي الوضع الافتراضي بلا
 * ‎.env‎) وتُتحقّق من أن ما يراه المستخدم فعلاً هو الحالة، لا نصّ ثابت.
 */
function wrap(ui: ReactNode) {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false, gcTime: 0 } },
  });
  return render(<QueryClientProvider client={client}>{ui}</QueryClientProvider>);
}

beforeEach(() => {
  __resetDemoLoyalty();
});

describe('StampCard', () => {
  it('renders the seeded card position rather than a placeholder', async () => {
    wrap(<StampCard />);
    expect(await screen.findByText('كرت المناسبات')).toBeInTheDocument();
    // البذرة ٣ من ٥ ⇒ «باقي طلبان».
    await waitFor(() => expect(screen.getByText(/باقي/)).toBeInTheDocument());
  });
});

describe('OccasionRegistry', () => {
  it('lists the stored occasions with a countdown', async () => {
    wrap(<OccasionRegistry />);
    expect(await screen.findByText('سجل المناسبات')).toBeInTheDocument();
    expect(await screen.findByText('ماما')).toBeInTheDocument();
    expect(await screen.findByText('ذكرى زواجنا')).toBeInTheDocument();
  });

  it('nudges toward the unlock while the registry is short, using real counts', async () => {
    // البذرة فيها مناسبتان والعتبة ثلاث ⇒ ينقص واحدة.
    __resetDemoLoyalty({ redemptions: [] });
    wrap(<OccasionRegistry />);
    await waitFor(() => expect(screen.getByText(/لمسة التخصيص/)).toBeInTheDocument());
  });

  it('drops the nudge once the reward is already unlocked', async () => {
    wrap(<OccasionRegistry />);
    await screen.findByText('سجل المناسبات');
    // البذرة تحمل قسيمة registry_unlock ⇒ لا حافز معروض.
    await waitFor(() =>
      expect(screen.queryByText(/وافتحي «لمسة التخصيص»/)).not.toBeInTheDocument(),
    );
  });
});

describe('RewardsPanel', () => {
  it('shows the issued voucher and its code', async () => {
    wrap(<RewardsPanel />);
    expect(await screen.findByText('مكافآتي')).toBeInTheDocument();
    expect(await screen.findByText('لمسة التخصيص')).toBeInTheDocument();
    expect(await screen.findByText('RW-8F3A21B9')).toBeInTheDocument();
  });

  it('shows the empty state when nothing is available', async () => {
    __resetDemoLoyalty({ redemptions: [] });
    wrap(<RewardsPanel />);
    expect(await screen.findByText('لا توجد مكافآت متاحة الآن')).toBeInTheDocument();
  });
});

describe('LoyaltyBadge', () => {
  it('names the reward and never prints a bare balance number', async () => {
    wrap(<LoyaltyBadge customerId="c1" />);
    const badge = await screen.findByText(/لديها مكافأة/);
    expect(badge).toBeInTheDocument();
    expect(badge.textContent).toContain('لمسة التخصيص');
    // لا رقم رصيد معروض للموظّف — الشارة تذكر المكافأة فقط.
    expect(badge.textContent).not.toMatch(/\d/);
  });

  it('renders nothing for a customer with no reward and no tier', async () => {
    __resetDemoLoyalty({ redemptions: [], tier: 'member' });
    const { container } = wrap(<LoyaltyBadge customerId="c1" />);
    await waitFor(() => expect(container).toBeEmptyDOMElement());
  });
});
