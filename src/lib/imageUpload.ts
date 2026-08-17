/**
 * رفع صور الموظّفين إلى تخزين Supabase.
 *
 * استُخرجت من `components/products/ImageUpload` كي يشترك معها محرِّر الصفحة
 * الرئيسية في المسار نفسه: نفس الدلو، ونفس قواعد القبول في `./imageFiles`،
 * ونفس رسائل الرفض العربية. مسارَا رفع بقاعدتين مختلفتين يفترقان بصمت.
 */
import { supabase } from '@/integrations/supabase/client';
import { validateImageFile, type ImageRejection } from './imageFiles';

/** دلو عام أُنشئ في هجرة `20260127075858`؛ الصفحة الرئيسية تكتب تحت `homepage/`. */
export const STORE_IMAGE_BUCKET = 'product-images';

export type UploadResult = { url: string; error?: never } | { url?: never; error: ImageRejection };

export async function uploadStoreImage(file: File, folder: string): Promise<UploadResult> {
  const rejection = validateImageFile(file);
  if (rejection) return { error: rejection };

  const ext = file.name.split('.').pop() || 'jpg';
  const path = `${folder}/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;

  const { error } = await supabase.storage
    .from(STORE_IMAGE_BUCKET)
    .upload(path, file, { cacheControl: '3600', upsert: false });

  if (error) {
    return { error: { title: 'فشل الرفع', description: error.message || 'حدث خطأ أثناء رفع الصورة' } };
  }

  const { data } = supabase.storage.from(STORE_IMAGE_BUCKET).getPublicUrl(path);
  return { url: data.publicUrl };
}
