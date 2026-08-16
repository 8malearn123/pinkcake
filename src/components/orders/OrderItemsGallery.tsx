import type { ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { Cake } from 'lucide-react';
import { Chip, Eyebrow, PhotoTile, Title } from '@/components/ds';
import { Reveal } from '@/components/Reveal';
import { toArabicDigits } from '@/lib/arabicNumerals';
import type { OrderLine } from '@/hooks/useOrderItemLines';
import { cn } from '@/lib/utils';

/**
 * The cake, not a manifest.
 *
 * The order pages previously rendered their items as label/value rows with a
 * price at the end — the shopping equivalent of a packing slip. For a cake shop
 * the product is the emotional payload, so it is photography, it is never
 * behind a disclosure, and it carries no prices (those live in the invoice).
 *
 * A matched line links back into the catalogue, so the order page keeps the
 * browsing journey open. An unmatched one gets the branded blush well rather
 * than a broken image — expected on a meaningful minority of real orders.
 */

function LineFrame({ line, children, className }: { line: OrderLine; children: ReactNode; className?: string }) {
  const classes = cn('group relative block overflow-hidden rounded-2xl', className);
  return line.product ? (
    <Link to={`/product/${line.product.id}`} className={classes}>
      {children}
    </Link>
  ) : (
    <div className={classes}>{children}</div>
  );
}

const FALLBACK = <Cake size={56} strokeWidth={1.25} className="text-rose/40" />;

export function OrderItemsGallery({ lines, className }: { lines: OrderLine[]; className?: string }) {
  if (lines.length === 0) return null;

  const single = lines.length === 1;

  return (
    <section className={className}>
      <Eyebrow>ما طلبته</Eyebrow>
      <Title variant="h2" className="mt-2">
        كيكتك
      </Title>

      {single ? (
        <LineFrame line={lines[0]} className="mt-6">
          <PhotoTile
            src={lines[0].product?.image_url}
            alt={lines[0].product_name}
            ratio="wide"
            scrim="strong"
            fallback={FALLBACK}
          >
            {lines[0].quantity > 1 && (
              <Chip tone="glass" className="absolute top-3 end-3">
                <bdi dir="ltr">×{toArabicDigits(lines[0].quantity)}</bdi>
              </Chip>
            )}
            <span className="absolute inset-x-0 bottom-0 p-5 text-xl font-black text-white">
              {lines[0].product_name}
            </span>
          </PhotoTile>
        </LineFrame>
      ) : (
        <Reveal className="reveal-grid mt-6 grid grid-cols-2 gap-3 sm:gap-5">
          {lines.map((line, index) => (
            <div key={line.id ?? `${line.product_name}-${index}`}>
              <LineFrame line={line}>
                <PhotoTile
                  src={line.product?.image_url}
                  alt={line.product_name}
                  ratio="card"
                  scrim="soft"
                  fallback={FALLBACK}
                />
              </LineFrame>
              <p className="mt-3 text-sm font-bold leading-snug">{line.product_name}</p>
              <p className="text-xs text-muted-foreground">
                <bdi dir="ltr">×{toArabicDigits(line.quantity)}</bdi>
              </p>
            </div>
          ))}
        </Reveal>
      )}
    </section>
  );
}
