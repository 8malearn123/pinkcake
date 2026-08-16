import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import { ORDER_STATUS_LABELS, type OrderStatus } from '@/types/order';
import { getOrderMoment } from '@/lib/orders/customerMoment';
import { OrderMomentHero } from '../OrderMomentHero';

const ALL_STATUSES = Object.keys(ORDER_STATUS_LABELS) as OrderStatus[];

const LADDER: OrderStatus[] = [
  'paid',
  'preparing',
  'ready_to_ship',
  'in_transit',
  'ready_for_pickup',
  'completed',
];

function renderHero(status: string) {
  const moment = getOrderMoment({
    status,
    deliveryDate: '2026-08-20',
    deliveryTime: '18:00:00',
    branchName: 'فرع العليا',
    now: new Date(2026, 7, 20, 10, 0, 0),
  });
  return render(
    <OrderMomentHero moment={moment} orderNumber="PC-3001" />,
  );
}

describe('OrderMomentHero', () => {
  it.each([...ALL_STATUSES, 'a_future_status'])('renders a real answer for %s', (status) => {
    const { container, unmount } = renderHero(status);

    // A heading with actual words — the old stepper rendered a fully grey,
    // all-pending rail for any status outside its six-item happy path.
    const heading = screen.getByRole('heading', { level: 1 });
    expect(heading.textContent?.trim()).not.toBe('');

    expect(container.textContent).not.toContain('{');
    expect(container.textContent).not.toContain('جاهز للإرسال');
    expect(container.textContent).not.toContain('في الطريق للفرع');
    expect(container.textContent).toContain('PC-3001');

    unmount();
  });

  it('draws the progress rail only for the statuses on the ladder', () => {
    for (const status of [...ALL_STATUSES, 'a_future_status']) {
      const { unmount } = renderHero(status);
      const rail = screen.queryByRole('progressbar');

      if (LADDER.includes(status as OrderStatus)) {
        expect(rail).not.toBeNull();
        // A meaningful position, never the dead "nothing is done" state.
        expect(Number(rail?.getAttribute('aria-valuenow'))).toBeGreaterThanOrEqual(1);
        expect(rail?.getAttribute('aria-valuetext')?.trim()).not.toBe('');
      } else {
        // A linear bar for a status we cannot place would be a lie.
        expect(rail).toBeNull();
      }

      unmount();
    }
  });

  it('carries at most one anchor CTA', () => {
    for (const status of [...ALL_STATUSES, 'a_future_status']) {
      const { container, unmount } = renderHero(status);
      expect(container.querySelectorAll('button').length).toBeLessThanOrEqual(1);
      unmount();
    }
  });

  it('leads with the promise line while an order is being made', () => {
    renderHero('preparing');
    expect(screen.getByText(/جاهزة اليوم/)).toBeInTheDocument();
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('كيكتك في الفرن الآن');
  });

  it('offers a reorder CTA once the order is collected', () => {
    renderHero('completed');
    expect(screen.getByRole('button', { name: 'اطلبها مرة ثانية' })).toBeInTheDocument();
  });
});
