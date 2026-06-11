import { describe, it, expect, beforeAll, vi } from 'vitest';
import { render } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import React from 'react';

/* Mock Supabase so the shell renders offline (no auth/roles network). */
vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
    auth: {
      onAuthStateChange: () => ({ data: { subscription: { unsubscribe: () => {} } } }),
      getSession: () => Promise.resolve({ data: { session: null } }),
    },
    rpc: vi.fn().mockResolvedValue({ data: [], error: null }),
    from: vi.fn(() => ({
      select: () => ({ eq: () => ({ maybeSingle: () => Promise.resolve({ data: null, error: null }) }) }),
    })),
    channel: vi.fn(() => ({ on: vi.fn().mockReturnThis(), subscribe: vi.fn().mockReturnThis() })),
    removeChannel: vi.fn(),
  },
}));

import { MainLayout } from './MainLayout';
import { SettingsProvider } from '@/contexts/SettingsContext';
import { AuthProvider } from '@/contexts/AuthContext';
import { ImpersonationProvider } from '@/contexts/ImpersonationContext';

function renderShell() {
  const client = new QueryClient();
  return render(
    <QueryClientProvider client={client}>
      <SettingsProvider>
        <AuthProvider>
          <ImpersonationProvider>
            <BrowserRouter>
              <MainLayout>
                <div data-testid="page-content">المحتوى</div>
              </MainLayout>
            </BrowserRouter>
          </ImpersonationProvider>
        </AuthProvider>
      </SettingsProvider>
    </QueryClientProvider>
  );
}

/**
 * RTL app-shell guard (locks U1). jsdom does no geometric layout, so we assert
 * structurally: the nav sits on the logical START (right in RTL) and the shell
 * is NOT row-reversed (which would drag the first child to the left). This test
 * fails if anyone reintroduces `flex-row-reverse` or moves the sidebar to a
 * physical left/right edge.
 */
describe('MainLayout — RTL shell direction', () => {
  beforeAll(() => {
    document.documentElement.dir = 'rtl';
    document.documentElement.lang = 'ar';
  });

  it('renders the navigation sidebar on the start (right) side', () => {
    const { container } = renderShell();
    const aside = container.querySelector('aside');
    expect(aside).toBeTruthy();
    expect(aside!.className).toContain('start-0');
    expect(aside!.className).not.toMatch(/\b(left|right)-0\b/);
  });

  it('does not row-reverse the shell (would push the sidebar left in RTL)', () => {
    const { container } = renderShell();
    const shell = container.querySelector('aside')!.parentElement!;
    expect(shell.className).toContain('flex');
    expect(shell.className).not.toContain('flex-row-reverse');
  });

  it('places the sidebar before the main content in DOM order', () => {
    const { container } = renderShell();
    const aside = container.querySelector('aside')!;
    const main = container.querySelector('main')!;
    // main must FOLLOW aside in the document.
    expect(aside.compareDocumentPosition(main) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
  });
});
