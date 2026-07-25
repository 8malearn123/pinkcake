/**
 * Delivery + free-delivery rules — the single source of truth shared by the
 * on-page free-delivery meter, the cart drawer nudge, and checkout, so the
 * three can never disagree. Frontend business rule (matches CartSheet).
 */
export const FREE_DELIVERY_THRESHOLD = 200;
export const DELIVERY_FEE = 25;

/** How much more (in ﷼) the basket needs to unlock free delivery (0 once reached). */
export const amountToFreeDelivery = (total: number) => Math.max(0, FREE_DELIVERY_THRESHOLD - total);

/** True once the basket qualifies for free delivery. */
export const hasFreeDelivery = (total: number) => total >= FREE_DELIVERY_THRESHOLD;

/** Progress toward free delivery, 0–100. */
export const freeDeliveryPct = (total: number) =>
  Math.min(100, Math.round((total / FREE_DELIVERY_THRESHOLD) * 100));
