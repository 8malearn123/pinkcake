import { describe, it, expect } from 'vitest';
import {
  productImageUrl,
  originalImageUrl,
  PRODUCT_IMAGE_WIDTHS,
} from '@/lib/productImages';

const OBJECT_URL =
  'https://abc.supabase.co/storage/v1/object/public/product-images/products/1700-x.jpg';

describe('productImageUrl', () => {
  it('passes the URL through untouched when transforms are disabled', () => {
    expect(productImageUrl(OBJECT_URL, 'card', false)).toBe(OBJECT_URL);
  });

  it('rewrites a Supabase object URL onto the render endpoint with the size width', () => {
    const url = productImageUrl(OBJECT_URL, 'card', true)!;
    expect(url).toContain('/storage/v1/render/image/public/');
    expect(url).not.toContain('/storage/v1/object/public/');
    expect(url).toContain(`width=${PRODUCT_IMAGE_WIDTHS.card}`);
  });

  it('asks for a different width per size', () => {
    const thumb = productImageUrl(OBJECT_URL, 'thumb', true)!;
    const full = productImageUrl(OBJECT_URL, 'full', true)!;
    expect(thumb).toContain(`width=${PRODUCT_IMAGE_WIDTHS.thumb}`);
    expect(full).toContain(`width=${PRODUCT_IMAGE_WIDTHS.full}`);
    expect(PRODUCT_IMAGE_WIDTHS.thumb).toBeLessThan(PRODUCT_IMAGE_WIDTHS.full);
  });

  it('leaves non-Supabase sources alone even with transforms on', () => {
    // The seeded combo photos (Unsplash) and every local blob: URL take this path.
    const unsplash = 'https://images.unsplash.com/photo-123?w=800';
    const blob = 'blob:http://localhost:8080/8b1c-…';
    expect(productImageUrl(unsplash, 'card', true)).toBe(unsplash);
    expect(productImageUrl(blob, 'card', true)).toBe(blob);
  });

  it('returns undefined for a missing image rather than an empty src', () => {
    // An empty string in src makes the browser re-request the page itself.
    expect(productImageUrl(null, 'card', true)).toBeUndefined();
    expect(productImageUrl(undefined, 'card', true)).toBeUndefined();
    expect(productImageUrl('', 'card', true)).toBeUndefined();
  });

  it('appends its query with & when the URL already carries one', () => {
    const withQuery = `${OBJECT_URL}?token=abc`;
    expect(productImageUrl(withQuery, 'card', true)).toContain('?token=abc&width=');
  });
});

describe('originalImageUrl', () => {
  it('maps a rendered URL back to the plain object URL', () => {
    const rendered = productImageUrl(OBJECT_URL, 'card', true)!;
    expect(originalImageUrl(rendered)).toBe(OBJECT_URL);
  });

  it('returns null when the src is already the original', () => {
    expect(originalImageUrl(OBJECT_URL)).toBeNull();
  });
});
