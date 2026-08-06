/**
 * Cake catalog — first-run placeholder art.
 *
 * These are drawn as **SVG**, not canvas JPEGs, and that is a performance
 * decision rather than a stylistic one. The seed mints one placeholder per
 * catalog node — 135 of them for the three demo cakes — and the old canvas path
 * did a `document.createElement('canvas')` + rasterise + `canvas.toBlob(…,
 * 'image/jpeg')` for each, sequentially, on the main thread. JPEG encoding a
 * 480×360 bitmap is single-digit milliseconds *each*; multiplied out that was
 * seconds of a frozen tab before the storefront could show its first three
 * design cards.
 *
 * Building the same art as an SVG string is pure string concatenation: the whole
 * seed drops to low single-digit milliseconds, the blobs are ~1 KB instead of
 * ~20 KB (so the IndexedDB write and the quota budget both shrink), and an
 * object URL of an `image/svg+xml` blob renders in `<img>` exactly like any
 * other image. Nothing external is referenced — the fonts are system stacks —
 * so the SVG stays self-contained, which is what makes it safe in an `<img>`.
 *
 * `decodeAndDownscale` (the real-upload path) still needs a canvas and lives in
 * `@/lib/imageDownscale`; it is re-exported here so the store's single dynamic
 * import keeps resolving both helpers from one module.
 */

export { decodeAndDownscale, type DecodedImage } from '@/lib/imageDownscale';

const PLACEHOLDER_WIDTH = 480;
const PLACEHOLDER_HEIGHT = 360;

/** SVG is XML: an unescaped `&` or `<` in a cake name breaks the whole document. */
function escapeXml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

/**
 * The placeholder as markup. Split out from the Blob wrapper so it can be
 * asserted directly — jsdom's Blob has no `.text()`, so a test that only had
 * the blob could check its size and nothing else.
 */
export function buildPlaceholderSvg(label: string, caption: string, tint: string): string {
  const w = PLACEHOLDER_WIDTH;
  const h = PLACEHOLDER_HEIGHT;
  // The diagonal hairlines that made the old bitmap read as a placeholder at a
  // glance — one repeating pattern here instead of 30 stroked paths.
  const svg =
    `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}">` +
    `<defs><pattern id="h" width="30" height="30" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">` +
    `<line x1="0" y1="0" x2="0" y2="30" stroke="rgba(0,0,0,0.06)" stroke-width="1"/></pattern></defs>` +
    `<rect width="${w}" height="${h}" fill="${escapeXml(tint)}"/>` +
    `<rect width="${w}" height="${h}" fill="url(#h)"/>` +
    `<rect x="12" y="12" width="${w - 24}" height="${h - 24}" fill="none" stroke="rgba(0,0,0,0.14)" stroke-width="2"/>` +
    `<text x="${w / 2}" y="176" direction="rtl" text-anchor="middle" fill="rgba(36,23,18,0.82)" ` +
    `font-family="Cairo, Tajawal, sans-serif" font-size="30" font-weight="600">${escapeXml(label)}</text>` +
    `<text x="${w / 2}" y="210" direction="rtl" text-anchor="middle" fill="rgba(36,23,18,0.45)" ` +
    `font-family="Cairo, Tajawal, sans-serif" font-size="15">${escapeXml(caption.slice(0, 64))}</text>` +
    `</svg>`;

  return svg;
}

/**
 * A tinted, captioned stand-in for a real cake photo, so a fresh browser can
 * demonstrate the whole flow before staff have uploaded anything.
 *
 * Async purely to keep the store's `renderPlaceholder` port unchanged — there is
 * nothing to await any more, which is the entire point.
 */
export async function makePlaceholderBlob(
  label: string,
  caption: string,
  tint: string,
): Promise<Blob | null> {
  return new Blob([buildPlaceholderSvg(label, caption, tint)], { type: 'image/svg+xml' });
}
