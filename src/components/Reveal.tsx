import { useEffect, useRef, useState, type ReactNode } from 'react';
import { cn } from '@/lib/utils';

/**
 * Fades content up as it scrolls into view. Self-healing: if IntersectionObserver
 * is unavailable, or after a short fallback timeout, content is shown regardless —
 * so a section can never stay permanently hidden. Respects prefers-reduced-motion
 * (handled in CSS).
 */
export function Reveal({ children, className }: { children: ReactNode; className?: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const [shown, setShown] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el || typeof IntersectionObserver === 'undefined') {
      setShown(true);
      return;
    }
    const io = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setShown(true);
          io.disconnect();
        }
      },
      { threshold: 0.12, rootMargin: '0px 0px -8% 0px' }
    );
    io.observe(el);
    const t = window.setTimeout(() => setShown(true), 1600); // safety net
    return () => {
      io.disconnect();
      window.clearTimeout(t);
    };
  }, []);

  return (
    <div ref={ref} className={cn('reveal', shown && 'reveal-in', className)}>
      {children}
    </div>
  );
}
