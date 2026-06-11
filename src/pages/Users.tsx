import { useState } from 'react';
import { MainLayout } from '@/components/layout/MainLayout';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { UsersTable } from '@/components/users/UsersTable';
import { RoleManagerDialog } from '@/components/users/RoleManagerDialog';
import { BranchAssignmentDialog } from '@/components/users/BranchAssignmentDialog';
import { AddUserDialog } from '@/components/users/AddUserDialog';
import { useUsers, UserWithRole, ROLE_LABELS } from '@/hooks/useUsers';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Users as UsersIcon, 
  Search, 
  Loader2, 
  Shield, 
  UserCheck, 
  ChefHat, 
  Store, 
  UserPlus,
  Truck,
  HeadphonesIcon,
  UserCircle,
} from 'lucide-react';

type UserFilter = 'all' | 'employees' | 'customers';

export default function Users() {
  const [searchQuery, setSearchQuery] = useState('');
  const [roleDialogUser, setRoleDialogUser] = useState<UserWithRole | null>(null);
  const [branchDialogUser, setBranchDialogUser] = useState<UserWithRole | null>(null);
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [activeFilter, setActiveFilter] = useState<UserFilter>('all');

  const { data: users, isLoading, error } = useUsers();

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
      ['admin', 'call_center', 'kitchen', 'branch', 'driver', 'customer_support'].includes(role)
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
    support: users?.filter((u) => u.user_roles.some((r) => r.role === 'customer_support')).length || 0,
    customers: users?.filter((u) => 
      u.user_roles.some((r) => r.role === 'customer') || 
      u.user_roles.length === 0
    ).length || 0,
    employees: users?.filter((u) => 
      u.user_roles.some((r) => ['admin', 'call_center', 'kitchen', 'branch', 'driver', 'customer_support'].includes(r.role))
    ).length || 0,
  };

  return (
    <MainLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl gradient-pink flex items-center justify-center">
                <UsersIcon className="w-5 h-5 text-white" />
              </div>
              إدارة المستخدمين
            </h1>
            <p className="text-muted-foreground mt-1">عرض المستخدمين وتعيين الأدوار والفروع</p>
          </div>
          <Button onClick={() => setShowAddDialog(true)} className="gap-2">
            <UserPlus className="w-4 h-4" />
            إضافة مستخدم
          </Button>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-3">
          <Card className="col-span-1">
            <CardContent className="pt-4 pb-3 px-3">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                  <UsersIcon className="w-4 h-4 text-primary" />
                </div>
                <div>
                  <p className="text-xl font-bold">{stats.total}</p>
                  <p className="text-[10px] text-muted-foreground">إجمالي</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="col-span-1">
            <CardContent className="pt-4 pb-3 px-3">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-purple-500/10 flex items-center justify-center shrink-0">
                  <Shield className="w-4 h-4 text-purple-600" />
                </div>
                <div>
                  <p className="text-xl font-bold">{stats.admins}</p>
                  <p className="text-[10px] text-muted-foreground">مدراء</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="col-span-1">
            <CardContent className="pt-4 pb-3 px-3">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-blue-500/10 flex items-center justify-center shrink-0">
                  <UserCheck className="w-4 h-4 text-blue-600" />
                </div>
                <div>
                  <p className="text-xl font-bold">{stats.callCenter}</p>
                  <p className="text-[10px] text-muted-foreground">كول سنتر</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="col-span-1">
            <CardContent className="pt-4 pb-3 px-3">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-orange-500/10 flex items-center justify-center shrink-0">
                  <ChefHat className="w-4 h-4 text-orange-600" />
                </div>
                <div>
                  <p className="text-xl font-bold">{stats.kitchen}</p>
                  <p className="text-[10px] text-muted-foreground">مطبخ</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="col-span-1">
            <CardContent className="pt-4 pb-3 px-3">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-green-500/10 flex items-center justify-center shrink-0">
                  <Store className="w-4 h-4 text-green-600" />
                </div>
                <div>
                  <p className="text-xl font-bold">{stats.branch}</p>
                  <p className="text-[10px] text-muted-foreground">فروع</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="col-span-1">
            <CardContent className="pt-4 pb-3 px-3">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-cyan-500/10 flex items-center justify-center shrink-0">
                  <Truck className="w-4 h-4 text-cyan-600" />
                </div>
                <div>
                  <p className="text-xl font-bold">{stats.drivers}</p>
                  <p className="text-[10px] text-muted-foreground">سائقين</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="col-span-1">
            <CardContent className="pt-4 pb-3 px-3">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-teal-500/10 flex items-center justify-center shrink-0">
                  <HeadphonesIcon className="w-4 h-4 text-teal-600" />
                </div>
                <div>
                  <p className="text-xl font-bold">{stats.support}</p>
                  <p className="text-[10px] text-muted-foreground">دعم</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="col-span-1">
            <CardContent className="pt-4 pb-3 px-3">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-pink-500/10 flex items-center justify-center shrink-0">
                  <UserCircle className="w-4 h-4 text-pink-600" />
                </div>
                <div>
                  <p className="text-xl font-bold">{stats.customers}</p>
                  <p className="text-[10px] text-muted-foreground">عملاء</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Tabs & Search */}
        <Tabs value={activeFilter} onValueChange={(v) => setActiveFilter(v as UserFilter)} className="space-y-4">
          <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
            <TabsList>
              <TabsTrigger value="all" className="gap-2">
                <UsersIcon className="w-4 h-4" />
                الكل ({stats.total})
              </TabsTrigger>
              <TabsTrigger value="employees" className="gap-2">
                <Shield className="w-4 h-4" />
                الموظفين ({stats.employees})
              </TabsTrigger>
              <TabsTrigger value="customers" className="gap-2">
                <UserCircle className="w-4 h-4" />
                العملاء ({stats.customers})
              </TabsTrigger>
            </TabsList>

            <div className="relative w-full sm:w-72">
              <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="البحث عن مستخدم..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pr-10"
              />
            </div>
          </div>

          {/* Content */}
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
          ) : error ? (
            <Card>
              <CardContent className="py-12 text-center">
                <p className="text-destructive">حدث خطأ في تحميل المستخدمين</p>
                <p className="text-sm text-muted-foreground mt-1">{error.message}</p>
              </CardContent>
            </Card>
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
