import { UserWithRole, ROLE_LABELS, ROLE_COLORS, useAssignRole, useRemoveRole } from '@/hooks/useUsers';
import { Enums } from '@/integrations/supabase/types';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Plus, X, Loader2 } from 'lucide-react';

type AppRole = Enums<'app_role'>;

const ALL_ROLES: AppRole[] = ['admin', 'call_center', 'kitchen', 'branch', 'driver', 'customer_support', 'customer'];

interface RoleManagerDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  user: UserWithRole | null;
}

export function RoleManagerDialog({
  open,
  onOpenChange,
  user,
}: RoleManagerDialogProps) {
  const assignRole = useAssignRole();
  const removeRole = useRemoveRole();

  if (!user) return null;

  const userRoles = user.user_roles.map((ur) => ur.role as AppRole);
  const availableRoles = ALL_ROLES.filter((role) => !userRoles.includes(role));

  const handleAddRole = (role: AppRole) => {
    assignRole.mutate({ userId: user.id, role });
  };

  const handleRemoveRole = (role: AppRole) => {
    removeRole.mutate({ userId: user.id, role });
  };

  const isLoading = assignRole.isPending || removeRole.isPending;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>إدارة أدوار المستخدم</DialogTitle>
          <DialogDescription>
            {user.full_name || 'المستخدم'}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Current Roles */}
          <div>
            <p className="text-sm font-medium mb-2">الأدوار الحالية</p>
            {userRoles.length > 0 ? (
              <div className="flex flex-wrap gap-2">
                {userRoles.map((role) => (
                  <Badge
                    key={role}
                    variant="secondary"
                    className={`${ROLE_COLORS[role]} gap-1 pe-1`}
                  >
                    {ROLE_LABELS[role]}
                    <Button
                      variant="ghost"
                      size="icon" aria-label="إزالة الدور"
                      className="h-4 w-4 p-0 hover:bg-transparent"
                      onClick={() => handleRemoveRole(role)}
                      disabled={isLoading}
                    >
                      <X className="h-3 w-3" />
                    </Button>
                  </Badge>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">لا يوجد أدوار معينة</p>
            )}
          </div>

          {/* Add Roles */}
          {availableRoles.length > 0 && (
            <div>
              <p className="text-sm font-medium mb-2">إضافة دور</p>
              <div className="flex flex-wrap gap-2">
                {availableRoles.map((role) => (
                  <Button
                    key={role}
                    variant="outline"
                    size="sm"
                    className="gap-1"
                    onClick={() => handleAddRole(role)}
                    disabled={isLoading}
                  >
                    {isLoading ? (
                      <Loader2 className="h-3 w-3 animate-spin" />
                    ) : (
                      <Plus className="h-3 w-3" />
                    )}
                    {ROLE_LABELS[role]}
                  </Button>
                ))}
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
