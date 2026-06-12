/**
 * Phone normalisation for Saudi (KSA) mobile numbers → E.164.
 *
 * Accepts the formats staff actually type — 0512345678, 512345678,
 * 966512345678, +966 51 234 5678, 00966512345678 — and returns "+9665XXXXXXXX"
 * or null when the input is not a valid KSA mobile (must be 9 digits after the
 * country code and start with 5).
 */
export function toE164KSA(raw: string | null | undefined): string | null {
  if (!raw) return null;

  let d = String(raw).replace(/[\s\-()]/g, '');
  if (d.startsWith('+')) d = d.slice(1);
  if (d.startsWith('00')) d = d.slice(2);
  if (!/^\d+$/.test(d)) return null;

  if (d.startsWith('966')) d = d.slice(3);
  else if (d.startsWith('0')) d = d.slice(1);

  // National significant number must be 5 followed by 8 digits.
  if (!/^5\d{8}$/.test(d)) return null;
  return '+966' + d;
}

/** Mask a phone for display/logging: keep country code + last 3 digits. */
export function maskPhone(e164: string | null | undefined): string {
  if (!e164) return '—';
  const tail = e164.slice(-3);
  return `${e164.slice(0, 4)}••••${tail}`;
}
