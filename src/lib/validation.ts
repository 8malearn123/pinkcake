import { z } from 'zod';
import { toE164KSA } from '@/lib/notifications/phone';

/**
 * Shared form-validation schemas + Arabic messages. One source so every form
 * reads the same way and Saudi phone numbers are validated identically
 * (reusing the same normaliser the notification pipeline uses).
 */
export const vMessages = {
  name: 'الاسم مطلوب (حرفين على الأقل)',
  nameLong: 'الاسم طويل جداً',
  phone: 'أدخل رقم جوال سعودي صحيح (مثال: 05XXXXXXXX)',
  email: 'البريد الإلكتروني غير صحيح',
  required: 'هذا الحقل مطلوب',
} as const;

const isKsaPhone = (value: string): boolean => toE164KSA(value) !== null;

/** Person / customer name. */
export const nameSchema = z.string().trim().min(2, vMessages.name).max(100, vMessages.nameLong);

/** Required Saudi mobile (accepts 05…, 5…, +966…; normalised by toE164KSA). */
export const ksaPhoneSchema = z.string().trim().refine(isKsaPhone, vMessages.phone);

/** Optional Saudi mobile — empty string allowed. */
export const optionalKsaPhoneSchema = z
  .string()
  .trim()
  .refine((v) => v === '' || isKsaPhone(v), vMessages.phone)
  .optional()
  .or(z.literal(''));

/** Optional email — empty string allowed. */
export const optionalEmailSchema = z
  .string()
  .trim()
  .email(vMessages.email)
  .optional()
  .or(z.literal(''));

/** Imperative check for non-RHF forms: returns an error message, or null if valid. */
export function validateKsaPhone(value: string): string | null {
  return isKsaPhone(value) ? null : vMessages.phone;
}
