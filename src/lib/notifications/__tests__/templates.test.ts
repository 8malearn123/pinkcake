import { describe, it, expect } from 'vitest';
import {
  renderMessage,
  isNotifiableStatus,
  buildTrackingUrl,
  NOTIFIABLE_STATUSES,
} from '../templates';
import type { OrderContext } from '../types';

const ctx: OrderContext = {
  orderNumber: 'ORD-1024',
  customerName: 'سارة',
  storeName: 'Pink Cake',
  branchName: 'فرع العليا',
  trackingCode: 'TRK9',
  trackingBaseUrl: 'https://app.pinkcake.test',
};

describe('renderMessage', () => {
  it('renders a customer-facing status with order number, store and tracking link', () => {
    const msg = renderMessage('ready_for_pickup', ctx);
    expect(msg).toContain('ORD-1024');
    expect(msg).toContain('فرع العليا');
    expect(msg).toContain('https://app.pinkcake.test/track?code=TRK9');
  });

  it('returns null for internal-only statuses', () => {
    expect(renderMessage('ready_to_ship', ctx)).toBeNull();
    expect(renderMessage('in_transit', ctx)).toBeNull();
    expect(renderMessage('sent_to_chef', ctx)).toBeNull();
    expect(renderMessage('totally_unknown', ctx)).toBeNull();
  });

  it('falls back gracefully when name/branch/tracking are missing', () => {
    const bare = renderMessage('paid', {
      ...ctx,
      customerName: null,
      branchName: null,
      trackingCode: null,
    });
    expect(bare).toContain('ORD-1024');
    expect(bare).not.toContain('/track?code='); // no link without a code
    expect(bare).not.toContain('null');
  });

  it('omits the tracking line from the completed (final) message', () => {
    const msg = renderMessage('completed', ctx)!;
    expect(msg).toContain('شكراً');
    expect(msg).not.toContain('/track?code=');
  });

  it('every notifiable status renders a non-empty body', () => {
    for (const status of NOTIFIABLE_STATUSES) {
      const msg = renderMessage(status, ctx);
      expect(msg, status).toBeTruthy();
      expect((msg as string).length, status).toBeGreaterThan(10);
    }
  });
});

describe('isNotifiableStatus / buildTrackingUrl', () => {
  it('matches the template map', () => {
    expect(isNotifiableStatus('paid')).toBe(true);
    expect(isNotifiableStatus('in_transit')).toBe(false);
  });

  it('builds and encodes tracking URLs, or null without inputs', () => {
    expect(buildTrackingUrl('https://x.test/', 'A B')).toBe('https://x.test/track?code=A%20B');
    expect(buildTrackingUrl(null, 'A')).toBeNull();
    expect(buildTrackingUrl('https://x.test', null)).toBeNull();
  });
});
