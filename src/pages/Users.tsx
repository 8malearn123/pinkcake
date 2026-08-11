import { Fragment, useState } from 'react';
import { MainLayout } from '@/components/layout/MainLayout';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { UsersTable } from '@/components/users/UsersTable';
import { RoleManagerDialog } from '@/components/users/RoleManagerDialog';
import { BranchAssignmentDialog } from '@/components/users/BranchAssignmentDialog';
import { AddUserDialog } from '@/components/users/AddUserDialog';
import { useUsers, UserWithRole } from '@/hooks/useUsers';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { PageHeader, LoadingState, ErrorState, EmptyState } from '@/components/ds';
import { cn } from '@/lib/utils';
import {
  Users as UsersIcon,
  Search,
  Shield,
  ChefHat,
  Store,
  UserPlus,
  Truck,
  HeadphonesIcon,
  UserCircle,
  ChevronLeft,
} from 'lucide-react';

type UserFilter = 'all' | 'employees' | 'customers';

export default function Users() {
  const [searchQuery, setSearchQuery] = useState('');
  const [roleDialogUser, setRoleDialogUser] = useState<UserWithRole | null>(null);
  const [branchDialogUser, setBranchDialogUser] = useState<UserWithRole | null>(null);
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [activeFilter, setActiveFilter] = useState<UserFilter>('all');

  const { data: users, isLoading, isError, refetch } = useUsers();

  // Filter users based on active filter and search query
  const filteredUsers = users?.filter((user) => {
    // Apply search filter
    const matchesSearch = 
      user.full_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.phone?.includes(searchQuery);

    if (!matchesSearch) return false;

    // Apply role filter
    if (activeFilter === 'all') return true;
    
    const userRoles = user.user_roles.map(r => r.role);
    const isCustomer = userRoles.includes('customer') || userRoles.length === 0;
    const isEmployee = userRoles.some(role => 
      ['admin', 'call_center', 'kitchen', 'branch', 'driver'].includes(role)
    );

    if (activeFilter === 'customers') return isCustomer && !isEmployee;
    if (activeFilter === 'employees') return isEmployee;
    
    return true;
  });

  const stats = {
    total: users?.length || 0,
    admins: users?.filter((u) => u.user_roles.some((r) => r.role === 'admin')).length || 0,
    callCenter: users?.filter((u) => u.user_roles.some((r) => r.role === 'call_center')).length || 0,
    kitchen: users?.filter((u) => u.user_roles.some((r) => r.role === 'kitchen')).length || 0,
    branch: users?.filter((u) => u.user_roles.some((r) => r.role === 'branch')).length || 0,
    drivers: users?.filter((u) => u.user_roles.some((r) => r.role === 'driver')).length || 0,
    customers: users?.filter((u) => 
      u.user_roles.some((r) => r.role === 'customer') || 
      u.user_roles.length === 0
    ).length || 0,
    employees: users?.filter((u) =>
      u.user_roles.some((r) => ['admin', 'call_center', 'kitchen', 'branch', 'driver'].includes(r.role))
    ).length || 0,
  };

  // The role breakdown for the command-bar pipeline.
  const pipeline = [
    { key: 'admins', label: 'مدراء', value: stats.admins, icon: Shield, box: 'bg-primary/10 text-primary' },
    { key: 'callCenter', label: 'مركز الاتصال', value: stats.callCenter, icon: HeadphonesIcon, box: 'bg-info/10 text-info' },
    { key: 'kitchen', label: 'مطبخ', value: stats.kitchen, icon: ChefHat, box: 'bg-warning/10 text-warning' },
    { key: 'branch', label: 'فروع', value: stats.branch, icon: Store, box: 'bg-success/10 text-success' },
    { key: 'drivers', label: 'سائقين', value: stats.drivers, icon: Truck, box: 'bg-info/10 text-info' },
    { key: 'customers', label: 'عملاء', value: stats.customers, icon: UserCircle, box: 'bg-primary/10 text-primary' },
  ];

  return (
    <MainLayout>
      <div className="space-y-6">
        <PageHeader
          title="إدارة المستخدمين"
          description="عرض المستخدمين وتعيين الأدوار والفروع"
          icon={UsersIcon}
          actions={
            <Button onClick={() => setShowAddDialog(true)} className="gradient-pink text-white shadow-warm hover:opacity-90 transition-opacity">
              <UserPlus className="w-4 h-4 me-2" />
              إضافة مستخدم
            </Button>
          }
        />

        {/* Command bar — total (hero) + the role breakdown pipeline */}
        <div className="rounded-2xl border border-border/60 bg-card overflow-hidden shadow-sm">
          <div className="flex flex-col lg:flex-row">
            <div className="flex items-center gap-3 p-5 bg-primary/[0.04] border-b lg:border-b-0 lg:border-e border-border/60 shrink-0">
              <div className="w-12 h-12 rounded-xl gradient-pink shadow-warm flex items-center justify-center shrink-0">
                <UsersIcon className="w-6 h-6 text-white" />
              </div>
              <div>
                <p className="text-2xl font-bold leading-none">{stats.total}</p>
                <p className="text-xs text-muted-foreground mt-1.5">إجمالي المستخدمين</p>
              </div>
            </div>

            <div className="flex items-center justify-between gap-1 p-4 flex-1 overflow-x-auto">
              {pipeline.map((stage, i) => (
                <Fragment key={stage.key}>
                  <div className="flex flex-col items-center gap-1.5 px-2 shrink-0">
                    <div className={cn('w-10 h-10 rounded-xl flex items-center justify-center', stage.box)}>
                      <stage.icon className="w-5 h-5" />
                    </div>
                    <p className="text-xl font-bold leading-none">{stage.value}</p>
                    <p className="text-xs text-muted-foreground text-center leading-tight whitespace-nowrap">{stage.label}</p>
                  </div>
                  {i < pipeline.length - 1 && <ChevronLeft className="w-4 h-4 text-muted-foreground/30 shrink-0" />}
                </Fragment>
              ))}
            </div>
          </div>
        </div>

        {/* Tabs & Search */}
        <Tabs dir="rtl" value={activeFilter} onValueChange={(v) => setActiveFilter(v as UserFilter)} className="space-y-4">
          <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
            <TabsList>
              <TabsTrigger value="all" className="gap-2">
                <UsersIcon className="w-4 h-4" />
                الكل
                <Badge variant="secondary" className="ms-1">{stats.total}</Badge>
              </TabsTrigger>
              <TabsTrigger value="employees" className="gap-2">
                <Shield className="w-4 h-4" />
                الموظفين
                <Badge variant="secondary" className="ms-1">{stats.employees}</Badge>
              </TabsTrigger>
              <TabsTrigger value="customers" className="gap-2">
                <UserCircle className="w-4 h-4" />
                العملاء
                <Badge variant="secondary" className="ms-1">{stats.customers}</Badge>
              </TabsTrigger>
            </TabsList>

            <div className="relative w-full sm:w-72">
              <Search className="absolute start-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="البحث عن مستخدم..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="ps-10"
              />
            </div>
          </div>

          {/* Content */}
          {isLoading ? (
            <LoadingState label="جاري تحميل المستخدمين..." />
          ) : isError ? (
            <ErrorState title="تعذّر تحميل المستخدمين" onRetry={() => refetch()} />
          ) : !filteredUsers || filteredUsers.length === 0 ? (
            <EmptyState
              icon={UsersIcon}
              title="لا يوجد مستخدمون"
              description="لم يتم العثور على مستخدمين مطابقين. جرّب تعديل البحث أو التصنيف."
            />
          ) : (
            <>
              <TabsContent value="all" className="mt-0">
                <UsersTable
                  users={filteredUsers || []}
                  onManageRoles={(user) => setRoleDialogUser(user)}
                  onManageBranch={(user) => setBranchDialogUser(user)}
                />
              </TabsContent>
              <TabsContent value="employees" className="mt-0">
                <UsersTable
                  users={filteredUsers || []}
                  onManageRoles={(user) => setRoleDialogUser(user)}
                  onManageBranch={(user) => setBranchDialogUser(user)}
                />
              </TabsContent>
              <TabsContent value="customers" className="mt-0">
                <UsersTable
                  users={filteredUsers || []}
                  onManageRoles={(user) => setRoleDialogUser(user)}
                  onManageBranch={(user) => setBranchDialogUser(user)}
                />
              </TabsContent>
            </>
          )}
        </Tabs>

        {/* Dialogs */}
        <RoleManagerDialog
          open={!!roleDialogUser}
          onOpenChange={(open) => !open && setRoleDialogUser(null)}
          user={roleDialogUser}
        />

        <BranchAssignmentDialog
          open={!!branchDialogUser}
          onOpenChange={(open) => !open && setBranchDialogUser(null)}
          user={branchDialogUser}
        />

        <AddUserDialog
          open={showAddDialog}
          onOpenChange={setShowAddDialog}
        />
      </div>
    </MainLayout>
  );
}
