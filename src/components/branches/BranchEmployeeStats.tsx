import { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';
import { Tables } from '@/integrations/supabase/types';
import { Users, Building2, UserCheck } from 'lucide-react';

type Branch = Tables<'branches'>;

interface BranchEmployeeStatsProps {
  branches: Branch[];
  employeeCounts: Record<string, number>;
}

// Pie palette — token-driven so it re-tints with the brand, same as
// CHART_COLORS in Reports.tsx. Half of this list used to be raw rose HSL.
const COLORS = [
  'hsl(var(--primary))',
  'hsl(var(--gold))',
  'hsl(var(--info))',
  'hsl(var(--success))',
  'hsl(var(--rose))',
  'hsl(var(--seasonal))',
  'hsl(var(--primary) / 0.55)',
  'hsl(var(--info) / 0.55)',
];

export function BranchEmployeeStats({ branches, employeeCounts }: BranchEmployeeStatsProps) {
  const { chartData, totalEmployees, branchesWithEmployees, avgPerBranch } = useMemo(() => {
    const data = branches
      .map((branch, index) => ({
        name: branch.name,
        value: employeeCounts[branch.id] || 0,
        color: COLORS[index % COLORS.length],
      }))
      .filter((item) => item.value > 0)
      .sort((a, b) => b.value - a.value);

    const total = Object.values(employeeCounts).reduce((sum, count) => sum + count, 0);
    const withEmployees = data.length;
    const avg = withEmployees > 0 ? (total / withEmployees).toFixed(1) : '0';

    return {
      chartData: data,
      totalEmployees: total,
      branchesWithEmployees: withEmployees,
      avgPerBranch: avg,
    };
  }, [branches, employeeCounts]);

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      const percentage = ((data.value / totalEmployees) * 100).toFixed(1);
      return (
        <div className="bg-popover border border-border rounded-lg p-3 shadow-lg">
          <p className="font-medium text-foreground">{data.name}</p>
          <p className="text-sm text-muted-foreground">
            {data.value} موظف ({percentage}%)
          </p>
        </div>
      );
    }
    return null;
  };

  const renderCustomLabel = ({ cx, cy, midAngle, innerRadius, outerRadius, percent }: any) => {
    if (percent < 0.05) return null; // Don't show label for small slices
    const RADIAN = Math.PI / 180;
    const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
    const x = cx + radius * Math.cos(-midAngle * RADIAN);
    const y = cy + radius * Math.sin(-midAngle * RADIAN);

    return (
      <text
        x={x}
        y={y}
        fill="white"
        textAnchor="middle"
        dominantBaseline="central"
        className="text-xs font-medium"
      >
        {`${(percent * 100).toFixed(0)}%`}
      </text>
    );
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
      {/* Summary Stats */}
      <Card className="lg:col-span-1">
        <CardHeader className="pb-2">
          <CardTitle className="text-lg">ملخص الإحصائيات</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-3 p-3 rounded-lg bg-primary/10">
            <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center">
              <Users className="w-5 h-5 text-primary" />
            </div>
            <div>
              <p className="text-2xl font-bold text-primary">{totalEmployees}</p>
              <p className="text-sm text-muted-foreground">إجمالي الموظفين</p>
            </div>
          </div>

          <div className="flex items-center gap-3 p-3 rounded-lg bg-muted">
            <div className="w-10 h-10 rounded-full bg-muted-foreground/20 flex items-center justify-center">
              <Building2 className="w-5 h-5 text-muted-foreground" />
            </div>
            <div>
              <p className="text-2xl font-bold">{branchesWithEmployees}</p>
              <p className="text-sm text-muted-foreground">فروع بها موظفين</p>
            </div>
          </div>

          <div className="flex items-center gap-3 p-3 rounded-lg bg-muted">
            <div className="w-10 h-10 rounded-full bg-muted-foreground/20 flex items-center justify-center">
              <UserCheck className="w-5 h-5 text-muted-foreground" />
            </div>
            <div>
              <p className="text-2xl font-bold">{avgPerBranch}</p>
              <p className="text-sm text-muted-foreground">متوسط الموظفين لكل فرع</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Pie Chart */}
      <Card className="lg:col-span-2">
        <CardHeader className="pb-2">
          <CardTitle className="text-lg">توزيع الموظفين على الفروع</CardTitle>
        </CardHeader>
        <CardContent>
          {chartData.length > 0 ? (
            <div className="h-[280px]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={chartData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={renderCustomLabel}
                    outerRadius={100}
                    innerRadius={40}
                    paddingAngle={2}
                    dataKey="value"
                  >
                    {chartData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} stroke="none" />
                    ))}
                  </Pie>
                  <Tooltip content={<CustomTooltip />} />
                  <Legend
                    layout="vertical"
                    verticalAlign="middle"
                    align="left"
                    wrapperStyle={{ paddingRight: '20px' }}
                    formatter={(value: string) => (
                      <span className="text-sm text-foreground">{value}</span>
                    )}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="h-[280px] flex items-center justify-center">
              <div className="text-center text-muted-foreground">
                <Users className="w-12 h-12 mx-auto mb-2 opacity-50" />
                <p>لا يوجد موظفين معينين للفروع</p>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
