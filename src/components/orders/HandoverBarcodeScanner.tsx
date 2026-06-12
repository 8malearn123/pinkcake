import { useState, useEffect } from 'react';
import { Html5QrcodeScanner } from 'html5-qrcode';
import { useScanHandoverBarcode } from '@/hooks/useHandoverBarcodes';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { 
  ScanLine, 
  Loader2, 
  CheckCircle2, 
  XCircle, 
  Keyboard 
} from 'lucide-react';

interface HandoverBarcodeScannerProps {
  title: string;
  description: string;
  expectedBarcodeTypes: string[];
  onScanSuccess?: (result: { order_number: string; barcode_type: string }) => void;
}

export function HandoverBarcodeScanner({
  title,
  description,
  expectedBarcodeTypes,
  onScanSuccess,
}: HandoverBarcodeScannerProps) {
  const [showManualInput, setShowManualInput] = useState(false);
  const [manualCode, setManualCode] = useState('');
  const [scanResult, setScanResult] = useState<'success' | 'error' | null>(null);
  const [scanMessage, setScanMessage] = useState('');
  
  const scanBarcode = useScanHandoverBarcode();

  useEffect(() => {
    let scanner: Html5QrcodeScanner | null = null;
    
    if (!showManualInput) {
      scanner = new Html5QrcodeScanner(
        'handover-qr-reader',
        { 
          fps: 10, 
          qrbox: { width: 250, height: 250 },
          aspectRatio: 1,
        },
        false
      );

      scanner.render(
        async (decodedText) => {
          // Check if barcode type matches expected types
          const isValidType = expectedBarcodeTypes.some(type => 
            decodedText.toUpperCase().includes(type.toUpperCase().replace('_', '-'))
          );
          
          if (!isValidType) {
            setScanResult('error');
            setScanMessage('نوع الباركود غير متوقع لهذه العملية');
            return;
          }
          
          try {
            const result = await scanBarcode.mutateAsync(decodedText);
            setScanResult('success');
            setScanMessage(`تم تأكيد تسليم الطلب ${result.order_number}`);
            onScanSuccess?.(result as { order_number: string; barcode_type: string });
          } catch (error) {
            setScanResult('error');
            setScanMessage((error as Error).message);
          }
        },
        (error) => {
          // Scan error - ignore, user is still scanning
        }
      );
    }

    return () => {
      if (scanner) {
        scanner.clear().catch(console.error);
      }
    };
  }, [showManualInput, expectedBarcodeTypes]);

  const handleManualSubmit = async () => {
    if (!manualCode.trim()) return;
    
    try {
      const result = await scanBarcode.mutateAsync(manualCode.trim());
      setScanResult('success');
      setScanMessage(`تم تأكيد تسليم الطلب ${result.order_number}`);
      setManualCode('');
      onScanSuccess?.(result as { order_number: string; barcode_type: string });
    } catch (error) {
      setScanResult('error');
      setScanMessage((error as Error).message);
    }
  };

  const resetScan = () => {
    setScanResult(null);
    setScanMessage('');
  };

  return (
    <Card className="p-6 space-y-4">
      <div className="text-center">
        <ScanLine className="w-10 h-10 mx-auto text-primary mb-2" />
        <h3 className="font-semibold text-lg">{title}</h3>
        <p className="text-sm text-muted-foreground">{description}</p>
      </div>

      {scanResult && (
        <div className={`p-4 rounded-lg flex items-center gap-3 ${
          scanResult === 'success' 
            ? 'bg-green-50 border border-green-200' 
            : 'bg-red-50 border border-red-200'
        }`}>
          {scanResult === 'success' ? (
            <CheckCircle2 className="w-6 h-6 text-green-600 flex-shrink-0" />
          ) : (
            <XCircle className="w-6 h-6 text-red-600 flex-shrink-0" />
          )}
          <div className="flex-1">
            <p className={scanResult === 'success' ? 'text-green-800' : 'text-red-800'}>
              {scanMessage}
            </p>
          </div>
          <Button variant="ghost" size="sm" onClick={resetScan}>
            مسح آخر
          </Button>
        </div>
      )}

      {!showManualInput ? (
        <div className="space-y-4">
          <div id="handover-qr-reader" className="rounded-lg overflow-hidden" />
          
          <Button
            variant="outline"
            className="w-full"
            onClick={() => setShowManualInput(true)}
          >
            <Keyboard className="w-4 h-4 me-2" />
            إدخال الكود يدوياً
          </Button>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="space-y-2">
            <Label>كود الباركود</Label>
            <Input
              value={manualCode}
              onChange={(e) => setManualCode(e.target.value)}
              placeholder="أدخل كود الباركود..."
              dir="ltr"
            />
          </div>
          
          <div className="flex gap-2">
            <Button
              onClick={handleManualSubmit}
              disabled={!manualCode.trim() || scanBarcode.isPending}
              className="flex-1"
            >
              {scanBarcode.isPending && <Loader2 className="w-4 h-4 me-2 animate-spin" />}
              تأكيد
            </Button>
            <Button
              variant="outline"
              onClick={() => setShowManualInput(false)}
            >
              العودة للكاميرا
            </Button>
          </div>
        </div>
      )}
    </Card>
  );
}
