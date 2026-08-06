import { describe, it, expect } from 'vitest';
import { buildPlaceholderSvg, makePlaceholderBlob } from './placeholder';

/**
 * The seed mints one of these per catalog node — 135 for the three demo cakes.
 * The old canvas + `toBlob('image/jpeg')` implementation froze the tab for
 * seconds doing it, so what is locked in here is that it stays cheap: SVG, no
 * canvas, and small enough that the whole set is a rounding error against the
 * browser's storage budget.
 */
describe('makePlaceholderBlob', () => {
  it('produces an SVG blob, not a rasterised bitmap', async () => {
    const blob = await makePlaceholderBlob('قلب', 'قلب حلو · قلب', '#eed3da');
    expect(blob).not.toBeNull();
    expect(blob!.type).toBe('image/svg+xml');
  });

  it('needs no canvas — jsdom has none, and this resolves anyway', async () => {
    // A regression here would be silent in the app and fatal on first boot:
    // `HTMLCanvasElement.toBlob` resolves `null` in jsdom, and the seed would
    // fall back to writing caption text as an image blob.
    await expect(makePlaceholderBlob('دائرية', 'كيكة', '#e6ddcd')).resolves.toBeInstanceOf(Blob);
  });

  it('draws the label and the caption', () => {
    const svg = buildPlaceholderSvg('ريد فيلفِت', 'زفاف ملكي · ريد فيلفِت', '#ecc9cd');
    expect(svg).toContain('ريد فيلفِت');
    expect(svg).toContain('زفاف ملكي · ريد فيلفِت');
    expect(svg).toContain('#ecc9cd');
  });

  it('escapes XML metacharacters so a cake name cannot break the document', () => {
    const svg = buildPlaceholderSvg('توت & كريمة', '<script>x</script>', '#fff');
    expect(svg).toContain('توت &amp; كريمة');
    expect(svg).not.toContain('<script>');
    expect(svg).toContain('&lt;script&gt;');
  });

  it('stays well under a kilobyte, so 135 of them cost ~100 KB not ~3 MB', async () => {
    const blob = await makePlaceholderBlob('فراولة', 'احتفال كلاسيكي · دائرية · فانيليا', '#f0cdd2');
    expect(blob!.size).toBeLessThan(1024);
  });

  it('truncates an over-long caption the way the old renderer did', () => {
    const long = 'ن'.repeat(200);
    const svg = buildPlaceholderSvg('x', long, '#fff');
    expect(svg).toContain('ن'.repeat(64));
    expect(svg).not.toContain('ن'.repeat(65));
  });
});
