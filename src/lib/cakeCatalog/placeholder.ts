/**
 * Cake catalog — canvas helpers. Browser-only; imported dynamically by the store
 * so nothing in the pure/test path ever touches a canvas.
 *
 * `decodeAndDownscale` moved to `@/lib/imageDownscale` (the combos catalog needs
 * the same decode path); it is re-exported here so the store's dynamic import
 * still resolves both helpers from one module.
 */

export { decodeAndDownscale, type DecodedImage } from '@/lib/imageDownscale';

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
