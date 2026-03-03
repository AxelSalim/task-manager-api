'use client';

import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

type FinanceMonthChartProps = {
  totalRevenus: number;
  totalDepenses: number;
  monthLabel: string;
};

const REVENUS_COLOR = '#16a34a';
const DEPENSES_COLOR = '#dc2626';

export function FinanceMonthChart({
  totalRevenus,
  totalDepenses,
  monthLabel,
}: FinanceMonthChartProps) {
  const data = [
    { name: 'Revenus', value: totalRevenus, fill: REVENUS_COLOR },
    { name: 'Dépenses', value: totalDepenses, fill: DEPENSES_COLOR },
  ];

  return (
    <Card className="rounded-sm border shadow-none">
      <CardHeader className="py-3 px-4 border-b">
        <CardTitle className="text-base font-semibold">
          Revenus vs Dépenses — {monthLabel}
        </CardTitle>
      </CardHeader>
      <CardContent className="p-4">
        <div className="h-[260px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={data}
              margin={{ top: 12, right: 12, left: 0, bottom: 0 }}
              barCategoryGap="40%"
              barGap={8}
            >
              <CartesianGrid
                strokeDasharray="3 3"
                vertical={false}
                stroke="hsl(var(--border))"
              />
              <XAxis
                dataKey="name"
                tick={{ fontSize: 12, fill: 'hsl(var(--muted-foreground))' }}
                axisLine={false}
                tickLine={false}
              />
              <YAxis
                tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }}
                axisLine={false}
                tickLine={false}
                tickFormatter={(v) =>
                  v >= 1000 ? `${(v / 1000).toFixed(0)}k` : String(v)
                }
              />
              <Tooltip
                cursor={{ fill: 'hsl(var(--muted))', opacity: 0.3 }}
                contentStyle={{
                  borderRadius: 4,
                  border: '1px solid hsl(var(--border))',
                  fontSize: 12,
                }}
                formatter={(value: number) => [
                  `${Number(value).toLocaleString('fr-FR')} CFA`,
                  '',
                ]}
              />
              <Bar dataKey="value" radius={[2, 2, 0, 0]} maxBarSize={80}>
                {data.map((entry, index) => (
                  <Cell key={index} fill={entry.fill} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}
