/**
 * Cake catalog — upload validation. Pure, shared by the drop zones and the
 * context so a dragged file and a browsed file are judged identically.
 */

import { ALLOWED_IMAGE_TYPES, MAX_IMAGE_BYTES } from './types';

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
