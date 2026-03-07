'use client';

import {
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import type { FinanceDashboardDailyDto } from '@/lib/api';

type FinanceDailyCumulativeChartProps = {
  daily: FinanceDashboardDailyDto[];
  monthLabel: string;
};

export function FinanceDailyCumulativeChart({
  daily,
  monthLabel,
}: FinanceDailyCumulativeChartProps) {
  let cumulRevenus = 0;
  let cumulDepenses = 0;
  const data = daily.map((d) => {
    cumulRevenus += d.totalRevenus;
    cumulDepenses += d.totalDepenses;
    return {
      day: d.day,
      label: `J${d.day}`,
      'Cumul Revenus': cumulRevenus,
      'Cumul Dépenses': cumulDepenses,
      'Solde cumulé': cumulRevenus - cumulDepenses,
    };
  });

  if (data.length === 0) return null;

  return (
    <Card className="rounded-sm border shadow-none">
      <CardHeader className="py-3 px-4 border-b">
        <CardTitle className="text-base font-semibold">
          Cumul du mois par jour — {monthLabel}
        </CardTitle>
      </CardHeader>
      <CardContent className="p-4">
        <div className="h-[280px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart
              data={data}
              margin={{ top: 12, right: 12, left: 0, bottom: 0 }}
            >
              <CartesianGrid
                strokeDasharray="3 3"
                vertical
                horizontal
                stroke="hsl(var(--border))"
              />
              <XAxis
                dataKey="label"
                tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }}
                axisLine={{ stroke: 'hsl(var(--border))' }}
                tickLine={{ stroke: 'hsl(var(--border))' }}
                interval="preserveStartEnd"
              />
              <YAxis
                tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }}
                axisLine={{ stroke: 'hsl(var(--border))' }}
                tickLine={{ stroke: 'hsl(var(--border))' }}
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
              <Legend wrapperStyle={{ fontSize: 12 }} />
              <Line
                type="monotone"
                dataKey="Cumul Revenus"
                stroke="#16a34a"
                strokeWidth={2}
                dot={false}
                activeDot={{ r: 4 }}
              />
              <Line
                type="monotone"
                dataKey="Cumul Dépenses"
                stroke="#dc2626"
                strokeWidth={2}
                dot={false}
                activeDot={{ r: 4 }}
              />
              <Line
                type="monotone"
                dataKey="Solde cumulé"
                stroke="hsl(var(--primary))"
                strokeWidth={2}
                strokeDasharray="4 4"
                dot={false}
                activeDot={{ r: 4 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}
