import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import type { ReactNode } from 'react';
import { AccountQuickLinks } from '../AccountQuickLinks';
import { StoreWishlistProvider } from '@/contexts/StoreWishlistContext';

vi.mock('@/contexts/AuthContext', () => ({
  useAuth: () => ({ user: { id: 'demo-user-0001', email: 'demo@pinkcake.test' } }),
}));

/**
 * The row's whole point is that it answers with her state. The demo seed has
 * three orders, one of them still in the kitchen — so the count is real and the
 * tracking tile carries a live headline instead of «حالة طلبك الحالي».
 */
function wrap(ui: ReactNode) {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false, gcTime: 0 } } });
  return render(
    <QueryClientProvider client={client}>
      <StoreWishlistProvider>
        <MemoryRouter>{ui}</MemoryRouter>
      </StoreWishlistProvider>
    </QueryClientProvider>,
  );
}

describe('AccountQuickLinks', () => {
  it('counts the real orders in Arabic-Indic digits', async () => {
    wrap(<AccountQuickLinks />);

    // بذرة الوضع التجريبي: ثلاثة طلبات — ننتظر وصولها لا أوّل رسم.
    await screen.findByText('٣');
    expect(screen.getByRole('button', { name: /طلباتي/ })).toHaveTextContent('٣');
  });

  it('marks the live order instead of repeating a static label', async () => {
    wrap(<AccountQuickLinks />);

    const track = await screen.findByRole('button', { name: /تتبّع طلب/ });
    expect(track).toHaveTextContent('الآن');
    expect(track).not.toHaveTextContent('حالة طلبك الحالي');
  });

  it('hides the count on an empty wishlist rather than printing ٠', async () => {
    wrap(<AccountQuickLinks />);

    const fav = await screen.findByRole('button', { name: /المفضلة/ });
    expect(fav).toHaveTextContent('منتجاتك المحفوظة');
    expect(fav).not.toHaveTextContent('٠');
  });
});
