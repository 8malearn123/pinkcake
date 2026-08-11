import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import React, { useState } from 'react';

vi.mock('@/hooks/use-toast', () => ({ toast: vi.fn() }));

/* Supabase RPC stub — each test sets what search_customer_by_phone returns. */
const m = vi.hoisted(() => ({ rpc: vi.fn() }));
vi.mock('@/integrations/supabase/client', () => ({ supabase: { rpc: m.rpc } }));

import { CustomerLookup, type CustomerFields, type CustomerLookupStatus } from '../CustomerLookup';

/** Host that wires the component up the way the order forms do. */
function Host() {
  const [value, setValue] = useState<CustomerFields>({ name: '', phone: '', address: '' });
  const [status, setStatus] = useState<CustomerLookupStatus>('idle');
  return (
    <QueryClientProvider
      client={new QueryClient({ defaultOptions: { mutations: { retry: false } } })}
    >
      <CustomerLookup
        value={value}
        onChange={(patch) => setValue((v) => ({ ...v, ...patch }))}
        status={status}
        onStatusChange={setStatus}
      />
      <output data-testid="status">{status}</output>
    </QueryClientProvider>
  );
}

const search = (phone: string) => {
  fireEvent.change(screen.getByLabelText(/رقم الجوال/), { target: { value: phone } });
  fireEvent.click(screen.getByRole('button', { name: /استعلام/ }));
};

describe('CustomerLookup', () => {
  beforeEach(() => vi.clearAllMocks());

  it('shows the matched customer when the number is registered', async () => {
    m.rpc.mockResolvedValue({
      data: [{ id: 'c1', name: 'نورة الشمري', phone: '0501110701', address: 'حي الياسمين' }],
      error: null,
    });

    render(<Host />);
    search('0501110701');

    await waitFor(() => expect(screen.getByTestId('status')).toHaveTextContent('matched'));
    expect(m.rpc).toHaveBeenCalledWith('search_customer_by_phone', { _phone: '0501110701' });
    expect(screen.getByText('نورة الشمري')).toBeInTheDocument();
    expect(screen.getByText('حي الياسمين')).toBeInTheDocument();
  });

  it('offers "add a new customer" when the number is unknown, keeping the phone', async () => {
    m.rpc.mockResolvedValue({ data: [], error: null });

    render(<Host />);
    search('0555555555');

    const addButton = await screen.findByRole('button', { name: /إضافة عميل جديد/ });
    expect(screen.getByText(/لا يوجد عميل مسجّل بهذا الرقم/)).toBeInTheDocument();

    fireEvent.click(addButton);
    await waitFor(() => expect(screen.getByTestId('status')).toHaveTextContent('manual'));
    expect(screen.getByLabelText(/اسم العميل/)).toHaveValue('');
    expect(screen.getByText('0555555555')).toBeInTheDocument();
  });

  it('rejects an invalid mobile number without calling the RPC', async () => {
    render(<Host />);
    search('12345');

    expect(await screen.findByText(/أدخل رقم جوال سعودي صحيح/)).toBeInTheDocument();
    expect(m.rpc).not.toHaveBeenCalled();
    expect(screen.getByTestId('status')).toHaveTextContent('idle');
  });
});
