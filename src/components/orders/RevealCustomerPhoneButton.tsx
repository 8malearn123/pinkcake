import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Phone, Loader2, Eye, EyeOff } from 'lucide-react';
import { useGetCustomerPhone } from '@/hooks/useAuditedPhoneAccess';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';

interface RevealCustomerPhoneButtonProps {
  customerId: string;
  orderId?: string;
  customerName?: string;
}

export function RevealCustomerPhoneButton({ 
  customerId, 
  orderId, 
  customerName 
}: RevealCustomerPhoneButtonProps) {
  const [phone, setPhone] = useState<string | null>(null);
  const [isRevealed, setIsRevealed] = useState(false);
  const getPhone = useGetCustomerPhone();

  const handleReveal = async () => {
    if (isRevealed) {
      setIsRevealed(false);
      setPhone(null);
      return;
    }

    const result = await getPhone.mutateAsync({
      customerId,
      orderId,
      justification: `Viewing phone for customer: ${customerName || customerId}`,
    });

    if (result) {
      setPhone(result);
      setIsRevealed(true);
    }
  };

  if (isRevealed && phone) {
    return (
      <div className="flex items-center gap-2">
        <span className="font-medium" dir="ltr">{phone}</span>
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon" aria-label="إظهار رقم الجوال"
                className="h-6 w-6"
                onClick={handleReveal}
              >
                <EyeOff className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>إخفاء الرقم</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </div>
    );
  }

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            variant="outline"
            size="sm"
            className="gap-1"
            onClick={handleReveal}
            disabled={getPhone.isPending}
          >
            {getPhone.isPending ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <>
                <Eye className="h-4 w-4" />
                <Phone className="h-4 w-4" />
              </>
            )}
            <span>عرض رقم الجوال</span>
          </Button>
        </TooltipTrigger>
        <TooltipContent>
          <p>سيتم تسجيل هذا الوصول للمراجعة الأمنية</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
