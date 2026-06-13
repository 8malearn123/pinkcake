import { describe, it, expect } from 'vitest';
import {
  nameSchema,
  ksaPhoneSchema,
  optionalKsaPhoneSchema,
  optionalEmailSchema,
  validateKsaPhone,
  vMessages,
} from '../validation';

describe('nameSchema', () => {
  it('requires at least two characters', () => {
    expect(nameSchema.safeParse('سارة').success).toBe(true);
    expect(nameSchema.safeParse('a').success).toBe(false);
    expect(nameSchema.safeParse('  ').success).toBe(false);
  });
});

describe('ksaPhoneSchema', () => {
  it('accepts the formats staff actually type', () => {
    for (const ok of ['0512345678', '512345678', '+966512345678', '966 51 234 5678']) {
      expect(ksaPhoneSchema.safeParse(ok).success, ok).toBe(true);
    }
  });
  it('rejects invalid numbers with the shared message', () => {
    const res = ksaPhoneSchema.safeParse('0612345678');
    expect(res.success).toBe(false);
    if (!res.success) expect(res.error.issues[0].message).toBe(vMessages.phone);
  });
});

describe('optional schemas', () => {
  it('allow empty but validate when present', () => {
    expect(optionalKsaPhoneSchema.safeParse('').success).toBe(true);
    expect(optionalKsaPhoneSchema.safeParse('0512345678').success).toBe(true);
    expect(optionalKsaPhoneSchema.safeParse('123').success).toBe(false);
    expect(optionalEmailSchema.safeParse('').success).toBe(true);
    expect(optionalEmailSchema.safeParse('a@b.co').success).toBe(true);
    expect(optionalEmailSchema.safeParse('nope').success).toBe(false);
  });
});

describe('validateKsaPhone', () => {
  it('returns null when valid, a message when not', () => {
    expect(validateKsaPhone('0512345678')).toBeNull();
    expect(validateKsaPhone('abc')).toBe(vMessages.phone);
  });
});
