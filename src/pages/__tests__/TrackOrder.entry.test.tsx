import { describe, expect, it, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter, Route, Routes, useLocation } from 'react-router-dom';

/**
 * /track must never strand anyone.
 *
 * The page resolves the order from the URL code, the account, or a remembered
 * code — and every one of those can come back empty or fail. This locks the
 * rule that whatever happens, the customer lands on something they can act on:
 * a redirect, or a screen with a working control. An earlier version rendered a
 * bare spinner forever when `get_my_orders` errored, with no retry, no code
 * field and no sign-in.
 */

const state = vi.hoisted(() => ({
  auth: { user: null as { id: string } | null, isLoading: false },
  myOrders: { data: undefined as unknown, isError: false },
  tracked: { data: undefined as unknown, isLoading: false, isError: false, isFetching: false },
}));

vi.mock('@/contexts/AuthContext', () => ({ useAuth: () => state.auth }));
vi.mock('@/contexts/SettingsContext', () => ({
  useSettings: () => ({ settings: { storeName: 'Pink Cake' } }),
}));
vi.mock('@/hooks/useCustomerStore', () => ({
  useMyOrders: () => state.myOrders,
  useTrackedOrder: () => ({ ...state.tracked, refetch: vi.fn() }),
}));
vi.mock('@/hooks/useOrderItemLines', () => ({
  useOrderItemLines: () => ({ lines: [], matched: [], matchedIds: [] }),
}));
vi.mock('@/hooks/useReorder', () => ({ useReorder: () => vi.fn() }));

/* Chrome that needs the storefront providers — not what is under test here. */
vi.mock('@/components/orders/KeepShoppingBand', () => ({ KeepShoppingBand: () => null }));
vi.mock('@/components/store/StorefrontMasthead', () => ({ StorefrontMasthead: () => null }));
vi.mock('@/components/store/StorefrontFooter', () => ({ StorefrontFooter: () => null }));
vi.mock('@/components/store/FloatingContactButton', () => ({ FloatingContactButton: () => null }));
vi.mock('@/components/store/BackToTop', () => ({ BackToTop: () => null }));
vi.mock('@/components/store/StorefrontDecor', () => ({ Marquee: () => null }));

import TrackOrder from '@/pages/TrackOrder';

function Elsewhere() {
  const { pathname } = useLocation();
  return <output data-testid="landed">{pathname}</output>;
}

function renderTrack(path = '/track') {
  return render(
    <MemoryRouter initialEntries={[path]}>
      <Routes>
        <Route path="/track" element={<TrackOrder />} />
        <Route path="*" element={<Elsewhere />} />
      </Routes>
    </MemoryRouter>,
  );
}

/** Either we navigated away, or the page offers something to act on. */
function expectAWayForward(container: HTMLElement) {
  const landed = screen.queryByTestId('landed');
  if (landed) {
    expect(landed.textContent).not.toBe('/track');
    return;
  }
  const controls = container.querySelectorAll('button, a[href], input');
  expect(controls.length).toBeGreaterThan(0);
}

beforeEach(() => {
  state.auth = { user: null, isLoading: false };
  state.myOrders = { data: undefined, isError: false };
  state.tracked = { data: undefined, isLoading: false, isError: false, isFetching: false };
  localStorage.clear();
});

describe('/track resolution', () => {
  it('offers sign-in and a code field to an unknown visitor', () => {
    const { container } = renderTrack();
    expect(screen.getByRole('button', { name: 'سجّل الدخول' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'عندي رمز تتبّع' })).toBeInTheDocument();
    expectAWayForward(container);
  });

  it('sends a signed-in customer straight to their single active order', () => {
    state.auth = { user: { id: 'u1' }, isLoading: false };
    state.myOrders = { data: [{ id: 'o1', status: 'preparing' }], isError: false };
    renderTrack();
    expect(screen.getByTestId('landed')).toHaveTextContent('/my-orders/o1');
  });

  it('sends a signed-in customer with several active orders to the list', () => {
    state.auth = { user: { id: 'u1' }, isLoading: false };
    state.myOrders = {
      data: [
        { id: 'o1', status: 'preparing' },
        { id: 'o2', status: 'ready_for_pickup' },
      ],
      isError: false,
    };
    renderTrack();
    expect(screen.getByTestId('landed')).toHaveTextContent('/my-orders');
  });

  // The regression. Previously: a bare spinner, forever, with no escape.
  it('still offers the code field when the order query fails', () => {
    state.auth = { user: { id: 'u1' }, isLoading: false };
    state.myOrders = { data: undefined, isError: true };
    const { container } = renderTrack();
    expect(screen.getByRole('button', { name: 'عندي رمز تتبّع' })).toBeInTheDocument();
    expectAWayForward(container);
  });

  // Staff-created (phoned-in) orders are scoped out of get_my_orders, so an
  // empty account is not proof the customer has no order.
  it('still offers the code field when the account shows no orders', () => {
    state.auth = { user: { id: 'u1' }, isLoading: false };
    state.myOrders = { data: [], isError: false };
    const { container } = renderTrack();
    expect(screen.getByRole('button', { name: 'عندي رمز تتبّع' })).toBeInTheDocument();
    expectAWayForward(container);
  });

  it('honours an explicit deep-link code even for a signed-in customer', () => {
    state.auth = { user: { id: 'u1' }, isLoading: false };
    state.myOrders = { data: [{ id: 'o1', status: 'preparing' }], isError: false };
    state.tracked = {
      data: {
        order_number: 'PC-3001',
        status: 'preparing',
        branch_name: 'فرع العليا',
        delivery_date: null,
        delivery_time: null,
        total_amount: 120,
        items: [],
      },
      isLoading: false,
      isError: false,
      isFetching: false,
    };
    renderTrack('/track?code=TRK1001');
    // No redirect: the link wins.
    expect(screen.queryByTestId('landed')).toBeNull();
    expect(screen.getByText('PC-3001')).toBeInTheDocument();
  });

  it('leaves a way forward in every SETTLED state', () => {
    const cases = [
      { auth: { user: null, isLoading: false } },
      { auth: { user: { id: 'u1' }, isLoading: false }, myOrders: { data: undefined, isError: true } },
      { auth: { user: { id: 'u1' }, isLoading: false }, myOrders: { data: [], isError: false } },
      {
        auth: { user: { id: 'u1' }, isLoading: false },
        myOrders: { data: [{ id: 'o1', status: 'completed' }], isError: false },
      },
    ];

    for (const c of cases) {
      state.auth = c.auth;
      state.myOrders = c.myOrders ?? { data: undefined, isError: false };
      const { container, unmount } = renderTrack();
      expectAWayForward(container);
      unmount();
    }
  });

  /*
   * The two genuinely transient states are allowed to have no controls, but they
   * must show progress rather than a blank page — and they must be able to end.
   * AuthContext resolves isLoading in a .finally(), so a failed getSession()
   * cannot pin this on forever.
   */
  it('shows progress, not a blank page, while it is still deciding', () => {
    for (const s of [
      { user: null, isLoading: true },
      { user: { id: 'u1' }, isLoading: false },
    ]) {
      state.auth = s;
      state.myOrders = { data: undefined, isError: false };
      const { container, unmount } = renderTrack();
      expect(container.querySelector('.animate-spin')).not.toBeNull();
      unmount();
    }
  });

  it('shows a distinct recoverable screen when the code lookup itself fails', () => {
    state.tracked = { data: undefined, isLoading: false, isError: true, isFetching: false };
    localStorage.setItem(
      'pinkcake:recent-track-code:v1',
      JSON.stringify({ code: 'TRK1001', at: Date.now() }),
    );
    const { container } = renderTrack();
    expect(screen.getByRole('button', { name: /جرّب مرة ثانية/ })).toBeInTheDocument();
    expectAWayForward(container);
  });
});
