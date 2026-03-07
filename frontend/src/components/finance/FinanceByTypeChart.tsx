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

const TYPE_COLORS: Record<string, string> = {
  revenus: '#16a34a',
  factures: '#ea580c',
  depenses: '#dc2626',
  epargnes: '#2563eb',
  credits: '#7c3aed',
};

const TYPE_LABELS: Record<string, string> = {
  revenus: 'Revenus',
  factures: 'Factures',
  depenses: 'Dépenses',
  epargnes: 'Épargnes',
  credits: 'Crédits',
};

type FinanceByTypeChartProps = {
  totalsByType: Record<string, number>;
  monthLabel: string;
};

export function FinanceByTypeChart({ totalsByType, monthLabel }: FinanceByTypeChartProps) {
  const data = Object.entries(totalsByType)
    .filter(([, value]) => value > 0)
    .map(([type, value]) => ({
      name: TYPE_LABELS[type] ?? type,
      type,
      value,
      fill: TYPE_COLORS[type] ?? '#64748b',
    }));

  if (data.length === 0) return null;

  return (
    <Card className="rounded-sm border shadow-none">
      <CardHeader className="py-3 px-4 border-b">
        <CardTitle className="text-base font-semibold">
          Répartition par type — {monthLabel}
        </CardTitle>
      </CardHeader>
      <CardContent className="p-4">
        <div className="h-[260px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={data}
              margin={{ top: 12, right: 12, left: 0, bottom: 0 }}
              barCategoryGap="25%"
            >
              <CartesianGrid
                strokeDasharray="3 3"
                vertical
                horizontal
                stroke="hsl(var(--border))"
              />
              <XAxis
                dataKey="name"
                tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }}
                axisLine={{ stroke: 'hsl(var(--muted-foreground))', strokeWidth: 1 }}
                tickLine={{ stroke: 'hsl(var(--muted-foreground))', strokeWidth: 1 }}
              />
              <YAxis
                tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }}
                axisLine={{ stroke: 'hsl(var(--muted-foreground))', strokeWidth: 1 }}
                tickLine={{ stroke: 'hsl(var(--muted-foreground))', strokeWidth: 1 }}
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
              <Bar dataKey="value" radius={[2, 2, 0, 0]} maxBarSize={60}>
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
