import type { OrderStatus } from '@/types/order';
import type { AppRole } from '@/hooks/useMyRoles';

/**
 * Canonical order state machine — a CLIENT MIRROR of the database.
 *
 * ⚠ The database is the single source of truth and the only enforcer of
 * transitions (`advance_order_workflow()` and the custom-cake pricing RPCs,
 * which validate role + current status and write `order_logs`). This module
 * exists only so the UI can decide whether to *offer* an action (e.g. show the
 * "advance" button) and so §1.2 status-machine discipline is covered by tests
 * and cannot silently drift. Never treat a `true` here as authorization.
 */

interface RegularTransition {
  to: OrderStatus;
  /** Roles allowed to perform this transition (mirrors advance_order_workflow). */
  roles: AppRole[];
}

/** Regular fulfillment happy-path (linear), role-gated. */
const REGULAR_TRANSITIONS: Partial<Record<OrderStatus, RegularTransition>> = {
  pending_approval: { to: 'awaiting_payment', roles: ['admin', 'call_center'] },
  awaiting_payment: { to: 'paid', roles: ['admin', 'call_center'] },
  paid: { to: 'preparing', roles: ['admin', 'call_center'] },
  preparing: { to: 'ready_to_ship', roles: ['admin', 'kitchen'] },
  ready_to_ship: { to: 'in_transit', roles: ['admin', 'driver'] },
  in_transit: { to: 'ready_for_pickup', roles: ['admin', 'driver', 'branch'] },
  ready_for_pickup: { to: 'completed', roles: ['admin', 'branch'] },
};

/**
 * Custom-cake pricing flow (driven by dedicated DB RPCs such as
 * `send_custom_order_to_chef`, `chef_review_custom_order`,
 * `send_pricing_to_customer`, `customer_respond_to_pricing`). Each key lists
 * the statuses it may legitimately move to.
 */
const CUSTOM_TRANSITIONS: Partial<Record<OrderStatus, OrderStatus[]>> = {
  custom_pending_review: ['sent_to_chef', 'custom_rejected'],
  sent_to_chef: ['chef_priced', 'custom_rejected'],
  chef_priced: ['pricing_sent_to_customer'],
  pricing_sent_to_customer: ['customer_accepted', 'customer_rejected'],
  // Accepted custom orders join the regular flow at payment.
  customer_accepted: ['awaiting_payment'],
};

/** Statuses with no outgoing transition (final states). */
const TERMINAL_STATUSES: ReadonlySet<OrderStatus> = new Set<OrderStatus>([
  'completed',
  'custom_rejected',
  'customer_rejected',
]);

/** The next status in the regular flow for a given role, or null if none. */
export function getNextStatus(role: AppRole, from: OrderStatus): OrderStatus | null {
  const t = REGULAR_TRANSITIONS[from];
  if (!t) return null;
  return t.roles.includes(role) ? t.to : null;
}

/** Whether the given role may advance the regular flow from `from`. */
export function canAdvance(role: AppRole, from: OrderStatus): boolean {
  return getNextStatus(role, from) !== null;
}

/** Whether `from → to` is a legitimate transition in either flow (ignores role). */
export function canTransition(from: OrderStatus, to: OrderStatus): boolean {
  if (REGULAR_TRANSITIONS[from]?.to === to) return true;
  return CUSTOM_TRANSITIONS[from]?.includes(to) ?? false;
}

/** Whether `status` is a final state. */
export function isTerminalStatus(status: OrderStatus): boolean {
  return TERMINAL_STATUSES.has(status);
}
