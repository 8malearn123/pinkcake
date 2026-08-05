/**
 * Staff image uploads — the rules every local upload path agrees on.
 *
 * Pure and browser-API-free at module scope, so the pure/test path can import
 * it freely. Shared by the cake catalog (`/cake-design`) and the combos catalog
 * (`/products?tab=combos`) so a dragged file and a browsed file are judged
 * identically wherever staff drop one.
 */

/** Mirrors the product image upload rules so staff hit one consistent limit. */
export const MAX_IMAGE_BYTES = 5 * 1024 * 1024;
export const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'] as const;

/**
 * Staff photos are downscaled before storage — local quota is the binding
 * constraint. The targets live here rather than next to the canvas code that
 * applies them (`@/lib/imageDownscale`) so the pure/test path can read them
 * without importing a module that touches `document`.
 */
export const DOWNSCALE_MAX_EDGE = 1600;
export const DOWNSCALE_QUALITY = 0.85;

export interface ImageRejection {
  title: string;
  description: string;
}

/** Returns null when the file is acceptable, or the Arabic toast copy when not. */
export function validateImageFile(file: File | Blob | null | undefined): ImageRejection | null {
  if (!file) {
    return { title: 'لم يتم اختيار ملف', description: 'اختر صورة ثم أعد المحاولة' };
  }
  if (!(ALLOWED_IMAGE_TYPES as readonly string[]).includes(file.type)) {
    return {
      title: 'نوع ملف غير مدعوم',
      description: 'يرجى اختيار صورة بصيغة JPG أو PNG أو WebP أو GIF',
    };
  }
  if (file.size > MAX_IMAGE_BYTES) {
    return {
      title: 'حجم الملف كبير جداً',
      description: 'الحد الأقصى لحجم الصورة هو 5 ميجابايت',
    };
  }
  return null;
}

/** True when a drag event is carrying files (rather than text or a link). */
export function dragCarriesFiles(dataTransfer: DataTransfer | null): boolean {
  if (!dataTransfer) return false;
  return Array.from(dataTransfer.types ?? []).includes('Files');
}
