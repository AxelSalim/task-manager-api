'use client';

import {
  Cell,
  Legend,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
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

type FinanceTypePieChartProps = {
  totalsByType: Record<string, number>;
  monthLabel: string;
};

export function FinanceTypePieChart({ totalsByType, monthLabel }: FinanceTypePieChartProps) {
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
            <PieChart>
              <Pie
                data={data}
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={80}
                paddingAngle={2}
                dataKey="value"
                nameKey="name"
              >
                {data.map((entry, index) => (
                  <Cell key={index} fill={entry.fill} stroke="hsl(var(--background))" strokeWidth={1} />
                ))}
              </Pie>
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
              />
              <Legend wrapperStyle={{ fontSize: 11 }} />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}
