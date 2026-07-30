/**
 * Cake catalog — canvas helpers. Browser-only; imported dynamically by the store
 * so nothing in the pure/test path ever touches a canvas.
 */

import { DOWNSCALE_MAX_EDGE, DOWNSCALE_QUALITY } from './types';

const PLACEHOLDER_WIDTH = 480;
const PLACEHOLDER_HEIGHT = 360;

function toBlob(canvas: HTMLCanvasElement, quality: number): Promise<Blob | null> {
  return new Promise((resolve) => canvas.toBlob(resolve, 'image/jpeg', quality));
}

/**
 * A tinted, captioned stand-in for a real cake photo, so a fresh browser can
 * demonstrate the whole flow before staff have uploaded anything.
 */
export async function makePlaceholderBlob(
  label: string,
  caption: string,
  tint: string,
): Promise<Blob | null> {
  const canvas = document.createElement('canvas');
  canvas.width = PLACEHOLDER_WIDTH;
  canvas.height = PLACEHOLDER_HEIGHT;
  const ctx = canvas.getContext('2d');
  if (!ctx) return null;

  ctx.fillStyle = tint;
  ctx.fillRect(0, 0, PLACEHOLDER_WIDTH, PLACEHOLDER_HEIGHT);

  // Diagonal hairlines so the placeholder reads as a placeholder at a glance.
  ctx.strokeStyle = 'rgba(0,0,0,0.06)';
  ctx.lineWidth = 1;
  for (let x = -PLACEHOLDER_HEIGHT; x < PLACEHOLDER_WIDTH; x += 30) {
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x + PLACEHOLDER_HEIGHT, PLACEHOLDER_HEIGHT);
    ctx.stroke();
  }

  ctx.strokeStyle = 'rgba(0,0,0,0.14)';
  ctx.lineWidth = 2;
  ctx.strokeRect(12, 12, PLACEHOLDER_WIDTH - 24, PLACEHOLDER_HEIGHT - 24);

  ctx.direction = 'rtl';
  ctx.textAlign = 'center';
  ctx.fillStyle = 'rgba(36,23,18,0.82)';
  ctx.font = '600 30px Cairo, Tajawal, sans-serif';
  ctx.fillText(label, PLACEHOLDER_WIDTH / 2, 176, PLACEHOLDER_WIDTH - 60);

  ctx.fillStyle = 'rgba(36,23,18,0.45)';
  ctx.font = '400 15px Cairo, Tajawal, sans-serif';
  ctx.fillText(caption.slice(0, 64), PLACEHOLDER_WIDTH / 2, 210, PLACEHOLDER_WIDTH - 40);

  return toBlob(canvas, 0.82);
}

export interface DecodedImage {
  blob: Blob;
  width: number;
  height: number;
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
