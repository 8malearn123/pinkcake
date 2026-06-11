import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Phone, Loader2, Eye, EyeOff } from 'lucide-react';
import { useGetProfilePhone } from '@/hooks/useAuditedPhoneAccess';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';

interface RevealPhoneButtonProps {
  profileId: string;
  userName?: string;
}

export function RevealPhoneButton({ profileId, userName }: RevealPhoneButtonProps) {
  const [phone, setPhone] = useState<string | null>(null);
  const [isRevealed, setIsRevealed] = useState(false);
  const getPhone = useGetProfilePhone();

  const handleReveal = async () => {
    if (isRevealed) {
      setIsRevealed(false);
      setPhone(null);
      return;
    }

    const result = await getPhone.mutateAsync({
      profileId,
      justification: `Viewing phone for user: ${userName || profileId}`,
    });

    if (result) {
      setPhone(result);
      setIsRevealed(true);
    }
  };

  if (isRevealed && phone) {
    return (
      <div className="flex items-center gap-2">
        <span className="text-sm font-medium" dir="ltr">{phone}</span>
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="h-6 w-6"
                onClick={handleReveal}
              >
                <EyeOff className="h-3 w-3" />
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
            variant="ghost"
            size="sm"
            className="h-7 gap-1 text-xs text-muted-foreground hover:text-foreground"
            onClick={handleReveal}
            disabled={getPhone.isPending}
          >
            {getPhone.isPending ? (
              <Loader2 className="h-3 w-3 animate-spin" />
            ) : (
              <>
                <Eye className="h-3 w-3" />
                <Phone className="h-3 w-3" />
              </>
            )}
            <span>عرض الرقم</span>
          </Button>
        </TooltipTrigger>
        <TooltipContent>
          <p>سيتم تسجيل هذا الوصول للمراجعة</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
