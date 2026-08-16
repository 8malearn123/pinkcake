import { describe, expect, it } from 'vitest';
import { ORDER_STATUS_LABELS, type OrderStatus } from '@/types/order';
import {
  formatClock12,
  formatReadiness,
  getOrderMoment,
  parseSlot,
  type OrderMomentInput,
} from '@/lib/orders/customerMoment';

const ALL_STATUSES = Object.keys(ORDER_STATUS_LABELS) as OrderStatus[];

/** The six statuses on the customer-visible fulfilment ladder. */
const LADDER: OrderStatus[] = [
  'paid',
  'preparing',
  'ready_to_ship',
  'in_transit',
  'ready_for_pickup',
  'completed',
];

/** Local, not UTC — parseSlot builds local dates and the tests must match. */
const NOW = new Date(2026, 7, 20, 10, 0, 0);

const base = (over: Partial<OrderMomentInput> = {}): OrderMomentInput => ({
  status: 'preparing',
  deliveryDate: '2026-08-20',
  deliveryTime: '18:00:00',
  branchName: 'فرع العليا',
  now: NOW,
  ...over,
});

describe('getOrderMoment — status coverage', () => {
  it.each(ALL_STATUSES)('%s gets a real customer story', (status) => {
    const m = getOrderMoment(base({ status }));
    expect(m.headline.trim()).not.toBe('');
    expect(m.next.trim()).not.toBe('');
    // No known status may fall through to the unknown-status branch.
    expect(m.headline).not.toBe('طلبك معنا');
  });

  it.each(ALL_STATUSES)('%s never leaks the operations vocabulary', (status) => {
    const m = getOrderMoment(base({ status }));
    // These name our own kitchen→branch hand-offs; a customer must never read them.
    expect(m.headline).not.toContain('جاهز للإرسال');
    expect(m.headline).not.toContain('في الطريق للفرع');
    expect(m.next).not.toContain('جاهز للإرسال');
    expect(m.next).not.toContain('في الطريق للفرع');
    // And the headline is a sentence, not the staff label reused.
    expect(m.headline).not.toBe(ORDER_STATUS_LABELS[status]);
  });

  it('degrades safely for an unrecognised status', () => {
    const m = getOrderMoment(base({ status: 'some_future_status' }));
    expect(m.showRail).toBe(false);
    expect(m.headline).toBe('طلبك معنا');
    expect(m.action).not.toBeNull();
  });

  it('draws the rail only for the six ladder statuses', () => {
    for (const status of ALL_STATUSES) {
      expect(getOrderMoment(base({ status })).showRail).toBe(LADDER.includes(status));
    }
  });

  it('never renders an unresolved copy token', () => {
    for (const status of [...ALL_STATUSES, 'bogus_status']) {
      const m = getOrderMoment(base({ status, branchName: null, deliveryDate: null, deliveryTime: null }));
      expect(m.headline).not.toContain('{');
      expect(m.next).not.toContain('{');
      expect(m.readiness ?? '').not.toContain('{');
    }
  });
});

describe('parseSlot', () => {
  it('normalises HH:MM:SS and HH:MM to the same local time', () => {
    const withSeconds = parseSlot('2026-08-20', '14:00:00');
    const withoutSeconds = parseSlot('2026-08-20', '14:00');
    expect(withSeconds?.getTime()).toBe(withoutSeconds?.getTime());
    // Local 14:00, not shifted into the previous day by a UTC parse.
    expect(withSeconds?.getHours()).toBe(14);
    expect(withSeconds?.getDate()).toBe(20);
  });

  it('returns null for a missing date and for junk', () => {
    expect(parseSlot(null, '14:00')).toBeNull();
    expect(parseSlot('not-a-date', '14:00')).toBeNull();
  });

  it('defaults a missing time to midday rather than UTC midnight', () => {
    expect(parseSlot('2026-08-20', null)?.getDate()).toBe(20);
  });
});

describe('formatClock12', () => {
  it('renders 12-hour Arabic-Indic time with صباحاً/مساءً', () => {
    expect(formatClock12(new Date(2026, 7, 20, 14, 0))).toBe('٢:٠٠ مساءً');
    expect(formatClock12(new Date(2026, 7, 20, 9, 5))).toBe('٩:٠٥ صباحاً');
    expect(formatClock12(new Date(2026, 7, 20, 0, 30))).toBe('١٢:٣٠ صباحاً');
  });
});

describe('formatReadiness', () => {
  const readiness = (over: Partial<OrderMomentInput>) =>
    formatReadiness(base(over), 'making');

  it('phrases a same-day slot as اليوم', () => {
    expect(readiness({ deliveryDate: '2026-08-20' }).text).toMatch(/^جاهزة اليوم/);
  });

  it('phrases a next-day slot as غداً', () => {
    expect(readiness({ deliveryDate: '2026-08-21' }).text).toMatch(/^جاهزة غداً/);
  });

  it('phrases a distant slot as a weekday', () => {
    expect(readiness({ deliveryDate: '2026-08-25' }).text).toMatch(/^جاهزة يوم/);
  });

  it('switches to a relative phrase within three hours', () => {
    expect(readiness({ deliveryTime: '12:00:00' }).text).toContain('بعد ساعتين تقريباً');
  });

  it('reports a passed slot calmly and flags it late', () => {
    const r = readiness({ deliveryDate: '2026-08-19' });
    expect(r.late).toBe(true);
    expect(r.text).toMatch(/^كان موعد الاستلام/);
  });

  it('omits the promise entirely when no date is known', () => {
    const r = readiness({ deliveryDate: null });
    expect(r.text).toBeNull();
    expect(r.late).toBe(false);
  });

  it('drops the branch suffix when the branch is unknown', () => {
    const text = readiness({ branchName: null }).text ?? '';
    expect(text).not.toContain(' — ');
    expect(text).not.toContain('{');
  });

  it('flips from WHEN to WHERE once the order is ready', () => {
    const m = getOrderMoment(base({ status: 'ready_for_pickup' }));
    expect(m.readiness).toContain('فرع العليا');
    expect(m.readiness).not.toContain('جاهزة اليوم');
  });
});

describe('late orders', () => {
  it('replaces the next-step line and opens a channel while still making', () => {
    const m = getOrderMoment(base({ status: 'preparing', deliveryDate: '2026-08-19' }));
    expect(m.late).toBe(true);
    expect(m.next).toContain('تأخّرنا قليلاً');
    expect(m.action?.kind).toBe('contact');
  });

  it('does not treat a collected order as late', () => {
    const m = getOrderMoment(base({ status: 'completed', deliveryDate: '2026-08-19' }));
    expect(m.late).toBe(false);
    expect(m.action?.kind).toBe('reorder');
  });
});
