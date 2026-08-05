import { ReactNode } from 'react';
import { cn } from '@/lib/utils';

export type StatTone = 'neutral' | 'primary' | 'info' | 'success' | 'warning' | 'destructive';

interface StatTileProps {
  label: string;
  value: ReactNode;
  icon?: React.ComponentType<{ className?: string }>;
  tone?: StatTone;
  trend?: {
    value: number;
    isPositive: boolean;
  };
  className?: string;
}

/* الألوان من الرموز الدلالية فقط — ممنوع ألوان Tailwind الخام */
const TONE_STYLES: Record<StatTone, { iconBox: string; value: string }> = {
  neutral: { iconBox: 'bg-muted text-muted-foreground', value: 'text-foreground' },
  /* The headline metric carries the brand mark: berry fill, gold hairline. */
  primary: { iconBox: 'gradient-pink text-primary-foreground ring-1 ring-gold/40', value: 'text-primary' },
  info: { iconBox: 'bg-info/10 text-info', value: 'text-info' },
  success: { iconBox: 'bg-success/10 text-success', value: 'text-success' },
  warning: { iconBox: 'bg-warning/10 text-warning', value: 'text-warning' },
  destructive: { iconBox: 'bg-destructive/10 text-destructive', value: 'text-destructive' },
};

/**
 * بطاقة الإحصائيات الموحّدة لكل لوحات النظام (المطبخ، الفرع، السائق، التحكم...).
 */
export function StatTile({ label, value, icon: Icon, tone = 'neutral', trend, className }: StatTileProps) {
  const styles = TONE_STYLES[tone];

  return (
    <div className={cn('glass-card rounded-2xl p-6 transition-all duration-300 hover:-translate-y-0.5 hover:shadow-berry-soft-lg', className)}>
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <p className="text-muted-foreground text-sm font-medium">{label}</p>
          <p className={cn('text-3xl font-black mt-2 tracking-[-.02em]', styles.value)}>{value}</p>
          {trend && (
            <p
              className={cn(
                'text-sm mt-2 font-medium',
                trend.isPositive ? 'text-success' : 'text-destructive'
              )}
            >
              {trend.isPositive ? '↑' : '↓'} {Math.abs(trend.value)}% من الأمس
            </p>
          )}
        </div>
        {Icon && (
          <div className={cn('grid size-14 shrink-0 place-items-center rounded-xl', styles.iconBox)}>
            <Icon className="w-7 h-7" />
          </div>
        )}
      </div>
    </div>
  );
}
