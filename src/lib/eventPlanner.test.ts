import { describe, it, expect } from 'vitest';
import { planEvent, planSubtotal, suggestServers, type EventConfig } from './eventPlanner';

const base: EventConfig = {
  occasion: 'wedding',
  guestCount: 0,
  serveStyles: [],
  stationType: 'none',
  liveStationId: null,
  serversNeeded: false,
  serversCount: 0,
  serviceHours: 0,
};

const ids = (cfg: Partial<EventConfig>) => planEvent({ ...base, ...cfg }).items.map((i) => i.catalogId);
const qtyOf = (cfg: Partial<EventConfig>, id: string) =>
  planEvent({ ...base, ...cfg }).items.filter((i) => i.catalogId === id).reduce((s, i) => s + i.qty, 0);

describe('planEvent', () => {
  it('returns nothing for zero guests', () => {
    expect(planEvent({ ...base, guestCount: 0, serveStyles: ['centerpiece_cake'] }).items).toHaveLength(0);
  });

  it('cake-only: picks the smallest single cake that covers ~85% of guests', () => {
    // 40 guests → ceil(40*0.85)=34 servings → cake-three (serves 45)
    const items = planEvent({ ...base, guestCount: 40, serveStyles: ['centerpiece_cake'] }).items;
    expect(items).toHaveLength(1);
    expect(items[0].catalogId).toBe('cake-three');
    expect(items[0].qty).toBe(1);
  });

  it('huge headcount tops up cakes beyond the largest single size', () => {
    // 300 guests → 255 servings → biggest cake (75) × ceil(255/75)=4
    expect(qtyOf({ guestCount: 300, serveStyles: ['centerpiece_cake'] }, 'cake-four')).toBe(4);
  });

  it('dessert table replacing the cake uses the higher per-guest ratio and splits varieties', () => {
    // 50 guests, no cake → 3.5/guest = 175 pieces → ceil(175/20)=9 boxes across ≤6 varieties
    const items = planEvent({ ...base, guestCount: 50, serveStyles: ['assorted_mini'] }).items;
    expect(items.length).toBe(6); // split across 6 mini SKUs
    const totalBoxes = items.reduce((s, i) => s + i.qty, 0);
    expect(totalBoxes).toBe(9);
  });

  it('mini-desserts use the lower ratio when a cake is also present', () => {
    // 50 guests with cake → 1.5/guest = 75 pieces → ceil(75/20)=4 boxes
    const items = planEvent({ ...base, guestCount: 50, serveStyles: ['centerpiece_cake', 'assorted_mini'] }).items;
    const miniBoxes = items.filter((i) => i.catalogId.startsWith('mini-')).reduce((s, i) => s + i.qty, 0);
    expect(miniBoxes).toBe(4);
    expect(items.some((i) => i.catalogId.startsWith('cake-'))).toBe(true);
  });

  it('tiny event (10 guests) yields a single small cake + one mini box', () => {
    const items = planEvent({ ...base, guestCount: 10, serveStyles: ['centerpiece_cake', 'assorted_mini'] }).items;
    expect(qtyOf({ guestCount: 10, serveStyles: ['centerpiece_cake', 'assorted_mini'] }, 'cake-classic')).toBe(1);
    const miniBoxes = items.filter((i) => i.catalogId.startsWith('mini-')).reduce((s, i) => s + i.qty, 0);
    expect(miniBoxes).toBe(1);
  });

  it('computes cupcake and maamoul boxes from per-guest ratios', () => {
    // 80 guests → cupcakes ceil(80*1.5)=120 /12 = 10 boxes; maamoul ceil(80*3)=240 /24 = 10 boxes
    expect(qtyOf({ guestCount: 80, serveStyles: ['cupcake'] }, 'cupcake-box')).toBe(10);
    expect(qtyOf({ guestCount: 80, serveStyles: ['maamoul'] }, 'maamoul-box')).toBe(10);
  });

  it('adds one tray per ~25 guests', () => {
    expect(qtyOf({ guestCount: 300, serveStyles: ['trays'] }, 'tray-mixed')).toBe(12);
  });

  it('adds the chosen live station', () => {
    expect(ids({ guestCount: 60, serveStyles: ['centerpiece_cake'], stationType: 'live', liveStationId: 'svc-live-waffle' }))
      .toContain('svc-live-waffle');
  });

  it('adds a ready corner station when chosen', () => {
    expect(ids({ guestCount: 60, serveStyles: ['centerpiece_cake'], stationType: 'ready_corner' }))
      .toContain('svc-ready-corner');
  });

  it('server line is count × hours of server-hours', () => {
    const q = qtyOf(
      { guestCount: 90, serveStyles: ['centerpiece_cake'], serversNeeded: true, serversCount: 3, serviceHours: 4 },
      'svc-server-hour',
    );
    expect(q).toBe(12);
  });

  it('estimated subtotal sums qty × unit price', () => {
    const plan = planEvent({ ...base, guestCount: 40, serveStyles: ['centerpiece_cake'] });
    expect(planSubtotal(plan.items)).toBe(620); // one cake-three
  });

  it('suggests one server per ~30 guests, min 1', () => {
    expect(suggestServers(0)).toBe(1);
    expect(suggestServers(10)).toBe(1);
    expect(suggestServers(90)).toBe(3);
    expect(suggestServers(120)).toBe(4);
  });
});
