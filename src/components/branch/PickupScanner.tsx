import { useState, useEffect, useRef } from 'react';
import { Html5Qrcode } from 'html5-qrcode';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  Camera,
  CameraOff,
  QrCode,
  CheckCircle2,
  XCircle,
  Package,
  User,
  Receipt,
  Loader2,
  Search,
} from 'lucide-react';
import { useOrderByPickupCode, useProcessPickup } from '@/hooks/usePickupBarcode';
import { cn } from '@/lib/utils';
import { RiyalSymbol } from '@/components/ui/riyal';

export function PickupScanner() {
  const [isScanning, setIsScanning] = useState(false);
  const [scannedCode, setScannedCode] = useState<string | null>(null);
  const [manualCode, setManualCode] = useState('');
  const [scannerError, setScannerError] = useState<string | null>(null);
  const scannerRef = useRef<Html5Qrcode | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  
  const { data: orderDetails, isLoading: isLoadingOrder } = useOrderByPickupCode(scannedCode);
  const processPickup = useProcessPickup();

  // Cleanup scanner on unmount
  useEffect(() => {
    return () => {
      if (scannerRef.current?.isScanning) {
        scannerRef.current.stop().catch(console.error);
      }
    };
  }, []);

  const startScanner = async () => {
    setScannerError(null);
    
    try {
      if (!scannerRef.current) {
        scannerRef.current = new Html5Qrcode('qr-reader');
      }

      await scannerRef.current.start(
        { facingMode: 'environment' },
        {
          fps: 10,
          qrbox: { width: 250, height: 250 },
        },
        (decodedText) => {
          setScannedCode(decodedText);
          stopScanner();
        },
        () => {
          // Ignore scan errors (no QR detected)
        }
      );
      
      setIsScanning(true);
    } catch (err) {
      console.error('Scanner error:', err);
      setScannerError('لم نتمكن من الوصول للكاميرا. يرجى السماح بالوصول أو استخدام الإدخال اليدوي.');
    }
  };

  const stopScanner = async () => {
    if (scannerRef.current?.isScanning) {
      await scannerRef.current.stop();
    }
    setIsScanning(false);
  };

  const handleManualSearch = () => {
    if (manualCode.trim()) {
      setScannedCode(manualCode.trim());
    }
  };

  const handleConfirmPickup = async () => {
    if (!scannedCode) return;
    
    try {
      await processPickup.mutateAsync(scannedCode);
      // Reset state after successful pickup
      setScannedCode(null);
      setManualCode('');
    } catch {
      // Error handled in mutation
    }
  };

  const resetScan = () => {
    setScannedCode(null);
    setManualCode('');
  };

  return (
    <div className="space-y-6">
      {/* Scanner Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <QrCode className="w-5 h-5 text-primary" />
            مسح كود الاستلام
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Camera Scanner */}
          <div
            ref={containerRef}
            className={cn(
              "relative rounded-xl overflow-hidden bg-muted",
              isScanning ? "aspect-square max-w-sm mx-auto" : "h-48 flex items-center justify-center"
            )}
          >
            <div id="qr-reader" className={cn(!isScanning && "hidden")} />
            
            {!isScanning && (
              <div className="text-center space-y-4">
                <Camera className="w-12 h-12 text-muted-foreground mx-auto" />
                <p className="text-sm text-muted-foreground">
                  اضغط لبدء المسح
                </p>
              </div>
            )}
          </div>

          {scannerError && (
            <Alert variant="destructive">
              <AlertDescription>{scannerError}</AlertDescription>
            </Alert>
          )}

          <div className="flex gap-2">
            {!isScanning ? (
              <Button onClick={startScanner} className="flex-1">
                <Camera className="w-4 h-4 me-2" />
                بدء المسح
              </Button>
            ) : (
              <Button onClick={stopScanner} variant="outline" className="flex-1">
                <CameraOff className="w-4 h-4 me-2" />
                إيقاف المسح
              </Button>
            )}
          </div>

          <Separator />

          {/* Manual Code Entry */}
          <div className="space-y-2">
            <p className="text-sm text-muted-foreground">أو أدخل الكود يدوياً:</p>
            <div className="flex gap-2">
              <Input
                placeholder="PU-XXXXXXXX-XXXX"
                value={manualCode}
                onChange={(e) => setManualCode(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleManualSearch()}
                dir="ltr"
              />
              <Button onClick={handleManualSearch} variant="secondary">
                <Search className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Order Details Section */}
      {scannedCode && (
        <Card className={cn(
          "transition-all",
          orderDetails?.can_process 
            ? "border-primary/50 bg-primary/5" 
            : orderDetails?.error_message 
              ? "border-destructive/50 bg-destructive/5"
              : ""
        )}>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span className="flex items-center gap-2">
                <Package className="w-5 h-5" />
                تفاصيل الطلب
              </span>
              <Button variant="ghost" size="sm" onClick={resetScan}>
                مسح جديد
              </Button>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {isLoadingOrder ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
              </div>
            ) : orderDetails ? (
              <div className="space-y-4">
                {orderDetails.error_message && (
                  <Alert variant="destructive">
                    <XCircle className="w-4 h-4" />
                    <AlertDescription>{orderDetails.error_message}</AlertDescription>
                  </Alert>
                )}

                {orderDetails.order_number && (
                  <>
                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground">رقم الطلب</span>
                      <span className="font-bold text-lg">{orderDetails.order_number}</span>
                    </div>

                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground flex items-center gap-1">
                        <User className="w-4 h-4" />
                        العميل
                      </span>
                      <span>{orderDetails.customer_name}</span>
                    </div>

                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground">الحالة</span>
                      <Badge variant={orderDetails.status === 'ready_for_pickup' ? 'default' : 'secondary'}>
                        {orderDetails.status === 'ready_for_pickup' ? 'جاهز للاستلام' : 
                         orderDetails.status === 'completed' ? 'تم الاستلام' : orderDetails.status}
                      </Badge>
                    </div>

                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground">الفرع</span>
                      <span>{orderDetails.branch_name}</span>
                    </div>

                    <Separator />

                    {/* Order Items */}
                    <div className="space-y-2">
                      <div className="flex items-center gap-1 text-muted-foreground">
                        <Receipt className="w-4 h-4" />
                        المنتجات
                      </div>
                      {Array.isArray(orderDetails.items) && orderDetails.items.map((item: { product_name: string; quantity: number; total_price: number }, idx: number) => (
                        <div key={idx} className="flex justify-between text-sm bg-muted/50 p-2 rounded">
                          <span>{item.product_name} × {item.quantity}</span>
                          <span>{item.total_price} <RiyalSymbol /></span>
                        </div>
                      ))}
                    </div>

                    <div className="flex justify-between items-center font-bold text-lg pt-2">
                      <span>الإجمالي</span>
                      <span className="text-primary">{orderDetails.total_amount} <RiyalSymbol /></span>
                    </div>

                    {orderDetails.can_process && (
                      <Button
                        onClick={handleConfirmPickup}
                        className="w-full"
                        variant="default"
                        size="lg"
                        disabled={processPickup.isPending}
                      >
                        {processPickup.isPending ? (
                          <Loader2 className="w-5 h-5 animate-spin me-2" />
                        ) : (
                          <CheckCircle2 className="w-5 h-5 me-2" />
                        )}
                        تأكيد الاستلام
                      </Button>
                    )}
                  </>
                )}
              </div>
            ) : (
              <Alert variant="destructive">
                <XCircle className="w-4 h-4" />
                <AlertDescription>كود غير صالح أو الطلب غير موجود</AlertDescription>
              </Alert>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
