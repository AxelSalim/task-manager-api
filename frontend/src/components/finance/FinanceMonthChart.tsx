'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

type FinanceMonthChartProps = {
  totalRevenus: number;
  totalDepenses: number;
  monthLabel: string;
};

export function FinanceMonthChart({
  totalRevenus,
  totalDepenses,
  monthLabel,
}: FinanceMonthChartProps) {
  const max = Math.max(totalRevenus, totalDepenses, 1);
  const revenusPercent = (totalRevenus / max) * 100;
  const depensesPercent = (totalDepenses / max) * 100;

  return (
    <Card className="rounded-sm border shadow-none">
      <CardHeader className="py-3 px-4 border-b">
        <CardTitle className="text-base font-semibold">
          Revenus vs Dépenses — {monthLabel}
        </CardTitle>
      </CardHeader>
      <CardContent className="p-4">
        <div className="h-[240px] w-full flex flex-col gap-6">
          <div className="flex-1 flex gap-4 items-end min-h-0">
            <div className="flex-1 flex flex-col gap-1">
              <span className="text-xs font-medium text-muted-foreground">Revenus</span>
              <div
                className="w-full bg-green-600 rounded-sm min-h-[8px] transition-all"
                style={{ height: `${revenusPercent}%` }}
                title={`${totalRevenus.toLocaleString('fr-FR')} CFA`}
              />
              <span className="text-xs text-muted-foreground mt-0.5">
                {totalRevenus.toLocaleString('fr-FR')} CFA
              </span>
            </div>
            <div className="flex-1 flex flex-col gap-1">
              <span className="text-xs font-medium text-muted-foreground">Dépenses</span>
              <div
                className="w-full bg-red-600 rounded-sm min-h-[8px] transition-all"
                style={{ height: `${depensesPercent}%` }}
                title={`${totalDepenses.toLocaleString('fr-FR')} CFA`}
              />
              <span className="text-xs text-muted-foreground mt-0.5">
                {totalDepenses.toLocaleString('fr-FR')} CFA
              </span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
