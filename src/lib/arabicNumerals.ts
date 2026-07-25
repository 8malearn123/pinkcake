/**
 * Converts Western digits in a value to Arabic-Indic (٠-٩) — the numeral system
 * the Jazan storefront uses everywhere customer-facing. One helper so every
 * interpolated price/count renders identically (no ‎"306"‎ vs ‎"٣٠٦"‎ split).
 */
export const toArabicDigits = (v: string | number): string =>
  String(v).replace(/\d/g, (d) => '٠١٢٣٤٥٦٧٨٩'[+d]);
