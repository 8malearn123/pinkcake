import { QRCodeSVG } from 'qrcode.react';
import { Skeleton } from '@/components/ui/skeleton';
import { Eyebrow, ErrorState } from '@/components/ds';
import { useMyPickupCode } from '@/hooks/usePickupBarcode';

interface PickupQRCodeProps {
  orderId: string;
  orderStatus: string;
  orderNumber: string;
}

/**
 * The collection pass — shown only once the order is waiting at the branch, and
 * placed directly under the hero so it is the first thing after the answer.
 */
export function PickupQRCode({ orderId, orderStatus, orderNumber }: PickupQRCodeProps) {
  const { data: pickupCode, isLoading, error, refetch } = useMyPickupCode(orderId);

  if (orderStatus !== 'ready_for_pickup') {
    return null;
  }

  if (isLoading) {
    return (
      <div className="glass-card rounded-2xl p-6 text-center">
        <Skeleton className="mx-auto size-48 rounded-xl" />
        <Skeleton className="mx-auto mt-4 h-4 w-32" />
      </div>
    );
  }

  // A failure here must never block collection — fall back to the order number,
  // which the cashier can look the order up by.
  if (error || !pickupCode) {
    return (
      <div className="glass-card rounded-2xl p-6 text-center">
        <ErrorState
          title="ما قدرنا نعرض رمز الاستلام"
          description="اذكر رقم طلبك عند الكاشير وبنجهّزه لك."
          onRetry={() => refetch()}
          retryLabel="جرّب مرة ثانية"
          className="py-4"
        />
        <bdi dir="ltr" className="mt-2 block text-2xl font-semibold text-primary">
          {orderNumber}
        </bdi>
      </div>
    );
  }

  return (
    <div className="glass-card rounded-2xl p-6 text-center">
      <Eyebrow rule="both" caps className="justify-center">
        رمز الاستلام
      </Eyebrow>

      <div
        role="img"
        aria-label="رمز استلام الطلب"
        className="mx-auto mt-4 w-fit rounded-xl border border-border p-4"
      >
        {/*
          Hex, not tokens: a QR must be true black on true white to scan
          reliably. `includeMargin` supplies the white quiet zone, so the
          wrapper needs no bg-white of its own.
        */}
        <QRCodeSVG
          value={pickupCode}
          size={180}
          level="H"
          includeMargin
          bgColor="#ffffff"
          fgColor="#000000"
        />
      </div>

      <p className="mt-4">
        <bdi dir="ltr" className="rounded bg-muted px-3 py-1 font-mono text-lg tracking-widest">
          {pickupCode}
        </bdi>
      </p>
      <p className="mt-3 text-sm text-muted-foreground">
        اعرض هذا الرمز عند الكاشير، وكيكتك بانتظارك.
      </p>
    </div>
  );
}
