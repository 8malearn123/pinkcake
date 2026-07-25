/**
 * Honest low-stock pill. Renders ONLY when stock is a real, small positive
 * integer (0 < stock ≤ 5) — never a fabricated count. A null/untracked stock
 * renders nothing; stock === 0 is handled by the sold-out overlay elsewhere.
 */
export function LowStockBadge({ stock }: { stock?: number | null }) {
  if (stock == null || stock <= 0 || stock > 5) return null;
  return (
    <span className="inline-flex items-center px-2 py-0.5 rounded-full bg-primary/10 text-primary border border-primary/20 text-[10px] font-medium">
      بقي {stock} فقط
    </span>
  );
}
