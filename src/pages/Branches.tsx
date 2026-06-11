import { useState, useEffect } from 'react';
import { MainLayout } from '@/components/layout/MainLayout';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { BranchesTable } from '@/components/branches/BranchesTable';
import { BranchForm } from '@/components/branches/BranchForm';
import { BranchEmployeeStats } from '@/components/branches/BranchEmployeeStats';
import {
  useBranches,
  useCreateBranch,
  useUpdateBranch,
  useDeleteBranch,
} from '@/hooks/useBranches';
import { useBranchEmployeeCounts } from '@/hooks/useBranchEmployees';
import { Tables } from '@/integrations/supabase/types';
import { Store, Plus, Search, Loader2, Download, Printer } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { exportMultipleSheetsToExcel } from '@/utils/exportToExcel';
import { printReport } from '@/utils/printReport';
import { toast } from '@/hooks/use-toast';
import { ROLE_LABELS } from '@/hooks/useUsers';
import { Enums } from '@/integrations/supabase/types';

type Branch = Tables<'branches'>;
type AppRole = Enums<'app_role'>;

export default function Branches() {
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [selectedBranch, setSelectedBranch] = useState<Branch | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [isExporting, setIsExporting] = useState(false);
  const [isPrinting, setIsPrinting] = useState(false);

  const { data: branches, isLoading, error } = useBranches();
  const { data: employeeCounts } = useBranchEmployeeCounts();
  const createBranch = useCreateBranch();
  const updateBranch = useUpdateBranch();
  const deleteBranch = useDeleteBranch();

  useEffect(() => {
    if (!isFormOpen) {
      setSelectedBranch(null);
    }
  }, [isFormOpen]);

  const handleEdit = (branch: Branch) => {
    setSelectedBranch(branch);
    setIsFormOpen(true);
  };

  const handleSubmit = (values: Omit<Branch, 'id' | 'created_at'>) => {
    if (selectedBranch) {
      updateBranch.mutate(
        { id: selectedBranch.id, ...values },
        { onSuccess: () => setIsFormOpen(false) }
      );
    } else {
      createBranch.mutate(values, { onSuccess: () => setIsFormOpen(false) });
    }
  };

  const handleExport = async () => {
    if (!branches || branches.length === 0) {
      toast({
        title: 'لا توجد بيانات',
        description: 'لا توجد فروع للتصدير',
        variant: 'destructive',
      });
      return;
    }

    setIsExporting(true);
    try {
      // Fetch all branch assignments
      const { data: assignments, error: assignmentsError } = await supabase
        .from('user_branch_assignments')
        .select('branch_id, user_id');

      if (assignmentsError) throw assignmentsError;

      // Get unique user IDs
      const userIds = [...new Set((assignments || []).map((a) => a.user_id))];

      // Use secure RPC function instead of direct query to protect phone numbers
      const { data: employees, error: employeesError } = await supabase.rpc('get_employees_secure');

      if (employeesError) throw employeesError;
      
      // Map employees to profiles format for compatibility
      const profiles = (employees || []).map((emp: any) => ({
        id: emp.id,
        full_name: emp.full_name,
        phone: emp.phone, // Will be null for non-admin users due to RPC function
      }));

      const { data: roles, error: rolesError } = await supabase
        .from('user_roles')
        .select('user_id, role');

      if (rolesError) throw rolesError;

      // Prepare branches sheet
      const branchesData = branches.map((branch) => ({
        name: branch.name,
        phone: branch.phone || '',
        address: branch.address || '',
        employeeCount: assignments?.filter((a) => a.branch_id === branch.id).length || 0,
      }));

      // Prepare employees sheet with branch info
      const employeesData = (assignments || []).map((assignment) => {
        const branch = branches.find((b) => b.id === assignment.branch_id);
        const profile = profiles?.find((p) => p.id === assignment.user_id);
        const userRoles = roles?.filter((r) => r.user_id === assignment.user_id) || [];
        const roleNames = userRoles.map((r) => ROLE_LABELS[r.role as AppRole] || r.role).join(', ');

        return {
          branchName: branch?.name || '',
          employeeName: profile?.full_name || '',
          employeePhone: profile?.phone || '',
          roles: roleNames,
        };
      }) || [];

      // Export to Excel with multiple sheets
      exportMultipleSheetsToExcel(
        [
          {
            data: branchesData,
            columns: [
              { header: 'اسم الفرع', key: 'name', width: 25 },
              { header: 'رقم الهاتف', key: 'phone', width: 18 },
              { header: 'العنوان', key: 'address', width: 40 },
              { header: 'عدد الموظفين', key: 'employeeCount', width: 15 },
            ],
            name: 'الفروع',
          },
          {
            data: employeesData,
            columns: [
              { header: 'الفرع', key: 'branchName', width: 25 },
              { header: 'اسم الموظف', key: 'employeeName', width: 25 },
              { header: 'رقم الهاتف', key: 'employeePhone', width: 18 },
              { header: 'الأدوار', key: 'roles', width: 30 },
            ],
            name: 'الموظفين',
          },
        ],
        `الفروع_والموظفين_${new Date().toLocaleDateString('ar-EG')}`
      );

      toast({
        title: 'تم التصدير',
        description: 'تم تصدير البيانات بنجاح',
      });
    } catch (err) {
      console.error('Export error:', err);
      toast({
        title: 'خطأ',
        description: 'فشل في تصدير البيانات',
        variant: 'destructive',
      });
    } finally {
      setIsExporting(false);
    }
  };

  const handlePrint = async () => {
    if (!branches || branches.length === 0) {
      toast({
        title: 'لا توجد بيانات',
        description: 'لا توجد فروع للطباعة',
        variant: 'destructive',
      });
      return;
    }

    setIsPrinting(true);
    try {
      // Fetch all branch assignments
      const { data: assignments, error: assignmentsError } = await supabase
        .from('user_branch_assignments')
        .select('branch_id, user_id');

      if (assignmentsError) throw assignmentsError;

      // Get unique user IDs
      const userIds = [...new Set((assignments || []).map((a) => a.user_id))];

      // Use secure RPC function instead of direct query to protect phone numbers
      const { data: employees, error: employeesError } = await supabase.rpc('get_employees_secure');

      if (employeesError) throw employeesError;
      
      // Map employees to profiles format for compatibility
      const profiles = (employees || []).map((emp: any) => ({
        id: emp.id,
        full_name: emp.full_name,
        phone: emp.phone, // Will be null for non-admin users due to RPC function
      }));

      const { data: roles, error: rolesError } = await supabase
        .from('user_roles')
        .select('user_id, role');

      if (rolesError) throw rolesError;

      // Prepare branches data
      const branchesData = branches.map((branch) => ({
        name: branch.name,
        phone: branch.phone || '',
        address: branch.address || '',
        employeeCount: String(assignments?.filter((a) => a.branch_id === branch.id).length || 0),
      }));

      // Prepare employees data
      const employeesData = (assignments || []).map((assignment) => {
        const branch = branches.find((b) => b.id === assignment.branch_id);
        const profile = profiles?.find((p) => p.id === assignment.user_id);
        const userRoles = roles?.filter((r) => r.user_id === assignment.user_id) || [];
        const roleNames = userRoles.map((r) => ROLE_LABELS[r.role as AppRole] || r.role).join(', ');

        return {
          branchName: branch?.name || '',
          employeeName: profile?.full_name || '',
          employeePhone: profile?.phone || '',
          roles: roleNames,
        };
      });

      // Print report
      printReport('تقرير الفروع والموظفين', [
        {
          title: 'قائمة الفروع',
          data: branchesData,
          columns: [
            { header: 'اسم الفرع', key: 'name' },
            { header: 'رقم الهاتف', key: 'phone' },
            { header: 'العنوان', key: 'address' },
            { header: 'عدد الموظفين', key: 'employeeCount' },
          ],
        },
        {
          title: 'قائمة الموظفين',
          data: employeesData,
          columns: [
            { header: 'الفرع', key: 'branchName' },
            { header: 'اسم الموظف', key: 'employeeName' },
            { header: 'رقم الهاتف', key: 'employeePhone' },
            { header: 'الأدوار', key: 'roles' },
          ],
        },
      ], 'نظام إدارة الفروع');
    } catch (err) {
      console.error('Print error:', err);
      toast({
        title: 'خطأ',
        description: 'فشل في طباعة التقرير',
        variant: 'destructive',
      });
    } finally {
      setIsPrinting(false);
    }
  };

  const filteredBranches = branches?.filter((branch) =>
    branch.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    branch.address?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <MainLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl gradient-pink flex items-center justify-center">
                <Store className="w-5 h-5 text-white" />
              </div>
              إدارة الفروع
            </h1>
            <p className="text-muted-foreground mt-1">إضافة وتعديل بيانات الفروع</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button onClick={() => setIsFormOpen(true)} className="gap-2">
              <Plus className="w-4 h-4" />
              إضافة فرع
            </Button>
            <Button
              variant="outline"
              onClick={handleExport}
              disabled={isExporting || !branches?.length}
              className="gap-2"
            >
              {isExporting ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Download className="w-4 h-4" />
              )}
              تصدير Excel
            </Button>
            <Button
              variant="outline"
              onClick={handlePrint}
              disabled={isPrinting || !branches?.length}
              className="gap-2"
            >
              {isPrinting ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Printer className="w-4 h-4" />
              )}
              طباعة
            </Button>
          </div>
        </div>

        {/* Employee Distribution Stats */}
        {branches && branches.length > 0 && employeeCounts && (
          <BranchEmployeeStats 
            branches={branches} 
            employeeCounts={employeeCounts} 
          />
        )}

        {/* Search */}
        <div className="relative max-w-md">
          <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="البحث عن فرع..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pr-10"
          />
        </div>

        {/* Content */}
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
          </div>
        ) : error ? (
          <Card>
            <CardContent className="py-12 text-center">
              <p className="text-destructive">حدث خطأ في تحميل الفروع</p>
              <p className="text-sm text-muted-foreground mt-1">{error.message}</p>
            </CardContent>
          </Card>
        ) : (
          <BranchesTable
            branches={filteredBranches || []}
            onEdit={handleEdit}
            onDelete={(id) => deleteBranch.mutate(id)}
            isDeleting={deleteBranch.isPending}
          />
        )}

        {/* Form Dialog */}
        <BranchForm
          key={selectedBranch?.id || 'new'}
          open={isFormOpen}
          onOpenChange={setIsFormOpen}
          branch={selectedBranch}
          onSubmit={handleSubmit}
          isLoading={createBranch.isPending || updateBranch.isPending}
        />
      </div>
    </MainLayout>
  );
}
