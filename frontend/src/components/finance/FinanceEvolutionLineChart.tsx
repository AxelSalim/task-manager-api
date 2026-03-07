'use client';

import {
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import type { FinanceEvolutionMonthDto } from '@/lib/api';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

type FinanceEvolutionLineChartProps = {
  data: FinanceEvolutionMonthDto[];
};

export function FinanceEvolutionLineChart({ data }: FinanceEvolutionLineChartProps) {
  const chartData = data.map((d) => ({
    ...d,
    label: format(new Date(d.year, d.month - 1), 'MMM yy', { locale: fr }),
  }));

  if (chartData.length === 0) return null;

  return (
    <Card className="rounded-sm border shadow-none">
      <CardHeader className="py-3 px-4 border-b">
        <CardTitle className="text-base font-semibold">
          Évolution Revenus / Dépenses
        </CardTitle>
      </CardHeader>
      <CardContent className="p-4">
        <div className="h-[260px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData} margin={{ top: 12, right: 12, left: 0, bottom: 0 }}>
              <XAxis
                dataKey="label"
                tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }}
                axisLine={false}
                tickLine={false}
              />
              <YAxis
                tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }}
                axisLine={false}
                tickLine={false}
                tickFormatter={(v) => (v >= 1000 ? `${(v / 1000).toFixed(0)}k` : String(v))}
              />
              <Tooltip
                contentStyle={{
                  borderRadius: 4,
                  border: '1px solid hsl(var(--border))',
                  fontSize: 12,
                }}
                formatter={(value: number) => [`${Number(value).toLocaleString('fr-FR')} CFA`, '']}
                labelFormatter={(_, payload) => payload?.[0]?.payload?.label ?? ''}
              />
              <Legend
                wrapperStyle={{ fontSize: 12 }}
                formatter={(value) => (value === 'totalRevenus' ? 'Revenus' : 'Dépenses')}
              />
              <Line
                type="monotone"
                dataKey="totalRevenus"
                name="totalRevenus"
                stroke="#16a34a"
                strokeWidth={2}
                dot={{ fill: '#16a34a', r: 3 }}
                activeDot={{ r: 4 }}
              />
              <Line
                type="monotone"
                dataKey="totalDepenses"
                name="totalDepenses"
                stroke="#dc2626"
                strokeWidth={2}
                dot={{ fill: '#dc2626', r: 3 }}
                activeDot={{ r: 4 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}
