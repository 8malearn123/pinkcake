import { useState, useMemo } from 'react';
import { Tables } from '@/integrations/supabase/types';
import {
  useBranchEmployees,
  useAvailableEmployees,
  useAssignEmployeeToBranch,
  useRemoveEmployeeFromBranch,
} from '@/hooks/useBranchEmployees';
import { ROLE_LABELS, ROLE_COLORS } from '@/hooks/useUsers';
import { Enums } from '@/integrations/supabase/types';
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
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Loader2, UserPlus, X, Users, Filter } from 'lucide-react';

type Branch = Tables<'branches'>;
type AppRole = Enums<'app_role'>;

const ALL_ROLES: AppRole[] = ['admin', 'call_center', 'kitchen', 'branch'];

interface BranchEmployeesDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  branch: Branch | null;
}

export function BranchEmployeesDialog({
  open,
  onOpenChange,
  branch,
}: BranchEmployeesDialogProps) {
  const [selectedEmployee, setSelectedEmployee] = useState<string>('');
  const [roleFilter, setRoleFilter] = useState<string>('all');
  
  const { data: employees, isLoading: employeesLoading } = useBranchEmployees(branch?.id || null);
  const { data: availableEmployees, isLoading: availableLoading } = useAvailableEmployees(branch?.id || null);
  const assignEmployee = useAssignEmployeeToBranch();
  const removeEmployee = useRemoveEmployeeFromBranch();

  const filteredEmployees = useMemo(() => {
    if (!employees) return [];
    if (roleFilter === 'all') return employees;
    return employees.filter((emp) => emp.roles.includes(roleFilter));
  }, [employees, roleFilter]);

  const isLoading = assignEmployee.isPending || removeEmployee.isPending;

  const handleAssign = () => {
    if (selectedEmployee && branch) {
      assignEmployee.mutate(
        { userId: selectedEmployee, branchId: branch.id },
        { onSuccess: () => setSelectedEmployee('') }
      );
    }
  };

  const handleRemove = (userId: string) => {
    if (branch) {
      removeEmployee.mutate({ userId, branchId: branch.id });
    }
  };

  const getInitials = (name: string | null) => {
    if (!name) return '؟';
    return name.substring(0, 2);
  };

  if (!branch) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Users className="w-5 h-5" />
            موظفي الفرع
          </DialogTitle>
          <DialogDescription>{branch.name}</DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Add Employee Section */}
          <div>
            <p className="text-sm font-medium mb-2">إضافة موظف</p>
            {availableLoading ? (
              <div className="flex items-center justify-center py-4">
                <Loader2 className="h-5 w-5 animate-spin text-primary" />
              </div>
            ) : availableEmployees && availableEmployees.length > 0 ? (
              <div className="flex gap-2">
                <Select value={selectedEmployee} onValueChange={setSelectedEmployee}>
                  <SelectTrigger className="flex-1">
                    <SelectValue placeholder="اختر موظف..." />
                  </SelectTrigger>
                  <SelectContent className="bg-popover border shadow-md">
                    {availableEmployees.map((emp) => (
                      <SelectItem key={emp.id} value={emp.id}>
                        {emp.full_name || emp.phone || 'مستخدم'}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Button onClick={handleAssign} disabled={!selectedEmployee || isLoading}>
                  {isLoading ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <UserPlus className="h-4 w-4" />
                  )}
                </Button>
              </div>
            ) : (
              <p className="text-sm text-muted-foreground py-2">
                لا يوجد موظفين متاحين للتعيين
              </p>
            )}
          </div>

          {/* Employees List */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm font-medium">
                الموظفين الحاليين ({filteredEmployees.length})
              </p>
              <Select value={roleFilter} onValueChange={setRoleFilter}>
                <SelectTrigger className="w-36 h-8 text-xs">
                  <Filter className="w-3 h-3 me-1" />
                  <SelectValue placeholder="تصفية" />
                </SelectTrigger>
                <SelectContent className="bg-popover border shadow-md">
                  <SelectItem value="all">جميع الأدوار</SelectItem>
                  {ALL_ROLES.map((role) => (
                    <SelectItem key={role} value={role}>
                      {ROLE_LABELS[role]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            {employeesLoading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin text-primary" />
              </div>
            ) : filteredEmployees.length > 0 ? (
              <div className="space-y-2 max-h-64 overflow-y-auto">
                {filteredEmployees.map((emp) => (
                  <div
                    key={emp.user_id}
                    className="flex items-center justify-between p-3 rounded-lg border bg-muted/30"
                  >
                    <div className="flex items-center gap-3">
                      <Avatar className="h-9 w-9">
                        <AvatarImage src={emp.avatar_url || undefined} />
                        <AvatarFallback className="bg-primary/10 text-primary text-sm">
                          {getInitials(emp.full_name)}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="font-medium text-sm">
                          {emp.full_name || 'مستخدم'}
                        </p>
                        <div className="flex items-center gap-1 mt-0.5">
                          {emp.roles.length > 0 ? (
                            emp.roles.map((role) => (
                              <Badge
                                key={role}
                                variant="secondary"
                                className={`text-xs ${ROLE_COLORS[role as AppRole] || ''}`}
                              >
                                {ROLE_LABELS[role as AppRole] || role}
                              </Badge>
                            ))
                          ) : (
                            <span className="text-xs text-muted-foreground">
                              بدون دور
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon" aria-label="إزالة الموظف"
                      className="h-8 w-8 text-destructive hover:text-destructive hover:bg-destructive/10"
                      onClick={() => handleRemove(emp.user_id)}
                      disabled={isLoading}
                    >
                      {isLoading ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <X className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                <Users className="w-10 h-10 mx-auto mb-2 opacity-50" />
                <p>لا يوجد موظفين معينين لهذا الفرع</p>
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
