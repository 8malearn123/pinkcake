import { UserWithRole, useAssignBranch, useRemoveBranchAssignment, useUsers } from '@/hooks/useUsers';
import { useBranches } from '@/hooks/useBranches';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Loader2, X } from 'lucide-react';
import { useState } from 'react';

interface BranchAssignmentDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  user: UserWithRole | null;
}

export function BranchAssignmentDialog({
  open,
  onOpenChange,
  user,
}: BranchAssignmentDialogProps) {
  const { data: branches, isLoading: branchesLoading } = useBranches();
  const assignBranch = useAssignBranch();
  const removeBranchAssignment = useRemoveBranchAssignment();
  const [selectedBranch, setSelectedBranch] = useState<string>('');
  // Re-derive from the live query so the dialog reflects assign/remove
  // immediately after refetch (the `user` prop is a snapshot from open time).
  const { data: users } = useUsers();
  const liveUser = users?.find((u) => u.id === user?.id) ?? user;

  if (!liveUser) return null;

  const currentBranch = liveUser.user_branch_assignments[0];
  const isLoading = assignBranch.isPending || removeBranchAssignment.isPending;

  const handleAssign = () => {
    if (selectedBranch) {
      assignBranch.mutate(
        { userId: liveUser.id, branchId: selectedBranch },
        { onSuccess: () => setSelectedBranch('') }
      );
    }
  };

  const handleRemove = () => {
    removeBranchAssignment.mutate(liveUser.id);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>تعيين فرع للمستخدم</DialogTitle>
          <DialogDescription>
            {liveUser.full_name || 'المستخدم'}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Current Branch */}
          {currentBranch && (
            <div>
              <p className="text-sm font-medium mb-2">الفرع الحالي</p>
              <div className="flex items-center justify-between p-3 rounded-lg border bg-muted/50">
                <span>{currentBranch.branch_name || 'فرع غير معروف'}</span>
                <Button
                  variant="ghost"
                  size="icon" aria-label="إزالة الفرع"
                  className="h-8 w-8 text-destructive hover:text-destructive"
                  onClick={handleRemove}
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <X className="h-4 w-4" />
                  )}
                </Button>
              </div>
            </div>
          )}

          {/* Assign Branch */}
          <div>
            <p className="text-sm font-medium mb-2">
              {currentBranch ? 'تغيير الفرع' : 'تعيين فرع'}
            </p>
            {branchesLoading ? (
              <div className="flex items-center justify-center py-4">
                <Loader2 className="h-6 w-6 animate-spin text-primary" />
              </div>
            ) : branches && branches.length > 0 ? (
              <div className="flex gap-2">
                <Select value={selectedBranch} onValueChange={setSelectedBranch}>
                  <SelectTrigger className="flex-1">
                    <SelectValue placeholder="اختر فرع..." />
                  </SelectTrigger>
                  <SelectContent className="bg-popover border shadow-md">
                    {branches.map((branch) => (
                      <SelectItem key={branch.id} value={branch.id}>
                        {branch.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Button onClick={handleAssign} disabled={!selectedBranch || isLoading}>
                  {isLoading && <Loader2 className="h-4 w-4 me-2 animate-spin" />}
                  تعيين
                </Button>
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">
                لا توجد فروع. قم بإضافة فروع أولاً.
              </p>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
