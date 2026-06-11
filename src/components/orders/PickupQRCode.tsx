import { QRCodeSVG } from 'qrcode.react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { QrCode, AlertCircle } from 'lucide-react';
import { useMyPickupCode } from '@/hooks/usePickupBarcode';

interface PickupQRCodeProps {
  orderId: string;
  orderStatus: string;
}

export function PickupQRCode({ orderId, orderStatus }: PickupQRCodeProps) {
  const { data: pickupCode, isLoading, error } = useMyPickupCode(orderId);
  
  // Only show for ready_for_pickup status
  if (orderStatus !== 'ready_for_pickup') {
    return null;
  }
  
  if (isLoading) {
    return (
      <Card className="border-primary/20 bg-primary/5">
        <CardContent className="p-6 flex flex-col items-center gap-4">
          <Skeleton className="w-48 h-48" />
          <Skeleton className="w-32 h-4" />
        </CardContent>
      </Card>
    );
  }
  
  if (error || !pickupCode) {
    return (
      <Card className="border-destructive/20 bg-destructive/5">
        <CardContent className="p-6 flex flex-col items-center gap-2 text-center">
          <AlertCircle className="w-8 h-8 text-destructive" />
          <p className="text-sm text-destructive">
            لم نتمكن من تحميل كود الاستلام
          </p>
        </CardContent>
      </Card>
    );
  }
  
  return (
    <Card className="border-primary/30 bg-gradient-to-br from-primary/5 to-primary/10">
      <CardContent className="p-6 flex flex-col items-center gap-4">
        <div className="flex items-center gap-2 text-primary">
          <QrCode className="w-5 h-5" />
          <span className="font-bold">كود الاستلام</span>
        </div>
        
        <Badge variant="default">
          جاهز للاستلام
        </Badge>
        
        <div className="bg-white p-4 rounded-xl shadow-md">
          <QRCodeSVG
            value={pickupCode}
            size={180}
            level="H"
            includeMargin
            bgColor="#ffffff"
            fgColor="#000000"
          />
        </div>
        
        <div className="text-center space-y-2">
          <p className="text-sm font-mono bg-muted px-3 py-1 rounded">
            {pickupCode}
          </p>
          <p className="text-sm text-muted-foreground">
            يرجى إبراز هذا الباركود عند الاستلام من الفرع
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
