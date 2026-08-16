import type { ReactNode } from 'react';
import { Reveal } from '@/components/Reveal';
import { cn } from '@/lib/utils';

interface CardRailProps {
  children: ReactNode;
  /** The caller's grid template — it only takes effect from `sm` up. */
  className?: string;
}

/**
 * A row of storefront cards: an edge-to-edge swipe rail on phones, the ordinary
 * responsive grid from `sm` up.
 *
 * Phones get the app idiom shoppers already expect from a card row — swipe
 * sideways, next card peeking at the edge — instead of a two-up grid that
 * stacks a whole catalogue vertically and pushes every section below it off the
 * fold. The rail bleeds past the section's `px-5` so the row visibly continues
 * past the screen edge, and `scroll-ps-5` lands each snap back on the section's
 * own margin rather than flush against the glass.
 *
 * Widths sit on the children (`[&>*]`) instead of a wrapper so the cards stay
 * direct children in both modes: flex items stretch to equal heights on the
 * rail, grid items do the same from `sm`. `max-w` caps the card on wide phones,
 * where a percentage alone would blow it up to half the screen.
 */
export function CardRail({ children, className }: CardRailProps) {
  return (
    <Reveal
      className={cn(
        'reveal-grid -mx-5 flex snap-x scroll-ps-5 gap-3 overflow-x-auto px-5 pb-4 scrollbar-none',
        '[&>*]:w-[78%] [&>*]:max-w-[17rem] [&>*]:shrink-0 [&>*]:snap-start',
        'sm:mx-0 sm:grid sm:overflow-visible sm:px-0 sm:pb-0 sm:[&>*]:w-auto sm:[&>*]:max-w-none',
        className,
      )}
    >
      {children}
    </Reveal>
  );
}
