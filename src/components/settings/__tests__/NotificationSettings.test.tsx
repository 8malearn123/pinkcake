import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { NotificationSettings } from '../NotificationSettings';

// The component talks to Supabase via these hooks; mock them so the UI can be
// rendered in isolation (the real Settings page is auth-gated).
const useNotificationSettings = vi.fn();
const useNotificationLog = vi.fn();
const useUpdateNotificationSettings = vi.fn(() => ({ mutate: vi.fn(), isPending: false }));

vi.mock('@/hooks/useNotifications', () => ({
  useNotificationSettings: () => useNotificationSettings(),
  useNotificationLog: () => useNotificationLog(),
  useUpdateNotificationSettings: () => useUpdateNotificationSettings(),
}));

describe('<NotificationSettings>', () => {
  beforeEach(() => {
    useNotificationLog.mockReturnValue({ data: [], isLoading: false });
  });

  it('guides the operator when the tables are not provisioned', () => {
    useNotificationSettings.mockReturnValue({ data: null, isLoading: false });
    render(<NotificationSettings />);
    expect(screen.getByText(/غير مُهيّأة بعد/)).toBeInTheDocument();
    expect(screen.getByText(/supabase functions deploy send-notification/)).toBeInTheDocument();
  });

  it('renders the controls and log once provisioned', () => {
    useNotificationSettings.mockReturnValue({
      data: { enabled: true, provider: 'mock', channel: 'sms', base_url: null },
      isLoading: false,
    });
    useNotificationLog.mockReturnValue({
      data: [
        {
          id: '1',
          order_number: 'ORD-7',
          status: 'ready_for_pickup',
          channel: 'sms',
          provider: 'mock',
          recipient: '+966••••678',
          send_status: 'sent',
          attempts: 1,
          error: null,
          created_at: '2026-06-12T09:00:00Z',
        },
      ],
      isLoading: false,
    });
    render(<NotificationSettings />);

    expect(screen.getByText('إعدادات الإشعارات')).toBeInTheDocument();
    expect(screen.getByLabelText('تفعيل الإشعارات')).toBeInTheDocument();
    // The log row surfaces order, masked recipient and a success badge.
    expect(screen.getByText('ORD-7')).toBeInTheDocument();
    expect(screen.getByText('+966••••678')).toBeInTheDocument();
    expect(screen.getByText('تم الإرسال')).toBeInTheDocument();
  });
});
