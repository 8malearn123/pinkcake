import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
} from 'recharts';
import { Store, TrendingUp, TrendingDown, Minus, Award, Target } from 'lucide-react';
import { cn } from '@/lib/utils';

interface BranchPerformance {
  branch_id: string;
  branch_name: string;
  revenue: number;
  orders: number;
  avgOrderValue: number;
  completionRate: number;
  pendingOrders: number;
  completedOrders: number;
}

interface BranchComparisonProps {
  revenueByBranch: { branch_id: string; branch_name: string; revenue: number; orders: number }[];
  orders: { branch_id: string | null; branch_name: string | null; status: string; total_amount: number }[];
  formatCurrency: (amount: number) => string;
}

export function BranchComparison({ revenueByBranch, orders, formatCurrency }: BranchComparisonProps) {
  // Calculate detailed branch performance
  const branchPerformance: BranchPerformance[] = revenueByBranch.map((branch) => {
    const branchOrders = orders.filter((o) => o.branch_id === branch.branch_id);
    const completedOrders = branchOrders.filter((o) => o.status === 'completed').length;
    const pendingOrders = branchOrders.filter((o) => o.status === 'pending_approval').length;
    const completionRate = branchOrders.length > 0 ? (completedOrders / branchOrders.length) * 100 : 0;
    const avgOrderValue = branch.orders > 0 ? branch.revenue / branch.orders : 0;

    return {
      branch_id: branch.branch_id,
      branch_name: branch.branch_name,
      revenue: branch.revenue,
      orders: branch.orders,
      avgOrderValue,
      completionRate,
      pendingOrders,
      completedOrders,
    };
  });

  // Sort by revenue to determine rankings
  const sortedByRevenue = [...branchPerformance].sort((a, b) => b.revenue - a.revenue);
  const sortedByOrders = [...branchPerformance].sort((a, b) => b.orders - a.orders);
  const sortedByAvg = [...branchPerformance].sort((a, b) => b.avgOrderValue - a.avgOrderValue);
  const sortedByCompletion = [...branchPerformance].sort((a, b) => b.completionRate - a.completionRate);

  // Calculate averages for comparison
  const avgRevenue = branchPerformance.reduce((sum, b) => sum + b.revenue, 0) / branchPerformance.length || 0;
  const avgOrders = branchPerformance.reduce((sum, b) => sum + b.orders, 0) / branchPerformance.length || 0;
  const avgOrderValue = branchPerformance.reduce((sum, b) => sum + b.avgOrderValue, 0) / branchPerformance.length || 0;

  // Prepare radar chart data (normalized to 100)
  const maxRevenue = Math.max(...branchPerformance.map((b) => b.revenue), 1);
  const maxOrders = Math.max(...branchPerformance.map((b) => b.orders), 1);
  const maxAvgOrder = Math.max(...branchPerformance.map((b) => b.avgOrderValue), 1);

  const radarData = [
    {
      metric: 'الإيرادات',
      ...Object.fromEntries(
        branchPerformance.map((b) => [b.branch_name, (b.revenue / maxRevenue) * 100])
      ),
    },
    {
      metric: 'عدد الطلبات',
      ...Object.fromEntries(
        branchPerformance.map((b) => [b.branch_name, (b.orders / maxOrders) * 100])
      ),
    },
    {
      metric: 'متوسط الطلب',
      ...Object.fromEntries(
        branchPerformance.map((b) => [b.branch_name, (b.avgOrderValue / maxAvgOrder) * 100])
      ),
    },
    {
      metric: 'معدل الإنجاز',
      ...Object.fromEntries(branchPerformance.map((b) => [b.branch_name, b.completionRate])),
    },
  ];

  const RADAR_COLORS = ['#be7b7c', '#7cb87c', '#7c7cb8', '#b87c7c', '#7cb8b8'];

  const getPerformanceIndicator = (value: number, average: number) => {
    const diff = ((value - average) / average) * 100;
    if (diff > 10) {
      return { icon: TrendingUp, color: 'text-success', bg: 'bg-success/10', label: 'فوق المتوسط' };
    } else if (diff < -10) {
      return { icon: TrendingDown, color: 'text-destructive', bg: 'bg-destructive/10', label: 'تحت المتوسط' };
    }
    return { icon: Minus, color: 'text-warning', bg: 'bg-warning/10', label: 'متوسط' };
  };

  const getRank = (branchId: string, sortedList: BranchPerformance[]) => {
    return sortedList.findIndex((b) => b.branch_id === branchId) + 1;
  };

  if (branchPerformance.length === 0) {
    return (
      <Card>
        <CardContent className="py-12 text-center text-muted-foreground">
          لا توجد بيانات فروع للمقارنة
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Top Performers */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="border-2 border-warning/30 bg-gradient-to-br from-yellow-50 to-amber-50">
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-warning/10 flex items-center justify-center">
                <Award className="w-6 h-6 text-warning" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">الأعلى إيرادات</p>
                <p className="text-lg font-bold">{sortedByRevenue[0]?.branch_name || '-'}</p>
                <p className="text-sm text-primary font-medium">
                  {formatCurrency(sortedByRevenue[0]?.revenue || 0)}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-2 border-info/30 bg-gradient-to-br from-blue-50 to-cyan-50">
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-info/10 flex items-center justify-center">
                <Target className="w-6 h-6 text-info" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">الأكثر طلبات</p>
                <p className="text-lg font-bold">{sortedByOrders[0]?.branch_name || '-'}</p>
                <p className="text-sm text-info font-medium">
                  {sortedByOrders[0]?.orders || 0} طلب
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-2 border-success/30 bg-gradient-to-br from-green-50 to-emerald-50">
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-success/10 flex items-center justify-center">
                <TrendingUp className="w-6 h-6 text-success" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">الأعلى متوسط طلب</p>
                <p className="text-lg font-bold">{sortedByAvg[0]?.branch_name || '-'}</p>
                <p className="text-sm text-success font-medium">
                  {formatCurrency(sortedByAvg[0]?.avgOrderValue || 0)}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-2 border-primary/30 bg-gradient-to-br from-purple-50 to-violet-50">
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
                <Store className="w-6 h-6 text-primary" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">الأعلى معدل إنجاز</p>
                <p className="text-lg font-bold">{sortedByCompletion[0]?.branch_name || '-'}</p>
                <p className="text-sm text-primary font-medium">
                  {sortedByCompletion[0]?.completionRate.toFixed(1) || 0}%
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Comparison Charts */}
      <div className="grid lg:grid-cols-2 gap-6">
        {/* Stacked Bar Comparison */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Store className="w-5 h-5" />
              مقارنة الإيرادات والطلبات
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={branchPerformance} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis type="number" />
                <YAxis dataKey="branch_name" type="category" width={100} />
                <Tooltip
                  formatter={(value: number, name: string) => [
                    name === 'orders' ? `${value} طلب` : formatCurrency(value),
                    name === 'orders' ? 'عدد الطلبات' : 'الإيرادات',
                  ]}
                />
                <Legend />
                <Bar dataKey="revenue" name="الإيرادات" fill="#be7b7c" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Radar Chart */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Target className="w-5 h-5" />
              مؤشرات الأداء المقارنة
            </CardTitle>
          </CardHeader>
          <CardContent>
            {branchPerformance.length <= 5 ? (
              <ResponsiveContainer width="100%" height={300}>
                <RadarChart data={radarData}>
                  <PolarGrid />
                  <PolarAngleAxis dataKey="metric" />
                  <PolarRadiusAxis angle={30} domain={[0, 100]} />
                  {branchPerformance.map((branch, index) => (
                    <Radar
                      key={branch.branch_id}
                      name={branch.branch_name}
                      dataKey={branch.branch_name}
                      stroke={RADAR_COLORS[index % RADAR_COLORS.length]}
                      fill={RADAR_COLORS[index % RADAR_COLORS.length]}
                      fillOpacity={0.2}
                    />
                  ))}
                  <Legend />
                  <Tooltip />
                </RadarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-[300px] flex items-center justify-center text-muted-foreground">
                يتم عرض الرسم البياني الرادار لـ 5 فروع أو أقل
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Detailed Comparison Table */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Store className="w-5 h-5" />
            جدول مقارنة الفروع التفصيلي
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="rounded-lg border overflow-auto">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/50">
                  <TableHead className="font-bold">الفرع</TableHead>
                  <TableHead className="text-center font-bold">الإيرادات</TableHead>
                  <TableHead className="text-center font-bold">ترتيب الإيرادات</TableHead>
                  <TableHead className="text-center font-bold">عدد الطلبات</TableHead>
                  <TableHead className="text-center font-bold">متوسط قيمة الطلب</TableHead>
                  <TableHead className="text-center font-bold">معدل الإنجاز</TableHead>
                  <TableHead className="text-center font-bold">الأداء العام</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {branchPerformance.map((branch, index) => {
                  const revenueIndicator = getPerformanceIndicator(branch.revenue, avgRevenue);
                  const ordersIndicator = getPerformanceIndicator(branch.orders, avgOrders);
                  const rank = getRank(branch.branch_id, sortedByRevenue);

                  return (
                    <TableRow key={branch.branch_id} className={index === 0 ? 'bg-warning/50' : ''}>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          {rank === 1 && <Award className="w-4 h-4 text-warning" />}
                          <span className="font-medium">{branch.branch_name}</span>
                        </div>
                      </TableCell>
                      <TableCell className="text-center">
                        <div className="flex items-center justify-center gap-2">
                          <span className="font-bold">{formatCurrency(branch.revenue)}</span>
                          <div className={cn('w-6 h-6 rounded-full flex items-center justify-center', revenueIndicator.bg)}>
                            <revenueIndicator.icon className={cn('w-3 h-3', revenueIndicator.color)} />
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="text-center">
                        <Badge
                          variant={rank === 1 ? 'default' : rank === 2 ? 'secondary' : 'outline'}
                          className={cn(
                            rank === 1 && 'bg-warning hover:bg-warning',
                            rank === 2 && 'bg-muted-foreground/20 hover:bg-muted-foreground/20',
                            rank === 3 && 'bg-warning hover:bg-warning text-white'
                          )}
                        >
                          #{rank}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-center">
                        <div className="flex items-center justify-center gap-2">
                          <span className="font-medium">{branch.orders}</span>
                          <div className={cn('w-6 h-6 rounded-full flex items-center justify-center', ordersIndicator.bg)}>
                            <ordersIndicator.icon className={cn('w-3 h-3', ordersIndicator.color)} />
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="text-center font-medium">
                        {formatCurrency(branch.avgOrderValue)}
                      </TableCell>
                      <TableCell className="text-center">
                        <div className="flex items-center justify-center gap-2">
                          <div className="w-16 h-2 bg-muted rounded-full overflow-hidden">
                            <div
                              className={cn(
                                'h-full rounded-full',
                                branch.completionRate >= 80 ? 'bg-success' :
                                branch.completionRate >= 50 ? 'bg-warning' : 'bg-destructive'
                              )}
                              style={{ width: `${branch.completionRate}%` }}
                            />
                          </div>
                          <span className="text-sm font-medium">{branch.completionRate.toFixed(0)}%</span>
                        </div>
                      </TableCell>
                      <TableCell className="text-center">
                        <Badge variant="outline" className={cn(revenueIndicator.bg, revenueIndicator.color, 'border-0')}>
                          {revenueIndicator.label}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>

          {/* Summary Stats */}
          <div className="mt-4 p-4 bg-muted/50 rounded-lg">
            <p className="text-sm text-muted-foreground mb-2">ملخص المتوسطات:</p>
            <div className="flex flex-wrap gap-4">
              <div className="flex items-center gap-2">
                <span className="text-sm">متوسط الإيرادات:</span>
                <Badge variant="secondary">{formatCurrency(avgRevenue)}</Badge>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-sm">متوسط الطلبات:</span>
                <Badge variant="secondary">{avgOrders.toFixed(0)} طلب</Badge>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-sm">متوسط قيمة الطلب:</span>
                <Badge variant="secondary">{formatCurrency(avgOrderValue)}</Badge>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
