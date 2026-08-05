/**
 * Staff image uploads — the canvas half.
 *
 * Kept apart from `imageFiles.ts` on purpose: this module touches `document`
 * and `Image`, so the local stores import it *dynamically* and nothing in the
 * pure/test path ever pulls a canvas into jsdom.
 */

import { DOWNSCALE_MAX_EDGE, DOWNSCALE_QUALITY } from './imageFiles';

export interface DecodedImage {
  blob: Blob;
  width: number;
  height: number;
}

function toBlob(canvas: HTMLCanvasElement, quality: number): Promise<Blob | null> {
  return new Promise((resolve) => canvas.toBlob(resolve, 'image/jpeg', quality));
}

/**
 * Decode a staff upload, capture its true dimensions, and downscale it before
 * storage. A phone photo is ~10× smaller after this, which is the difference
 * between a usable catalog and QuotaExceededError after 200 uploads.
 *
 * Returns the ORIGINAL blob when it is already small enough or when the canvas
 * path fails — never loses the image over an optimisation.
 */
export async function decodeAndDownscale(file: Blob): Promise<DecodedImage> {
  const objectUrl = URL.createObjectURL(file);
  try {
    const image = await new Promise<HTMLImageElement>((resolve, reject) => {
      const el = new Image();
      el.onload = () => resolve(el);
      el.onerror = () => reject(new Error('decode failed'));
      el.src = objectUrl;
    });

    const { naturalWidth: width, naturalHeight: height } = image;
    const longestEdge = Math.max(width, height);
    if (longestEdge <= DOWNSCALE_MAX_EDGE) return { blob: file, width, height };

    const scale = DOWNSCALE_MAX_EDGE / longestEdge;
    const targetWidth = Math.round(width * scale);
    const targetHeight = Math.round(height * scale);

    const canvas = document.createElement('canvas');
    canvas.width = targetWidth;
    canvas.height = targetHeight;
    const ctx = canvas.getContext('2d');
    if (!ctx) return { blob: file, width, height };
    ctx.drawImage(image, 0, 0, targetWidth, targetHeight);

    const resized = await toBlob(canvas, DOWNSCALE_QUALITY);
    return resized
      ? { blob: resized, width: targetWidth, height: targetHeight }
      : { blob: file, width, height };
  } finally {
    URL.revokeObjectURL(objectUrl);
  }
}
