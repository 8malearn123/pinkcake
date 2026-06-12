import { QRCodeSVG } from 'qrcode.react';
import { useHandoverBarcode, useGenerateHandoverBarcode } from '@/hooks/useHandoverBarcodes';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Loader2, QrCode, RefreshCw } from 'lucide-react';

interface HandoverBarcodeDisplayProps {
  orderId: string;
  barcodeType: 'kitchen_handover' | 'branch_handover' | 'customer_delivery';
  title: string;
  description: string;
  canGenerate?: boolean;
}

export function HandoverBarcodeDisplay({
  orderId,
  barcodeType,
  title,
  description,
  canGenerate = false,
}: HandoverBarcodeDisplayProps) {
  const { data: barcodeCode, isLoading, refetch } = useHandoverBarcode(orderId, barcodeType);
  const generateBarcode = useGenerateHandoverBarcode();

  const handleGenerate = async () => {
    await generateBarcode.mutateAsync({ orderId, barcodeType });
    refetch();
  };

  if (isLoading) {
    return (
      <Card className="p-6 text-center">
        <Loader2 className="w-8 h-8 animate-spin mx-auto text-muted-foreground" />
      </Card>
    );
  }

  if (!barcodeCode && canGenerate) {
    return (
      <Card className="p-6 text-center space-y-4">
        <QrCode className="w-12 h-12 mx-auto text-muted-foreground" />
        <div>
          <h3 className="font-semibold">{title}</h3>
          <p className="text-sm text-muted-foreground">{description}</p>
        </div>
        <Button 
          onClick={handleGenerate}
          disabled={generateBarcode.isPending}
          className="gradient-pink text-white"
        >
          {generateBarcode.isPending && <Loader2 className="w-4 h-4 me-2 animate-spin" />}
          إنشاء باركود التسليم
        </Button>
      </Card>
    );
  }

  if (!barcodeCode) {
    return null;
  }

  return (
    <Card className="p-6 text-center space-y-4">
      <div>
        <h3 className="font-semibold text-lg">{title}</h3>
        <p className="text-sm text-muted-foreground">{description}</p>
      </div>
      
      <div className="bg-white p-4 rounded-xl inline-block mx-auto border-2 border-primary/20">
        <QRCodeSVG
          value={barcodeCode}
          size={200}
          level="H"
          includeMargin
        />
      </div>
      
      <div className="bg-muted p-2 rounded-lg">
        <code className="text-xs font-mono break-all">{barcodeCode}</code>
      </div>
      
      <Button
        variant="outline"
        size="sm"
        onClick={() => refetch()}
      >
        <RefreshCw className="w-4 h-4 me-1" />
        تحديث
      </Button>
    </Card>
  );
}
