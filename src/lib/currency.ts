/**
 * Saudi Riyal currency helpers.
 *
 * The currency MARK is the new official Saudi Riyal symbol (approved by SAMA,
 * Feb 2025), rendered as an inline SVG via <RiyalSymbol /> / <Price /> from
 * `@/components/ui/riyal`. These helpers format only the NUMBER — always in
 * Western (Latin) digits with comma grouping — so the symbol sits next to it.
 *
 * Use formatSARText() only for plain-string contexts where an inline SVG can't
 * be used (print HTML text, chart tick/tooltip string formatters, aria-labels).
 */

interface FormatOptions {
  minimumFractionDigits?: number;
  maximumFractionDigits?: number;
}

/** Formatted amount WITHOUT any currency mark, Western digits (e.g. "1,880"). Pair with <RiyalSymbol />. */
export function formatSAR(amount: number | null | undefined, opts?: FormatOptions): string {
  return new Intl.NumberFormat('en-US', {
    minimumFractionDigits: opts?.minimumFractionDigits ?? 0,
    maximumFractionDigits: opts?.maximumFractionDigits ?? 2,
  }).format(amount ?? 0);
}

/** Text fallback "<amount> ر.س" for non-JSX contexts where the SVG can't render. */
export function formatSARText(amount: number | null | undefined, opts?: FormatOptions): string {
  return `${formatSAR(amount, opts)} ر.س`;
}
