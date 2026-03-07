'use client';

import {
  Bar,
  BarChart,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import type { FinanceDashboardDailyDto } from '@/lib/api';

const REVENUS_COLOR = '#16a34a';
const DEPENSES_COLOR = '#dc2626';

type FinanceDailyChartProps = {
  daily: FinanceDashboardDailyDto[];
  monthLabel: string;
};

export function FinanceDailyChart({ daily, monthLabel }: FinanceDailyChartProps) {
  const data = daily.map((d) => ({
    day: d.day,
    label: `J${d.day}`,
    Revenus: d.totalRevenus,
    Dépenses: d.totalDepenses,
  }));

  if (data.length === 0) return null;

  return (
    <Card className="rounded-sm border shadow-none">
      <CardHeader className="py-3 px-4 border-b">
        <CardTitle className="text-base font-semibold">
          Revenus et Dépenses par jour — {monthLabel}
        </CardTitle>
      </CardHeader>
      <CardContent className="p-4">
        <div className="h-[280px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={data}
              margin={{ top: 12, right: 12, left: 0, bottom: 0 }}
            >
              <XAxis
                dataKey="label"
                tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }}
                axisLine={false}
                tickLine={false}
                interval="preserveStartEnd"
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
                contentStyle={{
                  borderRadius: 4,
                  border: '1px solid hsl(var(--border))',
                  fontSize: 12,
                }}
                formatter={(value: number) => [
                  `${Number(value).toLocaleString('fr-FR')} CFA`,
                  '',
                ]}
                labelFormatter={(_, payload) =>
                  payload?.[0]?.payload
                    ? `Jour ${payload[0].payload.day}`
                    : ''
                }
              />
              <Legend
                wrapperStyle={{ fontSize: 12 }}
                formatter={(value) => value}
              />
              <Bar
                dataKey="Revenus"
                fill={REVENUS_COLOR}
                radius={[2, 2, 0, 0]}
                maxBarSize={24}
              />
              <Bar
                dataKey="Dépenses"
                fill={DEPENSES_COLOR}
                radius={[2, 2, 0, 0]}
                maxBarSize={24}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}
