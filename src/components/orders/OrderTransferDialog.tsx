import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { useBranches } from '@/hooks/useBranches';
import { useTransferOrder } from '@/hooks/useOrderNotes';
import { Loader2, ArrowLeftRight } from 'lucide-react';

interface OrderTransferDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  orderId: string;
  currentBranchId?: string | null;
}

export function OrderTransferDialog({
  open,
  onOpenChange,
  orderId,
  currentBranchId,
}: OrderTransferDialogProps) {
  const [selectedBranchId, setSelectedBranchId] = useState<string>('');
  const { data: branches, isLoading: branchesLoading } = useBranches();
  const transferOrder = useTransferOrder();

  const availableBranches = branches?.filter((b) => b.id !== currentBranchId);

  const handleTransfer = async () => {
    if (!selectedBranchId) return;
    
    await transferOrder.mutateAsync({
      orderId,
      toBranchId: selectedBranchId,
    });
    
    setSelectedBranchId('');
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <ArrowLeftRight className="w-5 h-5" />
            نقل الطلب
          </DialogTitle>
          <DialogDescription>
            اختر الفرع الذي تريد نقل الطلب إليه
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">الفرع المستهدف</label>
            <Select value={selectedBranchId} onValueChange={setSelectedBranchId}>
              <SelectTrigger>
                <SelectValue placeholder="اختر الفرع" />
              </SelectTrigger>
              <SelectContent>
                {branchesLoading ? (
                  <div className="flex items-center justify-center py-2">
                    <Loader2 className="w-4 h-4 animate-spin" />
                  </div>
                ) : (
                  availableBranches?.map((branch) => (
                    <SelectItem key={branch.id} value={branch.id}>
                      {branch.name}
                    </SelectItem>
                  ))
                )}
              </SelectContent>
            </Select>
          </div>

          <div className="flex gap-2 justify-end">
            <Button
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              إلغاء
            </Button>
            <Button
              onClick={handleTransfer}
              disabled={!selectedBranchId || transferOrder.isPending}
            >
              {transferOrder.isPending && <Loader2 className="w-4 h-4 ml-1 animate-spin" />}
              نقل الطلب
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
