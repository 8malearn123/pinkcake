import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import type { ReactNode } from 'react';
import { AccountHero } from '../AccountHero';
import { __resetDemoLoyalty } from '@/lib/demo/loyalty';

/**
 * The band's job is to say who she is and what is coming up. Both halves are
 * asserted against real demo state rather than fixed copy — the header this
 * replaced printed the login email as the page's h1, which was true of the
 * account and told her nothing.
 */
function wrap(ui: ReactNode) {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false, gcTime: 0 } } });
  return render(
    <QueryClientProvider client={client}>
      <MemoryRouter>{ui}</MemoryRouter>
    </QueryClientProvider>,
  );
}

beforeEach(() => {
  __resetDemoLoyalty();
});

describe('AccountHero', () => {
  it('greets by first name and keeps the email as meta, not as the heading', async () => {
    wrap(<AccountHero name="سارة القحطاني" email="sara@example.com" phone="+966501110702" />);

    expect(
      await screen.findByRole('heading', { level: 1, name: 'أهلاً، سارة' }),
    ).toBeInTheDocument();
    expect(screen.getByText('sara@example.com')).toBeInTheDocument();
    expect(screen.queryByRole('heading', { name: /sara@example\.com/ })).toBeNull();
  });

  it('falls back to a nameless welcome rather than rendering «أهلاً، undefined»', () => {
    wrap(<AccountHero name={null} email="demo@pinkcake.test" phone={null} />);

    expect(screen.getByRole('heading', { level: 1, name: 'أهلاً بك' })).toBeInTheDocument();
  });

  it('spotlights the nearest saved occasion with its countdown', async () => {
    wrap(<AccountHero name="سارة" email="sara@example.com" phone={null} />);

    expect(await screen.findByText('أقرب مناسبة')).toBeInTheDocument();
    // البذرة تحمل «ماما» و«ذكرى زواجنا» — تُعرض الأقرب، أياً كانت اليوم.
    const label = await screen.findByText(/ماما|ذكرى زواجنا/);
    expect(label).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'جهّزي كيكتها' })).toBeInTheDocument();
  });

  it('invites a first occasion when the registry is empty', async () => {
    __resetDemoLoyalty({ occasions: [] });
    wrap(<AccountHero name="سارة" email="sara@example.com" phone={null} />);

    expect(await screen.findByText(/سجلّك فاضي/)).toBeInTheDocument();
    expect(screen.queryByText('أقرب مناسبة')).toBeNull();
  });
});
