import { describe, it, expect } from 'vitest';
import {
  getNextStatus,
  canAdvance,
  canTransition,
  isTerminalStatus,
} from './orderWorkflow';

describe('orderWorkflow — regular fulfillment flow', () => {
  it('advances the happy path in order', () => {
    expect(canTransition('pending_approval', 'awaiting_payment')).toBe(true);
    expect(canTransition('awaiting_payment', 'paid')).toBe(true);
    expect(canTransition('paid', 'preparing')).toBe(true);
    expect(canTransition('preparing', 'ready_to_ship')).toBe(true);
    expect(canTransition('ready_to_ship', 'in_transit')).toBe(true);
    expect(canTransition('in_transit', 'ready_for_pickup')).toBe(true);
    expect(canTransition('ready_for_pickup', 'completed')).toBe(true);
  });

  it('rejects skipping and going backwards', () => {
    expect(canTransition('pending_approval', 'paid')).toBe(false); // skip
    expect(canTransition('paid', 'awaiting_payment')).toBe(false); // backward
    expect(canTransition('preparing', 'completed')).toBe(false); // skip
    expect(canTransition('completed', 'preparing')).toBe(false); // from terminal
  });

  it('gates transitions by role (mirrors advance_order_workflow)', () => {
    // Kitchen owns preparing → ready_to_ship, not the payment steps.
    expect(getNextStatus('kitchen', 'preparing')).toBe('ready_to_ship');
    expect(getNextStatus('kitchen', 'awaiting_payment')).toBeNull();

    // Branch completes pickup; driver moves goods in transit.
    expect(getNextStatus('branch', 'ready_for_pickup')).toBe('completed');
    expect(getNextStatus('driver', 'ready_to_ship')).toBe('in_transit');
    expect(getNextStatus('call_center', 'pending_approval')).toBe('awaiting_payment');

    // Admin can advance any regular stage.
    expect(canAdvance('admin', 'preparing')).toBe(true);
    expect(canAdvance('admin', 'ready_for_pickup')).toBe(true);

    // Customer never advances staff workflow.
    expect(canAdvance('customer', 'preparing')).toBe(false);
  });
});

describe('orderWorkflow — custom-cake pricing flow', () => {
  it('follows the chef → pricing → customer path', () => {
    expect(canTransition('custom_pending_review', 'sent_to_chef')).toBe(true);
    expect(canTransition('sent_to_chef', 'chef_priced')).toBe(true);
    expect(canTransition('chef_priced', 'pricing_sent_to_customer')).toBe(true);
    expect(canTransition('pricing_sent_to_customer', 'customer_accepted')).toBe(true);
    expect(canTransition('pricing_sent_to_customer', 'customer_rejected')).toBe(true);
    expect(canTransition('customer_accepted', 'awaiting_payment')).toBe(true);
  });

  it('allows rejection branches but not illegal jumps', () => {
    expect(canTransition('sent_to_chef', 'custom_rejected')).toBe(true);
    expect(canTransition('sent_to_chef', 'customer_accepted')).toBe(false);
    expect(canTransition('chef_priced', 'customer_accepted')).toBe(false);
  });
});

describe('orderWorkflow — terminal states', () => {
  it('identifies final states', () => {
    expect(isTerminalStatus('completed')).toBe(true);
    expect(isTerminalStatus('custom_rejected')).toBe(true);
    expect(isTerminalStatus('customer_rejected')).toBe(true);
  });

  it('non-final states are not terminal', () => {
    expect(isTerminalStatus('preparing')).toBe(false);
    expect(isTerminalStatus('pricing_sent_to_customer')).toBe(false);
  });
});
