import { useMutation } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import type { EventLineItem } from '@/lib/eventPlanner';

export interface EventOrderPayload {
  occasion: string | null;
  guest_count: number;
  serve_styles: string[];
  station_type: string;
  station_id?: string | null;
  servers_needed: boolean;
  servers_count: number;
  service_hours: number;
  fulfillment_mode: string;
  branch_id: string | null;
  event_date: string | null;
  items: { catalog_id: string; name: string; qty: number; unit_price: number }[];
  estimated_subtotal: number;
}

// `create_event_order` is added by the backend migration (spec file 09 §3.4); it
// isn't in the generated Supabase types yet, so we call it through a narrow,
// untyped view of the client. In demo mode the mock returns a tracking code.
type RpcClient = { rpc: (fn: string, args?: Record<string, unknown>) => Promise<{ data: unknown; error: unknown }> };

function trackingFrom(data: unknown): string | null {
  if (data && typeof data === 'object') {
    const row = Array.isArray(data) ? data[0] : data;
    const code = (row as Record<string, unknown>)?.tracking_code;
    if (typeof code === 'string') return code;
  }
  return null;
}

export function useCreateEventOrder() {
  return useMutation({
    mutationFn: async (payload: EventOrderPayload) => {
      const client = supabase as unknown as RpcClient;
      const { data, error } = await client.rpc('create_event_order', { payload });
      if (error) throw error;
      return { trackingCode: trackingFrom(data) };
    },
    onError: () =>
      toast({ title: 'تعذّر إرسال الطلب', description: 'حاول مرة ثانية.', variant: 'destructive' }),
  });
}

export function payloadFromState(
  state: {
    occasion: string | null; guestCount: number; serveStyles: string[];
    stationType: string; liveStationId?: string | null;
    serversNeeded: boolean; serversCount: number; serviceHours: number;
    fulfillmentMode: string; branchId: string | null; eventDate: string | null;
  },
  items: EventLineItem[],
  subtotal: number,
): EventOrderPayload {
  return {
    occasion: state.occasion,
    guest_count: state.guestCount,
    serve_styles: state.serveStyles,
    station_type: state.stationType,
    station_id: state.liveStationId ?? null,
    servers_needed: state.serversNeeded,
    servers_count: state.serversCount,
    service_hours: state.serviceHours,
    fulfillment_mode: state.fulfillmentMode,
    branch_id: state.branchId,
    event_date: state.eventDate,
    items: items.map((i) => ({ catalog_id: i.catalogId, name: i.name, qty: i.qty, unit_price: i.unitPrice })),
    estimated_subtotal: subtotal,
  };
}
