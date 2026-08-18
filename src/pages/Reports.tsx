import { useState, useCallback } from 'react';
import { MainLayout } from '@/components/layout/MainLayout';
import { PageHeader, LoadingState, ErrorState, SectionCard } from '@/components/ds';
import { Card, CardContent } from '@/components/ui/card';
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
  CalendarRange,
  Printer,
  TrendingUp,
  Package,
  Clock,
  CheckCircle2,
  DollarSign,
  Store,
  Filter,
  FileSpreadsheet,
  GitCompare,
  PieChart as PieChartIcon,
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
  ComposedChart,
  Area,
  Line,
  Legend,
} from 'recharts';
import { cn } from '@/lib/utils';
import { Price } from '@/components/ui/riyal';
import { formatSARText } from '@/lib/currency';
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

const CHART_COLORS = [
  'hsl(var(--primary))',
  'hsl(var(--info))',
  'hsl(var(--success))',
  'hsl(var(--warning))',
  'hsl(var(--destructive))',
  'hsl(var(--primary) / 0.6)',
  'hsl(var(--info) / 0.6)',
  'hsl(var(--success) / 0.6)',
];

export default function Reports() {
  const [quickFilter, setQuickFilter] = useState<QuickFilter>('this_month');
  const [filters, setFilters] = useState<ReportFilters>(() => ({
    dateRange: getDateRangeFromQuickFilter('this_month'),
    branchIds: [],
    statuses: [] as OrderStatus[],
  }));
  const [showFilters, setShowFilters] = useState(false);

  const { data: branches } = useBranches();
  const { data: reportData, isLoading, error, refetch } = useReportData(filters);

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

  // Text form (number + "ر.س") for non-JSX contexts — chart string formatters,
  // print HTML, and the BranchComparison prop. On-screen values use <Price /> (SVG symbol).
  const formatCurrency = (amount: number) => formatSARText(amount);

  const handleExportExcel = async () => {
    if (!reportData?.orders) return;

    // Lazy-load xlsx so its ~400KB stays out of the eager Reports chunk and is
    // only fetched when the user actually exports.
    const XLSX = await import('xlsx');

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
          /* Standalone print document — it opens in its own window, so the app's
             CSS variables don't reach it. Values are the Pink Cake palette
             written out literally; keep them in sync with :root in index.css. */
          @import url('https://fonts.googleapis.com/css2?family=Noto+Kufi+Arabic:wght@400;500;700&display=swap');
          body { font-family: 'Noto Kufi Arabic', sans-serif; direction: rtl; padding: 20px; color: #1a1919; background: #fdfbfc; }
          h1 { color: #612e37; text-align: center; font-weight: 500; letter-spacing: -0.005em; }
          h2 { margin-top: 20px; border-bottom: 2px solid #dbb2b9; padding-bottom: 5px; font-weight: 500; }
          table { width: 100%; border-collapse: collapse; margin-top: 15px; }
          th, td { border: 1px solid #eadcde; padding: 10px; text-align: right; }
          th { background: #f4e6e8; color: #612e37; font-weight: 700; }
          .summary { display: flex; gap: 20px; flex-wrap: wrap; margin: 20px 0; }
          .stat { padding: 15px; background: #f9f1f2; border-radius: 8px; }
          .stat-value { font-size: 24px; font-weight: 700; color: #612e37; }
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

  // KPI cards — revenue is featured (gradient); the rest track the order lifecycle.
  const kpis = [
    { key: 'total', label: 'إجمالي الطلبات', value: stats?.totalOrders ?? 0, icon: Package, box: 'bg-primary/10 text-primary' },
    { key: 'pending', label: 'بانتظار الموافقة', value: stats?.pendingApproval ?? 0, icon: Clock, box: 'bg-warning/10 text-warning' },
    { key: 'preparing', label: 'قيد التحضير', value: stats?.inPreparation ?? 0, icon: TrendingUp, box: 'bg-info/10 text-info' },
    { key: 'completed', label: 'مكتملة', value: stats?.completed ?? 0, icon: CheckCircle2, box: 'bg-success/10 text-success' },
  ];

  // Derived chart data — donut needs per-slice colours + a total for the centre label.
  const statusData = (stats?.ordersByStatus ?? []).map((s, i) => ({
    ...s,
    name: STATUS_LABELS[s.status] || s.status,
    color: CHART_COLORS[i % CHART_COLORS.length],
  }));
  const statusTotal = statusData.reduce((sum, d) => sum + d.count, 0);
  const compactNumber = (v: number) => new Intl.NumberFormat('en-US', { notation: 'compact', maximumFractionDigits: 1 }).format(v);

  return (
    <MainLayout>
      <div className="space-y-6">
        <PageHeader
          title="التقارير والإحصائيات"
          description="تحليل شامل للطلبات والإيرادات"
          icon={BarChart3}
          actions={
            <>
              <Button variant="outline" onClick={handlePrint} className="gap-2">
                <Printer className="w-4 h-4" />
                طباعة
              </Button>
              <Button variant="outline" onClick={handleExportExcel} className="gap-2">
                <FileSpreadsheet className="w-4 h-4" />
                تصدير Excel
              </Button>
            </>
          }
        />

        {/* Quick Filters — command bar */}
        <Card className="rounded-2xl border-border/60 bg-card shadow-sm">
          <CardContent className="p-4 sm:p-5">
            <div className="flex flex-wrap items-center gap-3">
              {/* Label — anchors the bar; subtitle live-derives the active preset */}
              <div className="flex shrink-0 items-center gap-2.5">
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl gradient-pink shadow-warm">
                  <CalendarRange className="h-5 w-5 text-white" />
                </div>
                <div className="leading-tight">
                  <p className="text-sm font-semibold text-foreground">الفترة الزمنية</p>
                  <p className="mt-0.5 text-xs text-muted-foreground">
                    {QUICK_FILTERS.find((qf) => qf.value === quickFilter)?.label}
                  </p>
                </div>
              </div>

              {/* Divider */}
              <div className="hidden h-8 self-center border-e border-border/60 sm:block" aria-hidden="true" />

              {/* Preset segmented control — one connected track; scrolls rather than wraps */}
              <div className="min-w-0 overflow-x-auto scrollbar-none">
                <div
                  role="group"
                  aria-label="اختصارات الفترة"
                  className="inline-flex h-11 w-max items-center gap-1 rounded-xl border border-border/60 bg-muted/40 p-1"
                >
                  {QUICK_FILTERS.map((qf) => {
                    const isActive = quickFilter === qf.value;
                    return (
                      <button
                        key={qf.value}
                        type="button"
                        aria-pressed={isActive}
                        onClick={() => handleQuickFilterChange(qf.value)}
                        className={cn(
                          'press h-full whitespace-nowrap rounded-lg px-3.5 text-sm font-medium transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40',
                          isActive
                            ? 'gradient-pink sheen text-white shadow-warm'
                            : 'text-muted-foreground hover:bg-background hover:text-foreground'
                        )}
                      >
                        {qf.label}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Date range — two single-date pickers; foregrounds when 'مخصص' (custom) is active */}
              <div
                className={cn(
                  'flex h-11 shrink-0 items-center gap-0.5 rounded-xl border p-1 transition-all duration-200',
                  quickFilter === 'custom'
                    ? 'border-primary/50 bg-primary/[0.05] shadow-warm ring-2 ring-primary/15'
                    : 'border-border/60 bg-background'
                )}
              >
                <CalendarIcon
                  className={cn(
                    'ms-1.5 me-0.5 h-4 w-4 shrink-0 transition-colors',
                    quickFilter === 'custom' ? 'text-primary' : 'text-muted-foreground'
                  )}
                />
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="press h-9 rounded-lg px-2.5 font-medium tabular-nums hover:bg-primary/10"
                    >
                      {format(filters.dateRange.from, 'dd/MM/yyyy')}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={filters.dateRange.from}
                      onSelect={(date) => handleDateChange('from', date)}
                      locale={ar}
                      className="p-3 pointer-events-auto"
                    />
                  </PopoverContent>
                </Popover>
                <span className="select-none px-0.5 text-xs font-medium text-muted-foreground">إلى</span>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="press h-9 rounded-lg px-2.5 font-medium tabular-nums hover:bg-primary/10"
                    >
                      {format(filters.dateRange.to, 'dd/MM/yyyy')}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={filters.dateRange.to}
                      onSelect={(date) => handleDateChange('to', date)}
                      locale={ar}
                      className="p-3 pointer-events-auto"
                    />
                  </PopoverContent>
                </Popover>
              </div>

              {/* Advanced filters — pinned to the inline-end; tints when open */}
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowFilters(!showFilters)}
                aria-expanded={showFilters}
                className={cn(
                  'press h-11 shrink-0 gap-2 rounded-xl border px-4 ms-auto',
                  showFilters
                    ? 'border-primary/40 bg-primary/10 text-primary hover:bg-primary/15 hover:text-primary'
                    : 'border-border/60 bg-card text-muted-foreground hover:text-foreground hover:bg-muted'
                )}
              >
                <Filter className="h-4 w-4" />
                فلاتر متقدمة
                {(filters.branchIds.length > 0 || filters.statuses.length > 0) && (
                  <Badge
                    variant="secondary"
                    className="ms-1 h-5 min-w-5 justify-center rounded-full px-1.5 tabular-nums"
                  >
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
          <LoadingState label="جاري تحميل التقارير..." />
        ) : error ? (
          <ErrorState title="حدث خطأ في تحميل التقارير" onRetry={() => refetch()} />
        ) : (
          <>
            {/* KPI cards — revenue featured (gradient), then order-lifecycle stats */}
            <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
              {/* Revenue — featured */}
              <div className="col-span-2 lg:col-span-1 relative overflow-hidden rounded-2xl gradient-pink text-white shadow-warm p-5 flex flex-col justify-between min-h-[128px]">
                <div className="absolute -top-8 -end-8 w-28 h-28 rounded-full bg-white/10" aria-hidden="true" />
                <div className="w-11 h-11 rounded-xl bg-white/20 flex items-center justify-center">
                  <DollarSign className="w-6 h-6" />
                </div>
                <div className="relative">
                  <Price amount={stats?.totalRevenue ?? 0} className="text-2xl font-bold leading-tight" />
                  <p className="text-xs text-white/85 mt-1">إجمالي الإيرادات</p>
                </div>
              </div>

              {kpis.map((k) => (
                <div
                  key={k.key}
                  className="rounded-2xl border border-border/60 bg-card shadow-sm p-5 flex flex-col justify-between min-h-[128px] transition-shadow hover:shadow-warm"
                >
                  <div className={cn('w-11 h-11 rounded-xl flex items-center justify-center', k.box)}>
                    <k.icon className="w-6 h-6" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold leading-none tabular-nums">{k.value}</p>
                    <p className="text-xs text-muted-foreground mt-1.5">{k.label}</p>
                  </div>
                </div>
              ))}
            </div>

            {/* Tabs for Reports Sections */}
            <Tabs defaultValue="overview" dir="rtl" className="space-y-6">
              <TabsList className="grid w-full grid-cols-3 lg:w-auto lg:inline-grid">
                <TabsTrigger value="overview" className="gap-2">
                  <BarChart3 className="w-4 h-4" />
                  نظرة عامة
                </TabsTrigger>
                <TabsTrigger value="comparison" className="gap-2">
                  <GitCompare className="w-4 h-4" />
                  مقارنة الفروع
                  {(stats?.revenueByBranch.length ?? 0) > 0 && (
                    <Badge variant="secondary" className="ms-1">{stats?.revenueByBranch.length}</Badge>
                  )}
                </TabsTrigger>
                <TabsTrigger value="details" className="gap-2">
                  <Store className="w-4 h-4" />
                  تفاصيل الطلبات
                  {(reportData?.orders.length ?? 0) > 0 && (
                    <Badge variant="secondary" className="ms-1">{reportData?.orders.length}</Badge>
                  )}
                </TabsTrigger>
              </TabsList>

              {/* Overview Tab */}
              <TabsContent value="overview" className="space-y-6">
                {/* Charts Row */}
                <div className="grid lg:grid-cols-2 gap-6">
                  {/* Orders Over Time */}
                  <SectionCard title="الطلبات حسب التاريخ" icon={TrendingUp}>
                    {stats?.ordersByDate && stats.ordersByDate.length > 0 ? (
                      <ResponsiveContainer width="100%" height={280}>
                        <ComposedChart data={stats.ordersByDate} margin={{ top: 10, right: 4, left: -8, bottom: 0 }}>
                          <defs>
                            <linearGradient id="ordersFill" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.28} />
                              <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                            </linearGradient>
                          </defs>
                          <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
                          <XAxis
                            dataKey="date"
                            tickFormatter={(value) => format(new Date(value), 'dd/MM')}
                            tick={{ fontSize: 12, fill: 'hsl(var(--muted-foreground))' }}
                            tickLine={false}
                            axisLine={false}
                          />
                          <YAxis
                            yAxisId="count"
                            tick={{ fontSize: 12, fill: 'hsl(var(--muted-foreground))' }}
                            tickLine={false}
                            axisLine={false}
                            width={32}
                            allowDecimals={false}
                          />
                          <YAxis
                            yAxisId="revenue"
                            orientation="right"
                            tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }}
                            tickLine={false}
                            axisLine={false}
                            width={44}
                            tickFormatter={compactNumber}
                          />
                          <Tooltip
                            contentStyle={{ borderRadius: 12, border: '1px solid hsl(var(--border))', fontSize: 13, boxShadow: '0 8px 24px hsl(var(--primary) / 0.12)' }}
                            labelFormatter={(value) => format(new Date(value), 'dd MMMM yyyy', { locale: ar })}
                            formatter={(value: number, name: string) => [
                              name === 'الإيرادات' ? formatCurrency(value) : value,
                              name,
                            ]}
                          />
                          <Legend iconType="circle" wrapperStyle={{ fontSize: 13, paddingTop: 8 }} />
                          <Area
                            yAxisId="count"
                            type="monotone"
                            dataKey="count"
                            name="عدد الطلبات"
                            stroke="hsl(var(--primary))"
                            strokeWidth={2.5}
                            fill="url(#ordersFill)"
                            dot={{ r: 3, strokeWidth: 0, fill: 'hsl(var(--primary))' }}
                            activeDot={{ r: 5 }}
                          />
                          <Line
                            yAxisId="revenue"
                            type="monotone"
                            dataKey="revenue"
                            name="الإيرادات"
                            stroke="hsl(var(--success))"
                            strokeWidth={2.5}
                            dot={{ r: 3, strokeWidth: 0, fill: 'hsl(var(--success))' }}
                            activeDot={{ r: 5 }}
                          />
                        </ComposedChart>
                      </ResponsiveContainer>
                    ) : (
                      <div className="h-[280px] flex items-center justify-center text-muted-foreground">
                        لا توجد بيانات
                      </div>
                    )}
                  </SectionCard>

                  {/* Status Distribution */}
                  <SectionCard title="توزيع حالات الطلبات" icon={PieChartIcon}>
                    {statusData.length > 0 ? (
                      <div className="flex flex-col sm:flex-row items-center gap-6">
                        <div className="relative shrink-0" style={{ width: 216, height: 216 }}>
                          <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                              <Pie
                                data={statusData}
                                cx="50%"
                                cy="50%"
                                innerRadius={72}
                                outerRadius={104}
                                paddingAngle={3}
                                dataKey="count"
                                nameKey="name"
                                stroke="none"
                              >
                                {statusData.map((d, index) => (
                                  <Cell key={`cell-${index}`} fill={d.color} />
                                ))}
                              </Pie>
                              <Tooltip
                                contentStyle={{ borderRadius: 12, border: '1px solid hsl(var(--border))', fontSize: 13 }}
                                formatter={(value: number, name: string) => [value, name]}
                              />
                            </PieChart>
                          </ResponsiveContainer>
                          <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                            <span className="text-3xl font-bold leading-none tabular-nums">{statusTotal}</span>
                            <span className="text-xs text-muted-foreground mt-1">إجمالي الطلبات</span>
                          </div>
                        </div>
                        <div className="flex-1 w-full space-y-2.5">
                          {statusData.map((d, index) => (
                            <div key={index} className="flex items-center justify-between gap-3">
                              <div className="flex items-center gap-2 min-w-0">
                                <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: d.color }} />
                                <span className="text-sm truncate">{d.name}</span>
                              </div>
                              <div className="flex items-center gap-2 shrink-0">
                                <span className="text-sm font-semibold tabular-nums">{d.count}</span>
                                <span className="text-xs text-muted-foreground tabular-nums w-9 text-start">
                                  {statusTotal ? Math.round((d.count / statusTotal) * 100) : 0}%
                                </span>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    ) : (
                      <div className="h-[216px] flex items-center justify-center text-muted-foreground">
                        لا توجد بيانات
                      </div>
                    )}
                  </SectionCard>
                </div>

                {/* Revenue by Branch */}
                {stats?.revenueByBranch && stats.revenueByBranch.length > 0 && (
                  <SectionCard title="الإيرادات حسب الفرع" icon={Store}>
                    <ResponsiveContainer width="100%" height={300}>
                      <BarChart data={stats.revenueByBranch} margin={{ top: 10, right: 4, left: 4, bottom: 0 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
                        <XAxis
                          dataKey="branch_name"
                          tick={{ fontSize: 12, fill: 'hsl(var(--muted-foreground))' }}
                          tickLine={false}
                          axisLine={false}
                        />
                        <YAxis
                          tick={{ fontSize: 12, fill: 'hsl(var(--muted-foreground))' }}
                          tickLine={false}
                          axisLine={false}
                          width={52}
                          tickFormatter={compactNumber}
                        />
                        <Tooltip
                          cursor={{ fill: 'hsl(var(--muted) / 0.5)' }}
                          contentStyle={{ borderRadius: 12, border: '1px solid hsl(var(--border))', fontSize: 13 }}
                          formatter={(value: number) => [formatCurrency(value), 'الإيرادات']}
                        />
                        <Bar dataKey="revenue" name="الإيرادات" radius={[8, 8, 0, 0]} maxBarSize={72}>
                          {stats.revenueByBranch.map((_, index) => (
                            <Cell key={`bar-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                          ))}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  </SectionCard>
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
                <SectionCard title={`تفاصيل الطلبات (${reportData?.orders.length || 0})`} icon={Package}>
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
                                <Price amount={order.total_amount} />
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
                </SectionCard>
              </TabsContent>
            </Tabs>
          </>
        )}
      </div>
    </MainLayout>
  );
}
