import { useState } from 'react';
import { UserWithRole, ROLE_LABELS, ROLE_COLORS } from '@/hooks/useUsers';
import { Enums } from '@/integrations/supabase/types';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { MoreHorizontal, Shield, MapPin, UserCircle, UserCog } from 'lucide-react';
import { RevealPhoneButton } from './RevealPhoneButton';
import { ImpersonationModal } from '@/components/admin/ImpersonationModal';
import { useImpersonation } from '@/contexts/ImpersonationContext';
import { useAuth } from '@/contexts/AuthContext';

type AppRole = Enums<'app_role'>;

// Staff roles. Customers (only the `customer` role, or none) can't be assigned
// roles or branches, so those row actions are hidden for them.
const EMPLOYEE_ROLES: AppRole[] = ['admin', 'call_center', 'kitchen', 'branch', 'driver', 'customer_support'];
const isEmployee = (u: UserWithRole) => u.user_roles.some((r) => EMPLOYEE_ROLES.includes(r.role as AppRole));

interface UsersTableProps {
  users: UserWithRole[];
  onManageRoles: (user: UserWithRole) => void;
  onManageBranch: (user: UserWithRole) => void;
}

export function UsersTable({
  users,
  onManageRoles,
  onManageBranch,
}: UsersTableProps) {
  const { user } = useAuth();
  const { isImpersonating } = useImpersonation();
  const [impersonateTarget, setImpersonateTarget] = useState<{ id: string; fullName: string | null } | null>(null);

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('ar-SA-u-nu-latn', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  // Check if impersonation button should be shown for a user
  const canImpersonate = (targetUser: UserWithRole) => {
    // Don't show for self
    if (targetUser.id === user?.id) return false;
    // Don't allow while already impersonating
    if (isImpersonating) return false;
    return true;
  };

  return (
    <>
      <div className="rounded-lg border bg-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>المستخدم</TableHead>
              <TableHead>الأدوار</TableHead>
              <TableHead>الفرع</TableHead>
              <TableHead>تاريخ التسجيل</TableHead>
              <TableHead className="w-16"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {users.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                  لا يوجد مستخدمين حتى الآن
                </TableCell>
              </TableRow>
            ) : (
              users.map((targetUser) => (
                <TableRow key={targetUser.id}>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                        {targetUser.avatar_url ? (
                          <img
                            src={targetUser.avatar_url}
                            alt={targetUser.full_name || ''}
                            className="w-10 h-10 rounded-full object-cover"
                          />
                        ) : (
                          <UserCircle className="w-6 h-6 text-primary" />
                        )}
                      </div>
                      <div>
                        <p className="font-medium">{targetUser.full_name || 'بدون اسم'}</p>
                        <RevealPhoneButton 
                          profileId={targetUser.id} 
                          userName={targetUser.full_name || undefined} 
                        />
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-wrap gap-1">
                      {targetUser.user_roles.length > 0 ? (
                        targetUser.user_roles.map((ur) => (
                          <Badge
                            key={ur.id}
                            variant="secondary"
                            className={ROLE_COLORS[ur.role as AppRole]}
                          >
                            {ROLE_LABELS[ur.role as AppRole]}
                          </Badge>
                        ))
                      ) : (
                        <span className="text-muted-foreground text-sm">بدون دور</span>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    {targetUser.user_branch_assignments.length > 0 ? (
                      <Badge variant="outline" className="gap-1">
                        <MapPin className="w-3 h-3" />
                        {targetUser.user_branch_assignments[0].branch_name || 'فرع غير معروف'}
                      </Badge>
                    ) : (
                      <span className="text-muted-foreground text-sm">—</span>
                    )}
                  </TableCell>
                  <TableCell className="text-muted-foreground text-sm">
                    {formatDate(targetUser.created_at)}
                  </TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" aria-label="خيارات">
                          <MoreHorizontal className="w-4 h-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="bg-popover border shadow-md">
                        <DropdownMenuLabel>إدارة المستخدم</DropdownMenuLabel>
                        <DropdownMenuSeparator />
                        {/* Roles & branches are staff-only — hidden for customers */}
                        {isEmployee(targetUser) && (
                          <>
                            <DropdownMenuItem onClick={() => onManageRoles(targetUser)}>
                              <Shield className="w-4 h-4 me-2" />
                              إدارة الأدوار
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => onManageBranch(targetUser)}>
                              <MapPin className="w-4 h-4 me-2" />
                              تعيين فرع
                            </DropdownMenuItem>
                          </>
                        )}
                        {canImpersonate(targetUser) && (
                          <>
                            {isEmployee(targetUser) && <DropdownMenuSeparator />}
                            <DropdownMenuItem
                              onClick={() => setImpersonateTarget({
                                id: targetUser.id,
                                fullName: targetUser.full_name
                              })}
                              className="text-primary"
                            >
                              <UserCog className="w-4 h-4 me-2" />
                              الدخول كـ هذا المستخدم
                            </DropdownMenuItem>
                          </>
                        )}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      <ImpersonationModal
        open={!!impersonateTarget}
        onOpenChange={(open) => !open && setImpersonateTarget(null)}
        targetUser={impersonateTarget}
      />
    </>
  );
}
