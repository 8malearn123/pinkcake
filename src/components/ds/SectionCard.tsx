import { ReactNode } from 'react';
import { cn } from '@/lib/utils';

interface SectionHeadingProps {
  title: string;
  icon?: React.ComponentType<{ className?: string }>;
  action?: ReactNode;
  className?: string;
}

/**
 * عنوان قسم داخل صفحة (h2 موحّد) — يُستخدم فوق محتوى له بطاقته الخاصة (مثل الجداول).
 */
export function SectionHeading({ title, icon: Icon, action, className }: SectionHeadingProps) {
  return (
    <div className={cn('flex items-center justify-between gap-4 mb-6', className)}>
      <h2 className="text-xl font-black tracking-[-.01em] flex items-center gap-2">
        {Icon && <Icon className="w-5 h-5 text-primary" />}
        {title}
      </h2>
      {action}
    </div>
  );
}

interface SectionCardProps {
  title: string;
  icon?: React.ComponentType<{ className?: string }>;
  action?: ReactNode;
  children: ReactNode;
  className?: string;
  contentClassName?: string;
}

/**
 * قسم ببطاقة موحّدة: عنوان + محتوى. للمحتوى الذي لا يملك بطاقته الخاصة.
 */
export function SectionCard({ title, icon: Icon, action, children, className, contentClassName }: SectionCardProps) {
  return (
    <section className={cn('glass-card rounded-2xl', className)}>
      <div className="flex items-center justify-between gap-4 p-6 pb-4">
        <h2 className="text-xl font-black tracking-[-.01em] flex items-center gap-2">
          {Icon && <Icon className="w-5 h-5 text-primary" />}
          {title}
        </h2>
        {action}
      </div>
      <div className={cn('px-6 pb-6', contentClassName)}>{children}</div>
    </section>
  );
}
