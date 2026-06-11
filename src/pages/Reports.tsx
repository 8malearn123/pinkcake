import { useState, useCallback } from 'react';
import { MainLayout } from '@/components/layout/MainLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  useReportData,
  getDateRangeFromQuickFilter,
  QuickFilter,
  ReportFilters,
  STATUS_LABELS,
  PAYMENT_STATUS_LABELS,
} from '@/hooks/useReports';
import { useBranches } from '@/hooks/useBranches';
import { BranchComparison } from '@/components/reports/BranchComparison';
import {
  BarChart3,
  Calendar as CalendarIcon,
  Printer,
  Loader2,
  TrendingUp,
  Package,
  Clock,
  CheckCircle2,
  DollarSign,
  Store,
  Filter,
  FileSpreadsheet,
  GitCompare,
} from 'lucide-react';
import { format } from 'date-fns';
import { ar } from 'date-fns/locale';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
  Legend,
} from 'recharts';
import { cn } from '@/lib/utils';
import * as XLSX from 'xlsx';
import { Enums } from '@/integrations/supabase/types';

type OrderStatus = Enums<'order_status'>;

const QUICK_FILTERS: { value: QuickFilter; label: string }[] = [
  { value: 'today', label: 'اليوم' },
  { value: 'yesterday', label: 'أمس' },
  { value: 'this_week', label: 'هذا الأسبوع' },
  { value: 'this_month', label: 'هذا الشهر' },
  { value: 'custom', label: 'مخصص' },
];

const STATUS_OPTIONS = [
  { value: 'pending_approval', label: 'بانتظار الموافقة' },
  { value: 'awaiting_payment', label: 'بانتظار الدفع' },
  { value: 'paid', label: 'تم الدفع' },
  { value: 'preparing', label: 'قيد التحضير' },
  { value: 'ready_to_ship', label: 'جاهز للشحن' },
  { value: 'in_transit', label: 'في الطريق' },
  { value: 'ready_for_pickup', label: 'جاهز للاستلام' },
  { value: 'completed', label: 'مكتمل' },
];

const CHART_COLORS = ['#be7b7c', '#7cb87c', '#7c7cb8', '#b87c7c', '#7cb8b8', '#b8b87c', '#b87cb8', '#7c7c7c'];

export default function Reports() {
  const [quickFilter, setQuickFilter] = useState<QuickFilter>('this_month');
  const [filters, setFilters] = useState<ReportFilters>(() => ({
    dateRange: getDateRangeFromQuickFilter('this_month'),
    branchIds: [],
    statuses: [] as OrderStatus[],
  }));
  const [showFilters, setShowFilters] = useState(false);

  const { data: branches } = useBranches();
  const { data: reportData, isLoading, error } = useReportData(filters);

  const handleQuickFilterChange = (value: QuickFilter) => {
    setQuickFilter(value);
    if (value !== 'custom') {
      setFilters((prev) => ({
        ...prev,
        dateRange: getDateRangeFromQuickFilter(value),
      }));
    }
  };

  const handleDateChange = (type: 'from' | 'to', date: Date | undefined) => {
    if (date) {
      setQuickFilter('custom');
      setFilters((prev) => ({
        ...prev,
        dateRange: {
          ...prev.dateRange,
          [type]: date,
        },
      }));
    }
  };

  const handleBranchToggle = (branchId: string) => {
    setFilters((prev) => ({
      ...prev,
      branchIds: prev.branchIds.includes(branchId)
        ? prev.branchIds.filter((id) => id !== branchId)
        : [...prev.branchIds, branchId],
    }));
  };

  const handleStatusToggle = (status: OrderStatus) => {
    setFilters((prev) => ({
      ...prev,
      statuses: prev.statuses.includes(status)
        ? prev.statuses.filter((s) => s !== status)
        : [...prev.statuses, status],
    }));
  };

  const clearFilters = () => {
    setFilters((prev) => ({
      ...prev,
      branchIds: [],
      statuses: [],
    }));
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('ar-SA', {
      style: 'currency',
      currency: 'SAR',
    }).format(amount);
  };

  const handleExportExcel = () => {
    if (!reportData?.orders) return;

    const data = reportData.orders.map((order) => ({
      'رقم الطلب': order.order_number,
      'اسم العميل': order.customer_name || '-',
      'الفرع': order.branch_name || '-',
      'الحالة': STATUS_LABELS[order.status] || order.status,
      'تاريخ الاستلام': order.delivery_date || '-',
      'وقت الاستلام': order.delivery_time || '-',
      'المبلغ': order.total_amount,
      'حالة الدفع': PAYMENT_STATUS_LABELS[order.payment_status || ''] || order.payment_status || '-',
      'تاريخ الإنشاء': format(new Date(order.created_at), 'yyyy-MM-dd HH:mm'),
    }));

    const worksheet = XLSX.utils.json_to_sheet(data);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'الطلبات');
    XLSX.writeFile(workbook, `تقرير_الطلبات_${format(new Date(), 'yyyy-MM-dd')}.xlsx`);
  };

  const handlePrint = () => {
    if (!reportData) return;

    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      alert('يرجى السماح بالنوافذ المنبثقة لطباعة التقرير');
      return;
    }

    const content = `
      <!DOCTYPE html>
      <html dir="rtl" lang="ar">
      <head>
        <meta charset="UTF-8">
        <title>تقرير الطلبات</title>
        <style>
          @import url('https://fonts.googleapis.com/css2?family=Cairo:wght@400;600;700&display=swap');
          body { font-family: 'Cairo', sans-serif; direction: rtl; padding: 20px; }
          h1 { color: #be7b7c; text-align: center; }
          h2 { margin-top: 20px; border-bottom: 2px solid #be7b7c; padding-bottom: 5px; }
          table { width: 100%; border-collapse: collapse; margin-top: 15px; }
          th, td { border: 1px solid #ddd; padding: 10px; text-align: right; }
          th { background: #f5f5f5; }
          .summary { display: flex; gap: 20px; flex-wrap: wrap; margin: 20px 0; }
          .stat { padding: 15px; background: #f9f9f9; border-radius: 8px; }
          .stat-value { font-size: 24px; font-weight: bold; color: #be7b7c; }
        </style>
      </head>
      <body>
        <h1>تقرير الطلبات</h1>
        <p style="text-align:center;">الفترة: ${format(filters.dateRange.from, 'yyyy-MM-dd')} إلى ${format(filters.dateRange.to, 'yyyy-MM-dd')}</p>
        
        <div class="summary">
          <div class="stat"><div class="stat-value">${reportData.stats.totalOrders}</div>إجمالي الطلبات</div>
          <div class="stat"><div class="stat-value">${reportData.stats.pendingApproval}</div>بانتظار الموافقة</div>
          <div class="stat"><div class="stat-value">${reportData.stats.inPreparation}</div>قيد التحضير</div>
          <div class="stat"><div class="stat-value">${reportData.stats.completed}</div>مكتملة</div>
          <div class="stat"><div class="stat-value">${formatCurrency(reportData.stats.totalRevenue)}</div>إجمالي الإيرادات</div>
        </div>
        
        <h2>تفاصيل الطلبات</h2>
        <table>
          <thead>
            <tr>
              <th>رقم الطلب</th>
              <th>العميل</th>
              <th>الفرع</th>
              <th>الحالة</th>
              <th>المبلغ</th>
            </tr>
          </thead>
          <tbody>
            ${reportData.orders
              .map(
                (o) => `
              <tr>
                <td>${o.order_number}</td>
                <td>${o.customer_name || '-'}</td>
                <td>${o.branch_name || '-'}</td>
                <td>${STATUS_LABELS[o.status] || o.status}</td>
                <td>${formatCurrency(o.total_amount)}</td>
              </tr>
            `
              )
              .join('')}
          </tbody>
        </table>
        
        <p style="text-align:center; margin-top:30px; color:#999;">تم إنشاء هذا التقرير بواسطة نظام Pink Cake</p>
      </body>
      </html>
    `;

    printWindow.document.write(content);
    printWindow.document.close();
    printWindow.onload = () => {
      setTimeout(() => printWindow.print(), 250);
    };
  };

  const stats = reportData?.stats;

  return (
    <MainLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl gradient-pink flex items-center justify-center">
                <BarChart3 className="w-5 h-5 text-white" />
              </div>
              التقارير والإحصائيات
            </h1>
            <p className="text-muted-foreground mt-1">تحليل شامل للطلبات والإيرادات</p>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" onClick={handlePrint} className="gap-2">
              <Printer className="w-4 h-4" />
              طباعة
            </Button>
            <Button variant="outline" onClick={handleExportExcel} className="gap-2">
              <FileSpreadsheet className="w-4 h-4" />
              تصدير Excel
            </Button>
          </div>
        </div>

        {/* Quick Filters */}
        <Card>
          <CardContent className="pt-6">
            <div className="flex flex-col lg:flex-row gap-4">
              {/* Quick Filter Buttons */}
              <div className="flex flex-wrap gap-2">
                {QUICK_FILTERS.map((qf) => (
                  <Button
                    key={qf.value}
                    variant={quickFilter === qf.value ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => handleQuickFilterChange(qf.value)}
                  >
                    {qf.label}
                  </Button>
                ))}
              </div>

              {/* Date Range Pickers */}
              <div className="flex items-center gap-2">
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="outline" size="sm" className="gap-2">
                      <CalendarIcon className="w-4 h-4" />
                      {format(filters.dateRange.from, 'dd/MM/yyyy')}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={filters.dateRange.from}
                      onSelect={(date) => handleDateChange('from', date)}
                      className="p-3 pointer-events-auto"
                    />
                  </PopoverContent>
                </Popover>
                <span className="text-muted-foreground">إلى</span>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="outline" size="sm" className="gap-2">
                      <CalendarIcon className="w-4 h-4" />
                      {format(filters.dateRange.to, 'dd/MM/yyyy')}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={filters.dateRange.to}
                      onSelect={(date) => handleDateChange('to', date)}
                      className="p-3 pointer-events-auto"
                    />
                  </PopoverContent>
                </Popover>
              </div>

              {/* Advanced Filters Toggle */}
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowFilters(!showFilters)}
                className="gap-2"
              >
                <Filter className="w-4 h-4" />
                فلاتر متقدمة
                {(filters.branchIds.length > 0 || filters.statuses.length > 0) && (
                  <Badge variant="secondary" className="mr-1">
                    {filters.branchIds.length + filters.statuses.length}
                  </Badge>
                )}
              </Button>
            </div>

            {/* Advanced Filters Panel */}
            {showFilters && (
              <div className="mt-4 pt-4 border-t space-y-4">
                <div className="flex items-center justify-between">
                  <h4 className="font-medium">الفلاتر المتقدمة</h4>
                  {(filters.branchIds.length > 0 || filters.statuses.length > 0) && (
                    <Button variant="ghost" size="sm" onClick={clearFilters}>
                      مسح الكل
                    </Button>
                  )}
                </div>

                {/* Branch Filter */}
                <div>
                  <p className="text-sm text-muted-foreground mb-2">الفروع</p>
                  <div className="flex flex-wrap gap-2">
                    {branches?.map((branch) => (
                      <label
                        key={branch.id}
                        className={cn(
                          'flex items-center gap-2 px-3 py-2 rounded-lg border cursor-pointer transition-colors',
                          filters.branchIds.includes(branch.id)
                            ? 'bg-primary/10 border-primary'
                            : 'hover:bg-muted'
                        )}
                      >
                        <Checkbox
                          checked={filters.branchIds.includes(branch.id)}
                          onCheckedChange={() => handleBranchToggle(branch.id)}
                        />
                        <span className="text-sm">{branch.name}</span>
                      </label>
                    ))}
                  </div>
                </div>

                {/* Status Filter */}
                <div>
                  <p className="text-sm text-muted-foreground mb-2">حالة الطلب</p>
                  <div className="flex flex-wrap gap-2">
                    {STATUS_OPTIONS.map((status) => (
                      <label
                        key={status.value}
                        className={cn(
                          'flex items-center gap-2 px-3 py-2 rounded-lg border cursor-pointer transition-colors',
                          filters.statuses.includes(status.value as OrderStatus)
                            ? 'bg-primary/10 border-primary'
                            : 'hover:bg-muted'
                        )}
                      >
                        <Checkbox
                          checked={filters.statuses.includes(status.value as OrderStatus)}
                          onCheckedChange={() => handleStatusToggle(status.value as OrderStatus)}
                        />
                        <span className="text-sm">{status.label}</span>
                      </label>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
          </div>
        ) : error ? (
          <Card>
            <CardContent className="py-12 text-center">
              <p className="text-destructive">حدث خطأ في تحميل التقارير</p>
            </CardContent>
          </Card>
        ) : (
          <>
            {/* Summary Cards */}
            <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
                      <Package className="w-6 h-6 text-primary" />
                    </div>
                    <div>
                      <p className="text-3xl font-bold">{stats?.totalOrders || 0}</p>
                      <p className="text-sm text-muted-foreground">إجمالي الطلبات</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-xl bg-warning/20 flex items-center justify-center">
                      <Clock className="w-6 h-6 text-warning" />
                    </div>
                    <div>
                      <p className="text-3xl font-bold">{stats?.pendingApproval || 0}</p>
                      <p className="text-sm text-muted-foreground">بانتظار الموافقة</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-xl bg-info/20 flex items-center justify-center">
                      <TrendingUp className="w-6 h-6 text-info" />
                    </div>
                    <div>
                      <p className="text-3xl font-bold">{stats?.inPreparation || 0}</p>
                      <p className="text-sm text-muted-foreground">قيد التحضير</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-xl bg-success/20 flex items-center justify-center">
                      <CheckCircle2 className="w-6 h-6 text-success" />
                    </div>
                    <div>
                      <p className="text-3xl font-bold">{stats?.completed || 0}</p>
                      <p className="text-sm text-muted-foreground">مكتملة</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="col-span-2 lg:col-span-1">
                <CardContent className="pt-6">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
                      <DollarSign className="w-6 h-6 text-primary" />
                    </div>
                    <div>
                      <p className="text-2xl font-bold">{formatCurrency(stats?.totalRevenue || 0)}</p>
                      <p className="text-sm text-muted-foreground">إجمالي الإيرادات</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Tabs for Reports Sections */}
            <Tabs defaultValue="overview" className="space-y-6">
              <TabsList className="grid w-full grid-cols-3 lg:w-auto lg:inline-grid">
                <TabsTrigger value="overview" className="gap-2">
                  <BarChart3 className="w-4 h-4" />
                  نظرة عامة
                </TabsTrigger>
                <TabsTrigger value="comparison" className="gap-2">
                  <GitCompare className="w-4 h-4" />
                  مقارنة الفروع
                </TabsTrigger>
                <TabsTrigger value="details" className="gap-2">
                  <Store className="w-4 h-4" />
                  تفاصيل الطلبات
                </TabsTrigger>
              </TabsList>

              {/* Overview Tab */}
              <TabsContent value="overview" className="space-y-6">
                {/* Charts Row */}
                <div className="grid lg:grid-cols-2 gap-6">
                  {/* Orders Over Time */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">الطلبات حسب التاريخ</CardTitle>
                    </CardHeader>
                    <CardContent>
                      {stats?.ordersByDate && stats.ordersByDate.length > 0 ? (
                        <ResponsiveContainer width="100%" height={300}>
                          <LineChart data={stats.ordersByDate}>
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis
                              dataKey="date"
                              tickFormatter={(value) => format(new Date(value), 'dd/MM')}
                            />
                            <YAxis />
                            <Tooltip
                              labelFormatter={(value) => format(new Date(value), 'dd MMMM yyyy', { locale: ar })}
                              formatter={(value: number, name: string) => [
                                name === 'count' ? value : formatCurrency(value),
                                name === 'count' ? 'عدد الطلبات' : 'الإيرادات',
                              ]}
                            />
                            <Legend />
                            <Line
                              type="monotone"
                              dataKey="count"
                              name="عدد الطلبات"
                              stroke="#be7b7c"
                              strokeWidth={2}
                            />
                            <Line
                              type="monotone"
                              dataKey="revenue"
                              name="الإيرادات"
                              stroke="#7cb87c"
                              strokeWidth={2}
                            />
                          </LineChart>
                        </ResponsiveContainer>
                      ) : (
                        <div className="h-[300px] flex items-center justify-center text-muted-foreground">
                          لا توجد بيانات
                        </div>
                      )}
                    </CardContent>
                  </Card>

                  {/* Status Distribution */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">توزيع حالات الطلبات</CardTitle>
                    </CardHeader>
                    <CardContent>
                      {stats?.ordersByStatus && stats.ordersByStatus.length > 0 ? (
                        <ResponsiveContainer width="100%" height={300}>
                          <PieChart>
                            <Pie
                              data={stats.ordersByStatus.map((s) => ({
                                ...s,
                                name: STATUS_LABELS[s.status] || s.status,
                              }))}
                              cx="50%"
                              cy="50%"
                              innerRadius={60}
                              outerRadius={100}
                              paddingAngle={2}
                              dataKey="count"
                              nameKey="name"
                              label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`}
                            >
                              {stats.ordersByStatus.map((_, index) => (
                                <Cell key={`cell-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                              ))}
                            </Pie>
                            <Tooltip />
                          </PieChart>
                        </ResponsiveContainer>
                      ) : (
                        <div className="h-[300px] flex items-center justify-center text-muted-foreground">
                          لا توجد بيانات
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </div>

                {/* Revenue by Branch */}
                {stats?.revenueByBranch && stats.revenueByBranch.length > 0 && (
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg flex items-center gap-2">
                        <Store className="w-5 h-5" />
                        الإيرادات حسب الفرع
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <ResponsiveContainer width="100%" height={300}>
                        <BarChart data={stats.revenueByBranch}>
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis dataKey="branch_name" />
                          <YAxis />
                          <Tooltip
                            formatter={(value: number, name: string) => [
                              name === 'orders' ? value : formatCurrency(value),
                              name === 'orders' ? 'عدد الطلبات' : 'الإيرادات',
                            ]}
                          />
                          <Legend />
                          <Bar dataKey="revenue" name="الإيرادات" fill="#be7b7c" radius={[4, 4, 0, 0]} />
                          <Bar dataKey="orders" name="عدد الطلبات" fill="#7cb8b8" radius={[4, 4, 0, 0]} />
                        </BarChart>
                      </ResponsiveContainer>
                    </CardContent>
                  </Card>
                )}
              </TabsContent>

              {/* Branch Comparison Tab */}
              <TabsContent value="comparison">
                <BranchComparison
                  revenueByBranch={stats?.revenueByBranch || []}
                  orders={reportData?.orders || []}
                  formatCurrency={formatCurrency}
                />
              </TabsContent>

              {/* Details Tab */}
              <TabsContent value="details">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">تفاصيل الطلبات ({reportData?.orders.length || 0})</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="rounded-lg border overflow-auto">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>رقم الطلب</TableHead>
                            <TableHead>العميل</TableHead>
                            <TableHead>الفرع</TableHead>
                            <TableHead>الحالة</TableHead>
                            <TableHead>موعد الاستلام</TableHead>
                            <TableHead>المبلغ</TableHead>
                            <TableHead>حالة الدفع</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {reportData?.orders.length === 0 ? (
                            <TableRow>
                              <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                                لا توجد طلبات في هذه الفترة
                              </TableCell>
                            </TableRow>
                          ) : (
                            reportData?.orders.slice(0, 50).map((order) => (
                              <TableRow key={order.id}>
                                <TableCell className="font-mono">{order.order_number}</TableCell>
                                <TableCell>{order.customer_name || '-'}</TableCell>
                                <TableCell>{order.branch_name || '-'}</TableCell>
                                <TableCell>
                                  <Badge variant="secondary">
                                    {STATUS_LABELS[order.status] || order.status}
                                  </Badge>
                                </TableCell>
                                <TableCell>
                                  {order.delivery_date ? (
                                    <div className="text-sm">
                                      <p>{format(new Date(order.delivery_date), 'dd/MM/yyyy')}</p>
                                      {order.delivery_time && (
                                        <p className="text-muted-foreground">{order.delivery_time}</p>
                                      )}
                                    </div>
                                  ) : (
                                    '-'
                                  )}
                                </TableCell>
                                <TableCell className="font-medium">
                                  {formatCurrency(order.total_amount)}
                                </TableCell>
                                <TableCell>
                                  <Badge
                                    variant={order.payment_status === 'paid' ? 'default' : 'outline'}
                                  >
                                    {PAYMENT_STATUS_LABELS[order.payment_status || ''] || order.payment_status || '-'}
                                  </Badge>
                                </TableCell>
                              </TableRow>
                            ))
                          )}
                        </TableBody>
                      </Table>
                    </div>
                    {reportData?.orders && reportData.orders.length > 50 && (
                      <p className="text-sm text-muted-foreground mt-4 text-center">
                        يتم عرض أول 50 طلب. للاطلاع على جميع الطلبات، قم بتصدير التقرير.
                      </p>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </>
        )}
      </div>
    </MainLayout>
  );
}
