import { useEffect, useRef, useState, type CSSProperties, type ReactNode } from 'react';
import { cn } from '@/lib/utils';

/**
 * Fades content up as it scrolls into view. Self-healing: if IntersectionObserver
 * is unavailable, or after a short fallback timeout, content is shown regardless —
 * so a section can never stay permanently hidden. Respects prefers-reduced-motion
 * (handled in CSS).
 */
export function Reveal({ children, className, style }: { children: ReactNode; className?: string; style?: CSSProperties }) {
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
      // Fire BEFORE the section reaches the viewport, not after it is 12% inside
      // it. The old `threshold: 0.12` + negative bottom margin meant a card had
      // to be visibly on screen before its fade even started, so a customer
      // scrolling at a normal speed watched content materialise late. A positive
      // bottom rootMargin extends the root 300px past the fold instead: the
      // reveal runs while the card is still below the fold and it is simply
      // there when scrolled to. threshold 0 = "any part of it".
      { threshold: 0, rootMargin: '0px 0px 300px 0px' }
    );
    io.observe(el);
    const t = window.setTimeout(() => setShown(true), 1200); // safety net
    return () => {
      io.disconnect();
      window.clearTimeout(t);
    };
  }, []);

  return (
    <div ref={ref} style={style} className={cn('reveal', shown && 'reveal-in', className)}>
      {children}
    </div>
  );
}
