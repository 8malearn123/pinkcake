import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import React from 'react';

/* Mock the toast so the hook's success/error feedback doesn't touch the DOM. */
vi.mock('@/hooks/use-toast', () => ({ toast: vi.fn() }));

/* Mock the Supabase client: a chainable that resolves the updated row.
   Defined via vi.hoisted so the mock factory (also hoisted) can see it. */
const m = vi.hoisted(() => {
  const single = vi.fn().mockResolvedValue({ data: { id: 'order-1' }, error: null });
  const select = vi.fn(() => ({ single }));
  const eq = vi.fn(() => ({ select }));
  const update = vi.fn(() => ({ eq }));
  const from = vi.fn(() => ({ update }));
  return { single, select, eq, update, from };
});
vi.mock('@/integrations/supabase/client', () => ({ supabase: { from: m.from } }));

import { useUpdateOrderStatus } from './useOrders';

function wrapper(client: QueryClient) {
  return ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={client}>{children}</QueryClientProvider>
  );
}

describe('useUpdateOrderStatus', () => {
  beforeEach(() => vi.clearAllMocks());

  it('invalidates the orders query keys on success', async () => {
    const client = new QueryClient();
    const invalidate = vi.spyOn(client, 'invalidateQueries');

    const { result } = renderHook(() => useUpdateOrderStatus(), { wrapper: wrapper(client) });

    result.current.mutate({ orderId: 'order-1', status: 'paid' });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(m.from).toHaveBeenCalledWith('orders');
    expect(m.update).toHaveBeenCalledWith({ status: 'paid' });
    expect(invalidate).toHaveBeenCalledWith({ queryKey: ['orders'] });
    expect(invalidate).toHaveBeenCalledWith({ queryKey: ['orders', 'order-1'] });
  });
});
