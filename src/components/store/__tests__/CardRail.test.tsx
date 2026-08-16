import { render } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { CardRail } from '@/components/store/CardRail';

describe('CardRail', () => {
  it('swipes horizontally on phones and hands the grid over from sm up', () => {
    const { container } = render(
      <CardRail className="sm:grid-cols-2 lg:grid-cols-4">
        <article>تشيز كيك التوت</article>
      </CardRail>,
    );
    const rail = container.firstElementChild as HTMLElement;

    expect(rail.className).toContain('overflow-x-auto');
    expect(rail.className).toContain('snap-x');
    expect(rail.className).toContain('sm:grid');
    expect(rail.className).toContain('sm:overflow-visible');
    // tailwind-merge must not eat the caller's template — it is the only thing
    // deciding how many columns the section gets once the rail is off.
    expect(rail.className).toContain('sm:grid-cols-2');
    expect(rail.className).toContain('lg:grid-cols-4');
  });

  it('keeps the cards as direct children, so flex and grid both stretch them', () => {
    // Sizing lives on `[&>*]` rather than a wrapper for exactly this reason: a
    // wrapper div would break the equal-height stretch in both modes.
    const { container } = render(
      <CardRail>
        <article>تشيز كيك التوت</article>
        <article>كيكة الشوكولاتة</article>
      </CardRail>,
    );
    const rail = container.firstElementChild as HTMLElement;

    expect([...rail.children].map((c) => c.tagName)).toEqual(['ARTICLE', 'ARTICLE']);
  });
});
