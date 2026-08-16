import { Crown, Gift } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useCustomerLoyaltyBadge } from '@/hooks/useLoyalty';

interface LoyaltyBadgeProps {
  customerId: string | null | undefined;
  className?: string;
}

/**
 * شارة الولاء على شاشات الموظّفين.
 *
 * تعرض **المكافأة لا الرصيد**، عمداً. رقم الرصيد على الطاولة يفتح باب المساومة
 * («ما ينفع تعطيني وحدة زيادة؟»)، وقراءته في الهاتف إفشاء بيانات وثغرة استيلاء
 * على الحساب. «لديها مكافأة: علبة كب كيك» كافية لإتمام العملية ولا تحتمل جدلاً.
 */
export function LoyaltyBadge({ customerId, className }: LoyaltyBadgeProps) {
  const { data: badge } = useCustomerLoyaltyBadge(customerId);

  if (!badge) return null;

  const isCircle = badge.tier === 'circle';
  if (!isCircle && !badge.has_reward) return null;

  return (
    <div className={cn('flex flex-wrap items-center gap-2', className)}>
      {isCircle && (
        <span className="inline-flex items-center gap-1.5 rounded-full border border-gold/50 bg-gold-soft/25 px-2.5 py-1 text-xs font-semibold text-gold-deep">
          <Crown className="size-3.5" />
          دائرة مميّزة
        </span>
      )}

      {badge.has_reward && (
        <span className="inline-flex items-center gap-1.5 rounded-full border border-primary/40 bg-primary/10 px-2.5 py-1 text-xs font-semibold text-primary">
          <Gift className="size-3.5" />
          لديها مكافأة: {badge.reward_label ?? 'مكافأة متاحة'}
        </span>
      )}
    </div>
  );
}
