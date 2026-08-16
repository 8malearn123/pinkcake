import { getOrderMoment } from '@/lib/orders/customerMoment';

/**
 * Getting the customer to their order without asking them to type anything.
 *
 * Most orders are placed through checkout, which routes an unauthenticated
 * customer via /login before writing the row — so a signed-in visitor can
 * usually be answered from `get_my_orders` alone.
 *
 * But NOT always: staff create orders for customers who phoned in
 * (/orders/new), and `get_my_orders` is scoped by `get_my_customer_id()`, so
 * such an order is invisible to an account that was never linked to it. That is
 * why resolution can end in `ask` — the tracking code has to stay reachable, or
 * those customers have no route to their order at all.
 *
 * Resolution order on a bare /track (no ?code=):
 *   1. signed in with orders we can see → go straight there
 *   2. a remembered code                → replay the last lookup that worked here
 *   3. otherwise                        → ask (sign-in and/or the code field)
 */

const RECENT_CODE_KEY = 'pinkcake:recent-track-code:v1';

/**
 * A tracking code is useful for days, not forever, and this is a browser people
 * share. Expiring the entry bounds how long a stale order can be replayed to
 * whoever picks the device up next.
 */
const RECENT_CODE_TTL_MS = 30 * 24 * 60 * 60 * 1000;

interface StoredCode {
  code: string;
  at: number;
}

/** Remember a code that actually resolved, so the next visit needs no input. */
export function rememberTrackCode(code: string, now: number = Date.now()): void {
  const trimmed = code.trim();
  if (!trimmed) return;
  try {
    localStorage.setItem(RECENT_CODE_KEY, JSON.stringify({ code: trimmed, at: now } satisfies StoredCode));
  } catch {
    /* storage unavailable or full — the deep link still works */
  }
}

export function readTrackCode(now: number = Date.now()): string {
  try {
    const raw = localStorage.getItem(RECENT_CODE_KEY);
    if (!raw) return '';
    const parsed = JSON.parse(raw) as Partial<StoredCode> | null;
    const code = typeof parsed?.code === 'string' ? parsed.code.trim() : '';
    const at = typeof parsed?.at === 'number' ? parsed.at : 0;
    if (!code) return '';
    if (now - at > RECENT_CODE_TTL_MS) {
      forgetTrackCode();
      return '';
    }
    return code;
  } catch {
    // Unreadable or from an older shape — treat as absent.
    return '';
  }
}

export function forgetTrackCode(): void {
  try {
    localStorage.removeItem(RECENT_CODE_KEY);
  } catch {
    /* nothing to do */
  }
}

interface ResolvableOrder {
  id: string;
  status: string;
}

export type TrackDestination =
  /** Still settling — hold the skeleton, decide nothing. */
  | { kind: 'wait' }
  | { kind: 'go'; to: string }
  /** We cannot answer from the account. Offer sign-in and/or the code field. */
  | { kind: 'ask' };

/**
 * Where a signed-in visitor should land instead of a code form.
 *
 * `failed` is deliberately separate from `orders === undefined`: a query that
 * errored looks identical to one still loading, and conflating them left the
 * page spinning forever with no retry and no escape.
 *
 * One order still in flight is the unambiguous answer to "track my order", so
 * we go straight to it. With several the list is the honest answer — picking
 * one would be a guess. With none visible we must ASK, never bounce them to an
 * empty list, because their order may simply have been created by staff.
 */
export function resolveTrackDestination(input: {
  orders: ResolvableOrder[] | undefined;
  failed?: boolean;
}): TrackDestination {
  // Never strand the customer on an unrecoverable state.
  if (input.failed) return { kind: 'ask' };
  if (!input.orders) return { kind: 'wait' };
  if (input.orders.length === 0) return { kind: 'ask' };

  const active = input.orders.filter((o) => {
    const { stage } = getOrderMoment({
      status: o.status,
      deliveryDate: null,
      deliveryTime: null,
      branchName: null,
    });
    return stage !== 'done' && stage !== 'closed';
  });

  if (active.length === 1) return { kind: 'go', to: `/my-orders/${active[0].id}` };
  return { kind: 'go', to: '/my-orders' };
}
