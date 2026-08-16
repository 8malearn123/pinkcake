import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { GoldRule } from '@/components/ds';
import { RiyalSymbol } from '@/components/ui/riyal';
import { toArabicDigits } from '@/lib/arabicNumerals';
import type { OrderLine } from '@/hooks/useOrderItemLines';
import { cn } from '@/lib/utils';

/**
 * The money — present, but not the subject.
 *
 * The trigger row shows the grand total, so collapsing hides nothing the
 * customer is looking for; it just stops a per-item price table from being the
 * loudest thing on a page about a cake.
 */
export function OrderInvoicePanel({
  lines,
  totalAmount,
  paymentStatus,
  className,
}: {
  lines: OrderLine[];
  totalAmount: number;
  paymentStatus?: string | null;
  className?: string;
}) {
  if (lines.length === 0) return null;

  return (
    <Accordion type="single" collapsible className={cn('glass-card rounded-2xl px-5', className)}>
      <AccordionItem value="invoice" className="border-0">
        <AccordionTrigger className="py-4 hover:no-underline">
          <span className="flex w-full items-center justify-between gap-3 pe-3">
            <span className="font-bold">الفاتورة</span>
            <span className="text-lg font-black text-primary">
              {toArabicDigits(totalAmount)} <RiyalSymbol className="text-sm text-muted-foreground" />
            </span>
          </span>
        </AccordionTrigger>

        <AccordionContent>
          {lines.map((line, index) => (
            <div
              key={line.id ?? `${line.product_name}-${index}`}
              className="flex items-start justify-between gap-4 py-2 text-sm"
            >
              <div className="min-w-0">
                <p className="font-medium">{line.product_name}</p>
                {/*
                  <bdi dir="ltr"> is load-bearing: in an RTL paragraph the neutral
                  × between two numeric runs takes the paragraph direction, so
                  "2 × 145" rendered visually as "145 × 2" — i.e. quantity 145 at
                  2 riyal. The isolate pins the whole run to LTR.
                */}
                <p className="text-xs text-muted-foreground">
                  <bdi dir="ltr">
                    {toArabicDigits(line.quantity)} × {toArabicDigits(line.unit_price ?? 0)}
                  </bdi>{' '}
                  <RiyalSymbol className="text-[10px]" label="" />
                </p>
              </div>
              <span className="shrink-0 font-medium">
                {toArabicDigits(line.total_price ?? 0)}{' '}
                <RiyalSymbol className="text-[10px] text-muted-foreground" label="" />
              </span>
            </div>
          ))}

          <GoldRule className="my-3" />

          <div className="flex items-baseline justify-between gap-3">
            <span className="font-bold">المجموع الكلي</span>
            <span className="text-2xl font-black leading-none text-primary">
              {toArabicDigits(totalAmount)} <RiyalSymbol className="text-sm text-muted-foreground" />
            </span>
          </div>

          {/* Paid is the expected state — silence is the clarity. */}
          {paymentStatus === 'pending' && (
            <p className="mt-3 text-xs text-muted-foreground">
              بانتظار الدفع — نتواصل معك لإكمال الطلب.
            </p>
          )}
        </AccordionContent>
      </AccordionItem>
    </Accordion>
  );
}
