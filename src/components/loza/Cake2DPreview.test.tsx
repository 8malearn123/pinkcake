import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/react';
import Cake2DPreview from './Cake2DPreview';

/**
 * Smoke test for the one component shared across the Loza boundary (see D1).
 * It must render for every base shape without throwing.
 */
describe('Cake2DPreview', () => {
  it('renders an SVG for the classic base', () => {
    const { container } = render(
      <Cake2DPreview baseId="classic" colors={['#F5E6C4', '#D4A5A5']} designId="roses" />
    );
    expect(container.querySelector('svg')).toBeTruthy();
  });

  it.each(['classic', 'tier-2', 'tier-3', 'cupcakes', 'number', 'blank', null])(
    'renders without crashing for base "%s"',
    (base) => {
      const { container } = render(
        <Cake2DPreview baseId={base} colors={['#FFFFFF']} designId={null} text="عيد ميلاد سعيد" />
      );
      expect(container.querySelector('svg')).toBeTruthy();
    }
  );
});
