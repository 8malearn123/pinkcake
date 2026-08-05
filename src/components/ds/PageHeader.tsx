import { ReactNode } from 'react';
import { cn } from '@/lib/utils';

interface PageHeaderProps {
  title: string;
  description?: string;
  icon?: React.ComponentType<{ className?: string }>;
  actions?: ReactNode;
  className?: string;
}

/**
 * رأس الصفحة الموحّد — كل صفحات الموظفين تبدأ به.
 * العنوان دائماً text-3xl font-bold، والوصف سطر واحد بلون خافت.
 */
export function PageHeader({ title, description, icon: Icon, actions, className }: PageHeaderProps) {
  return (
    <div className={cn('flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4', className)}>
      <div className="flex items-center gap-3">
        {Icon && (
          <div className="gradient-pink shadow-berry-soft grid size-12 shrink-0 place-items-center rounded-xl text-primary-foreground ring-1 ring-gold/40">
            <Icon className="size-6" />
          </div>
        )}
        <div>
          <h1 className="text-3xl font-black tracking-[-.02em] text-foreground">{title}</h1>
          {description && <p className="mt-1 text-muted-foreground">{description}</p>}
        </div>
      </div>
      {actions && <div className="flex flex-wrap items-center gap-3">{actions}</div>}
    </div>
  );
}
