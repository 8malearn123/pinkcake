import { describe, it, expect } from 'vitest';
import { ORDER_STATUS_LABELS, ORDER_STATUS_COLORS } from './order';
import { Constants } from '@/integrations/supabase/types';

/**
 * §1.2 status-machine discipline guard: every value of the `order_status`
 * Postgres enum must have an Arabic label and a token color on the client.
 * If a migration adds an enum value without updating src/types/order.ts, this
 * fails — exactly the simultaneous-update rule the plan requires.
 */
const ENUM_STATUSES = Constants.public.Enums.order_status;

describe('order status constants integrity', () => {
  it('every enum status has an Arabic label', () => {
    for (const status of ENUM_STATUSES) {
      expect(ORDER_STATUS_LABELS[status], `missing label for "${status}"`).toBeTruthy();
    }
  });

  it('every enum status has a token color', () => {
    for (const status of ENUM_STATUSES) {
      expect(ORDER_STATUS_COLORS[status], `missing color for "${status}"`).toBeTruthy();
    }
  });

  it('has no extra labels/colors beyond the enum', () => {
    expect(Object.keys(ORDER_STATUS_LABELS).sort()).toEqual([...ENUM_STATUSES].sort());
    expect(Object.keys(ORDER_STATUS_COLORS).sort()).toEqual([...ENUM_STATUSES].sort());
  });
});
