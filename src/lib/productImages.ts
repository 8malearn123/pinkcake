/**
 * Product photos — one place that decides how many pixels a card actually asks
 * the network for.
 *
 * Two independent halves, because they fix two different populations of image:
 *
 * 1. **Upload-time downscale** (`@/lib/imageDownscale`, wired into
 *    `components/products/ImageUpload`) caps every *new* upload at
 *    `DOWNSCALE_MAX_EDGE`. This works on every Supabase plan and is the real
 *    fix — a 4 MB phone photo lands as a ~200 KB JPEG.
 *
 * 2. **Render-time transform** (`productImageUrl`, below) rewrites an existing
 *    public object URL onto Supabase's image-rendering endpoint so *already
 *    uploaded* full-size photos are resized at the edge. That endpoint is a
 *    paid Supabase feature, so it is behind `IMAGE_TRANSFORM_ENABLED` and OFF
 *    by default: with it off every URL is returned untouched and nothing can
 *    break. Turn it on only once the project's plan includes Image
 *    Transformation.
 *
 * Pure and browser-API-free — safe for the test path.
 */

import { IMAGE_TRANSFORM_ENABLED } from './featureFlags';

/** The Supabase Storage path segment for a plain public object read. */
const OBJECT_SEGMENT = '/storage/v1/object/public/';
/** …and the resizing one it maps onto. */
const RENDER_SEGMENT = '/storage/v1/render/image/public/';

/**
 * Widths, in CSS pixels, of every place a product photo is drawn. Named rather
 * than passed as magic numbers so a card and its `srcset` can never disagree.
 */
export const PRODUCT_IMAGE_WIDTHS = {
  /** 48–64px avatars: cart lines, cross-sell strips, search results. */
  thumb: 128,
  /** The storefront grid card — 2-up on mobile, 4-up on desktop. */
  card: 600,
  /** Product detail hero and the lightbox. */
  full: 1200,
} as const;

export type ProductImageSize = keyof typeof PRODUCT_IMAGE_WIDTHS;

/**
 * The URL to actually put in `src`. Returns the input unchanged for anything it
 * does not recognise — a null, an external URL (the seeded Unsplash photos), a
 * blob: URL from a local catalog, or a Supabase URL when transforms are off.
 * Never throws and never returns a URL the browser cannot load.
 */
export function productImageUrl(
  url: string | null | undefined,
  size: ProductImageSize = 'card',
  /** Injectable so tests do not depend on the ambient build flag. */
  enabled: boolean = IMAGE_TRANSFORM_ENABLED,
): string | undefined {
  if (!url) return undefined;
  if (!enabled || !url.includes(OBJECT_SEGMENT)) return url;

  const width = PRODUCT_IMAGE_WIDTHS[size];
  const rendered = url.replace(OBJECT_SEGMENT, RENDER_SEGMENT);
  // `resize=contain` keeps the whole subject; the cards crop with CSS
  // `object-cover` anyway, so the server never has to guess a focal point.
  const separator = rendered.includes('?') ? '&' : '?';
  return `${rendered}${separator}width=${width}&resize=contain&quality=72`;
}

/**
 * Fallback for an `onError`: when the render endpoint is unavailable (plan
 * downgraded, transform quota hit) swap back to the untouched object URL rather
 * than showing a broken card. Returns null when the src is already the original.
 */
export function originalImageUrl(src: string): string | null {
  if (!src.includes(RENDER_SEGMENT)) return null;
  return src.replace(RENDER_SEGMENT, OBJECT_SEGMENT).split('?')[0];
}
