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
  /** 'compact' for dense control-room boards (اللوحة المباشرة)؛ الافتراضي للملخصات. */
  size?: 'default' | 'compact';
  className?: string;
}

/* الألوان من الرموز الدلالية فقط — ممنوع ألوان Tailwind الخام */
const TONE_STYLES: Record<StatTone, { iconBox: string; value: string }> = {
  neutral: { iconBox: 'bg-muted text-muted-foreground', value: 'text-foreground' },
  primary: { iconBox: 'gradient-pink text-white shadow-warm', value: 'text-foreground' },
  info: { iconBox: 'bg-info/10 text-info', value: 'text-info' },
  success: { iconBox: 'bg-success/10 text-success', value: 'text-success' },
  warning: { iconBox: 'bg-warning/10 text-warning', value: 'text-warning' },
  destructive: { iconBox: 'bg-destructive/10 text-destructive', value: 'text-destructive' },
};

/**
 * بطاقة الإحصائيات الموحّدة لكل لوحات النظام (المطبخ، الفرع، السائق، التحكم...).
 */
export function StatTile({ label, value, icon: Icon, tone = 'neutral', trend, size = 'default', className }: StatTileProps) {
  const styles = TONE_STYLES[tone];

  // Compact: a denser, lighter tile (icon beside the value) for boards that
  // show many metrics at once. No heavy shadow — keeps the screen airy.
  if (size === 'compact') {
    return (
      <div
        className={cn(
          'rounded-2xl border border-border/60 bg-card p-4 flex items-center gap-3 hover:border-primary/30 transition-colors duration-300',
          className
        )}
      >
        {Icon && (
          <div className={cn('w-11 h-11 rounded-xl flex items-center justify-center shrink-0', styles.iconBox)}>
            <Icon className="w-5 h-5" />
          </div>
        )}
        <div className="min-w-0">
          <p className={cn('text-2xl font-bold leading-none', styles.value)}>{value}</p>
          <p className="text-muted-foreground text-xs font-medium mt-1.5 truncate">{label}</p>
        </div>
      </div>
    );
  }

  return (
    <div className={cn('glass-card rounded-2xl p-6 hover:shadow-xl transition-all duration-300', className)}>
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <p className="text-muted-foreground text-sm font-medium">{label}</p>
          <p className={cn('text-3xl font-bold mt-2', styles.value)}>{value}</p>
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
          <div className={cn('w-14 h-14 rounded-xl flex items-center justify-center shrink-0', styles.iconBox)}>
            <Icon className="w-7 h-7" />
          </div>
        )}
      </div>
    </div>
  );
}
