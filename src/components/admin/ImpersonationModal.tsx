import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useImpersonation } from '@/contexts/ImpersonationContext';
import { Loader2, Shield, UserCog } from 'lucide-react';

interface ImpersonationModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  targetUser: {
    id: string;
    fullName: string | null;
  } | null;
}

export function ImpersonationModal({ open, onOpenChange, targetUser }: ImpersonationModalProps) {
  const [secretCode, setSecretCode] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { startImpersonation } = useImpersonation();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!targetUser || !secretCode.trim()) return;

    setIsLoading(true);
    try {
      const success = await startImpersonation(targetUser.id, secretCode.trim());
      if (success) {
        setSecretCode('');
        onOpenChange(false);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleClose = () => {
    setSecretCode('');
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md" dir="rtl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
              <UserCog className="w-5 h-5 text-primary" />
            </div>
            <span>التحكم الإداري</span>
          </DialogTitle>
          <DialogDescription>
            أنت على وشك الدخول كمستخدم{' '}
            <span className="font-semibold text-foreground">
              {targetUser?.fullName || 'غير معروف'}
            </span>
            . أدخل الرمز السري للمتابعة.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="secretCode" className="flex items-center gap-2">
              <Shield className="w-4 h-4 text-muted-foreground" />
              أدخل الرمز السري للتحكم الإداري
            </Label>
            <Input
              id="secretCode"
              type="password"
              value={secretCode}
              onChange={(e) => setSecretCode(e.target.value)}
              placeholder="••••"
              className="text-center text-lg tracking-widest"
              autoComplete="off"
              autoFocus
              disabled={isLoading}
            />
          </div>

          <div className="bg-muted/50 rounded-lg p-3 text-sm text-muted-foreground">
            <p className="font-medium text-foreground mb-1">تنبيه أمني:</p>
            <ul className="list-disc list-inside space-y-1 text-xs">
              <li>سيتم تسجيل هذا الإجراء في سجل المراقبة</li>
              <li>ستكون صلاحياتك محدودة بصلاحيات المستخدم المحدد</li>
              <li>لن تتمكن من تغيير إعدادات النظام أثناء التحكم</li>
            </ul>
          </div>

          <DialogFooter className="gap-2 sm:gap-0">
            <Button type="button" variant="outline" onClick={handleClose} disabled={isLoading}>
              إلغاء
            </Button>
            <Button type="submit" disabled={isLoading || !secretCode.trim()}>
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 me-2 animate-spin" />
                  جاري التحقق...
                </>
              ) : (
                'بدء التحكم'
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
