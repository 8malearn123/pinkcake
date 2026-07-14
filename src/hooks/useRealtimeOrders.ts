import { useEffect, useState, useCallback } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useOrders } from './useOrders';
import { toast } from '@/hooks/use-toast';
import { Enums } from '@/integrations/supabase/types';
import { ORDER_STATUS_LABELS } from '@/types/order';

type OrderStatus = Enums<'order_status'>;

export interface RealtimeStats {
  totalOrders: number;
  pendingApproval: number;
  awaitingPayment: number;
  paid: number;
  preparing: number;
  readyToShip: number;
  inTransit: number;
  readyForPickup: number;
  completed: number;
  todayOrders: number;
  todayRevenue: number;
}

export interface RealtimeEvent {
  id: string;
  type: 'INSERT' | 'UPDATE' | 'DELETE';
  orderNumber: string;
  status: OrderStatus;
  previousStatus?: OrderStatus;
  timestamp: Date;
}

export function useRealtimeOrders() {
  const queryClient = useQueryClient();
  const { data: orders, isLoading, error } = useOrders();
  const [recentEvents, setRecentEvents] = useState<RealtimeEvent[]>([]);
  const [isConnected, setIsConnected] = useState(false);

  // Calculate stats
  const stats: RealtimeStats = {
    totalOrders: orders?.length || 0,
    pendingApproval: orders?.filter((o) => o.status === 'pending_approval').length || 0,
    awaitingPayment: orders?.filter((o) => o.status === 'awaiting_payment').length || 0,
    paid: orders?.filter((o) => o.status === 'paid').length || 0,
    preparing: orders?.filter((o) => o.status === 'preparing').length || 0,
    readyToShip: orders?.filter((o) => o.status === 'ready_to_ship').length || 0,
    inTransit: orders?.filter((o) => o.status === 'in_transit').length || 0,
    readyForPickup: orders?.filter((o) => o.status === 'ready_for_pickup').length || 0,
    completed: orders?.filter((o) => o.status === 'completed').length || 0,
    todayOrders: orders?.filter((o) => {
      const today = new Date().toDateString();
      const orderDate = new Date(o.created_at).toDateString();
      return today === orderDate;
    }).length || 0,
    todayRevenue: orders
      ?.filter((o) => {
        const today = new Date().toDateString();
        const orderDate = new Date(o.created_at).toDateString();
        return today === orderDate;
      })
      .reduce((sum, o) => sum + o.total_amount, 0) || 0,
  };

  const addEvent = useCallback((event: RealtimeEvent) => {
    setRecentEvents((prev) => {
      const newEvents = [event, ...prev].slice(0, 20); // Keep last 20 events
      return newEvents;
    });
  }, []);

  useEffect(() => {
    // Subscribe to realtime changes
    const channel = supabase
      .channel('orders-realtime')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'orders',
        },
        (payload) => {
          console.log('Realtime order change:', payload);
          
          // Invalidate queries to refresh data
          queryClient.invalidateQueries({ queryKey: ['orders'] });
          queryClient.invalidateQueries({ queryKey: ['kitchen-orders'] });
          queryClient.invalidateQueries({ queryKey: ['branch-orders'] });

          const newOrder = payload.new as { id: string; order_number: string; status: OrderStatus };
          const oldOrder = payload.old as { id: string; order_number: string; status: OrderStatus } | undefined;

          if (payload.eventType === 'INSERT') {
            addEvent({
              id: newOrder.id,
              type: 'INSERT',
              orderNumber: newOrder.order_number,
              status: newOrder.status,
              timestamp: new Date(),
            });
            
            toast({
              title: '🆕 طلب جديد!',
              description: `تم استلام الطلب ${newOrder.order_number}`,
            });
          } else if (payload.eventType === 'UPDATE') {
            addEvent({
              id: newOrder.id,
              type: 'UPDATE',
              orderNumber: newOrder.order_number,
              status: newOrder.status,
              previousStatus: oldOrder?.status,
              timestamp: new Date(),
            });

            // Show toast for status changes
            if (oldOrder && oldOrder.status !== newOrder.status) {
              toast({
                title: '📦 تحديث حالة الطلب',
                description: `${newOrder.order_number}: ${ORDER_STATUS_LABELS[oldOrder.status]} → ${ORDER_STATUS_LABELS[newOrder.status]}`,
              });
            }
          } else if (payload.eventType === 'DELETE') {
            addEvent({
              id: (payload.old as { id: string }).id,
              type: 'DELETE',
              orderNumber: oldOrder?.order_number || 'غير معروف',
              status: oldOrder?.status || 'pending_approval',
              timestamp: new Date(),
            });
          }
        }
      )
      .subscribe((status) => {
        console.log('Realtime subscription status:', status);
        setIsConnected(status === 'SUBSCRIBED');
      });

    return () => {
      supabase.removeChannel(channel);
    };
  }, [queryClient, addEvent]);

  const clearEvents = useCallback(() => {
    setRecentEvents([]);
  }, []);

  return {
    orders,
    stats,
    recentEvents,
    isLoading,
    error,
    isConnected,
    clearEvents,
  };
}
