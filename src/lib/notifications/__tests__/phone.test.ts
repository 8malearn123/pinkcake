import { describe, it, expect } from 'vitest';
import { toE164KSA, maskPhone } from '../phone';

describe('toE164KSA', () => {
  it('normalises every common KSA format to +9665XXXXXXXX', () => {
    const expected = '+966512345678';
    expect(toE164KSA('0512345678')).toBe(expected);
    expect(toE164KSA('512345678')).toBe(expected);
    expect(toE164KSA('966512345678')).toBe(expected);
    expect(toE164KSA('+966512345678')).toBe(expected);
    expect(toE164KSA('00966512345678')).toBe(expected);
    expect(toE164KSA('+966 51 234 5678')).toBe(expected);
    expect(toE164KSA('051-234-5678')).toBe(expected);
    expect(toE164KSA('(0512) 345 678')).toBe(expected);
  });

  it('rejects non-KSA-mobile input', () => {
    expect(toE164KSA('')).toBeNull();
    expect(toE164KSA(null)).toBeNull();
    expect(toE164KSA(undefined)).toBeNull();
    expect(toE164KSA('0612345678')).toBeNull(); // landline prefix, not 5
    expect(toE164KSA('051234567')).toBeNull(); // too short
    expect(toE164KSA('05123456789')).toBeNull(); // too long
    expect(toE164KSA('not a phone')).toBeNull();
    expect(toE164KSA('+1 415 555 0100')).toBeNull(); // US number
  });
});

describe('maskPhone', () => {
  it('shows country code and last 3 digits only', () => {
    expect(maskPhone('+966512345678')).toBe('+966••••678');
    expect(maskPhone(null)).toBe('—');
  });
});
