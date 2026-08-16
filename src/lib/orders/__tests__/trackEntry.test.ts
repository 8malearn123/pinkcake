import { beforeEach, describe, expect, it } from 'vitest';
import {
  forgetTrackCode,
  readTrackCode,
  rememberTrackCode,
  resolveTrackDestination,
} from '@/lib/orders/trackEntry';

describe('resolveTrackDestination', () => {
  it('waits rather than guessing while the orders are still loading', () => {
    expect(resolveTrackDestination({ orders: undefined })).toEqual({ kind: 'wait' });
  });

  it('goes straight to the order when exactly one is in flight', () => {
    expect(
      resolveTrackDestination({
        orders: [
          { id: 'o1', status: 'preparing' },
          { id: 'o2', status: 'completed' },
        ],
      }),
    ).toEqual({ kind: 'go', to: '/my-orders/o1' });
  });

  it('falls back to the list when several are in flight', () => {
    expect(
      resolveTrackDestination({
        orders: [
          { id: 'o1', status: 'preparing' },
          { id: 'o2', status: 'ready_for_pickup' },
        ],
      }),
    ).toEqual({ kind: 'go', to: '/my-orders' });
  });

  it('shows the list when everything is already collected', () => {
    expect(
      resolveTrackDestination({
        orders: [
          { id: 'o1', status: 'completed' },
          { id: 'o2', status: 'customer_rejected' },
        ],
      }),
    ).toEqual({ kind: 'go', to: '/my-orders' });
  });

  it('treats an in-flight custom-cake order as trackable', () => {
    expect(resolveTrackDestination({ orders: [{ id: 'o1', status: 'pricing_sent_to_customer' }] })).toEqual({
      kind: 'go',
      to: '/my-orders/o1',
    });
  });

  /*
   * The two cases that used to strand people. A failed query is indistinguishable
   * from a loading one by `data` alone, and an account with no visible orders is
   * NOT proof the customer has none — staff-created (phoned-in) orders are scoped
   * out by get_my_customer_id(). Both must reach the code field.
   */
  it('asks instead of spinning forever when the order query failed', () => {
    expect(resolveTrackDestination({ orders: undefined, failed: true })).toEqual({ kind: 'ask' });
  });

  it('asks when the account shows no orders, since a staff-created one is invisible', () => {
    expect(resolveTrackDestination({ orders: [] })).toEqual({ kind: 'ask' });
  });

  it('never resolves to /track, which would loop', () => {
    const cases = [
      { orders: undefined },
      { orders: undefined, failed: true },
      { orders: [] },
      { orders: [{ id: 'o1', status: 'preparing' }] },
      { orders: [{ id: 'o1', status: 'completed' }] },
      { orders: [{ id: 'o1', status: 'a_future_status' }] },
    ];
    for (const input of cases) {
      const d = resolveTrackDestination(input);
      if (d.kind === 'go') expect(d.to).not.toBe('/track');
    }
  });

  it('only ever returns one of the three known shapes', () => {
    const kinds = [
      resolveTrackDestination({ orders: undefined }).kind,
      resolveTrackDestination({ orders: [], failed: true }).kind,
      resolveTrackDestination({ orders: [{ id: 'o1', status: 'paid' }] }).kind,
    ];
    for (const k of kinds) expect(['wait', 'go', 'ask']).toContain(k);
  });
});

describe('remembered tracking code', () => {
  beforeEach(() => forgetTrackCode());

  it('round-trips a code so a return visit needs no typing', () => {
    rememberTrackCode('TRK1001');
    expect(readTrackCode()).toBe('TRK1001');
  });

  it('trims incidental whitespace', () => {
    rememberTrackCode('  TRK1001  ');
    expect(readTrackCode()).toBe('TRK1001');
  });

  it('ignores an empty code rather than storing a blank', () => {
    rememberTrackCode('   ');
    expect(readTrackCode()).toBe('');
  });

  it('forgets on request, so a stale code is not replayed forever', () => {
    rememberTrackCode('TRK1001');
    forgetTrackCode();
    expect(readTrackCode()).toBe('');
  });

  it('expires, bounding how long a shared device replays someone else s order', () => {
    const t0 = 1_700_000_000_000;
    rememberTrackCode('TRK1001', t0);
    const twentyNineDays = t0 + 29 * 24 * 60 * 60 * 1000;
    const thirtyOneDays = t0 + 31 * 24 * 60 * 60 * 1000;
    expect(readTrackCode(twentyNineDays)).toBe('TRK1001');
    expect(readTrackCode(thirtyOneDays)).toBe('');
  });

  it('drops the entry once expired rather than re-reading it', () => {
    const t0 = 1_700_000_000_000;
    rememberTrackCode('TRK1001', t0);
    readTrackCode(t0 + 31 * 24 * 60 * 60 * 1000);
    // Even asked again at the original time, it is gone.
    expect(readTrackCode(t0)).toBe('');
  });

  it('survives a corrupt or legacy stored value without throwing', () => {
    localStorage.setItem('pinkcake:recent-track-code:v1', 'TRK-PLAIN-STRING');
    expect(readTrackCode()).toBe('');
    localStorage.setItem('pinkcake:recent-track-code:v1', '{oops');
    expect(readTrackCode()).toBe('');
  });
});
