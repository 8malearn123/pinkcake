import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { AppErrorBoundary } from '../AppErrorBoundary';
import { SetupRequired } from '../SetupRequired';

describe('<SetupRequired>', () => {
  it('lists the missing vars and the copy command', () => {
    render(<SetupRequired missing={['VITE_SUPABASE_URL']} />);
    expect(screen.getByText('VITE_SUPABASE_URL')).toBeInTheDocument();
    expect(screen.getByText(/cp \.env\.example \.env/)).toBeInTheDocument();
  });
});

describe('<AppErrorBoundary>', () => {
  it('renders a fallback (not a blank screen) when a child throws', () => {
    const Boom = () => {
      throw new Error('kaboom');
    };
    // Silence the expected React error log for this case.
    const spy = vi.spyOn(console, 'error').mockImplementation(() => {});
    render(
      <AppErrorBoundary>
        <Boom />
      </AppErrorBoundary>
    );
    expect(screen.getByText('حدث خطأ غير متوقع')).toBeInTheDocument();
    expect(screen.getByText('kaboom')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'إعادة التحميل' })).toBeInTheDocument();
    spy.mockRestore();
  });
});
