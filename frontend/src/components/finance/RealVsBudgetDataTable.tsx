'use client';

import * as React from 'react';
import {
  type ColumnDef,
  type SortingState,
  flexRender,
  getCoreRowModel,
  getSortedRowModel,
  useReactTable,
} from '@tanstack/react-table';
import { ArrowUpDown } from 'lucide-react';

import { Button } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

export type RealVsBudgetRow = {
  categoryId: number;
  categoryName: string;
  categoryType: string;
  budget: number;
  real: number;
  diff: number;
};

export function RealVsBudgetDataTable({ data }: { data: RealVsBudgetRow[] }) {
  const [sorting, setSorting] = React.useState<SortingState>([]);

  const columns: ColumnDef<RealVsBudgetRow>[] = React.useMemo(
    () => [
      {
        accessorKey: 'categoryName',
        header: ({ column }) => (
          <Button
            variant="ghost"
            className="h-auto px-0 font-medium hover:bg-transparent"
            onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
          >
            Catégorie
            <ArrowUpDown className="ml-1.5 h-4 w-4" />
          </Button>
        ),
        cell: ({ row }) => row.getValue<string>('categoryName'),
      },
      {
        accessorKey: 'budget',
        header: () => <div className="text-right font-medium">Budget</div>,
        cell: ({ row }) => (
          <div className="text-right">
            {row.getValue<number>('budget').toLocaleString('fr-FR')} CFA
          </div>
        ),
      },
      {
        accessorKey: 'real',
        header: () => <div className="text-right font-medium">Réel</div>,
        cell: ({ row }) => (
          <div className="text-right">
            {row.getValue<number>('real').toLocaleString('fr-FR')} CFA
          </div>
        ),
      },
      {
        accessorKey: 'diff',
        header: () => <div className="text-right font-medium">Écart</div>,
        cell: ({ row }) => {
          const diff = row.getValue<number>('diff');
          return (
            <div
              className={`text-right font-medium ${diff >= 0 ? 'text-green-600' : 'text-red-600'}`}
            >
              {diff >= 0 ? '+' : ''}
              {diff.toLocaleString('fr-FR')} CFA
            </div>
          );
        },
      },
    ],
    []
  );

  const table = useReactTable({
    data,
    columns,
    onSortingChange: setSorting,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    state: { sorting },
  });

  return (
    <div className="w-full">
      <div className="rounded-sm border">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id} className="bg-muted/40">
                {headerGroup.headers.map((header) => (
                  <TableHead key={header.id} className="rounded-none">
                    {header.isPlaceholder
                      ? null
                      : flexRender(header.column.columnDef.header, header.getContext())}
                  </TableHead>
                ))}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {table.getRowModel().rows?.length ? (
              table.getRowModel().rows.map((row) => (
                <TableRow key={row.id}>
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id}>
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={columns.length} className="h-24 text-center text-muted-foreground">
                  Aucune donnée budget.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
