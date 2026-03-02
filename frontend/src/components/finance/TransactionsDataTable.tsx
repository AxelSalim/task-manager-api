'use client';

import * as React from 'react';
import {
  type ColumnDef,
  type ColumnFiltersState,
  type SortingState,
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
} from '@tanstack/react-table';
import { ArrowUpDown } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import type { FinanceTransactionDto, FinanceTransactionType } from '@/lib/api';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { Pencil, Trash2 } from 'lucide-react';

const TYPE_LABELS: Record<FinanceTransactionType, string> = {
  revenus: 'Revenus',
  factures: 'Factures',
  depenses: 'Dépenses',
  epargnes: 'Épargnes',
  credits: 'Crédits',
};

export function TransactionsDataTable({
  data,
  typeLabels,
  onDelete,
  onEdit,
}: {
  data: FinanceTransactionDto[];
  typeLabels: Record<FinanceTransactionType, string>;
  onDelete: (id: number) => void;
  onEdit?: (tx: FinanceTransactionDto) => void;
}) {
  const [sorting, setSorting] = React.useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>([]);

  const columns: ColumnDef<FinanceTransactionDto>[] = React.useMemo(
    () => [
      {
        accessorKey: 'date',
        header: ({ column }) => (
          <Button
            variant="ghost"
            className="h-auto px-0 font-medium hover:bg-transparent"
            onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
          >
            Date
            <ArrowUpDown className="ml-1.5 h-4 w-4" />
          </Button>
        ),
        cell: ({ row }) =>
          format(new Date(row.getValue<string>('date')), 'd MMM yyyy', { locale: fr }),
      },
      {
        accessorKey: 'type',
        header: 'Type',
        cell: ({ row }) => typeLabels[row.getValue<FinanceTransactionType>('type')] ?? row.getValue('type'),
      },
      {
        id: 'category',
        accessorFn: (row) => row.category?.name ?? '',
        header: 'Catégorie',
        cell: ({ row }) => row.original.category?.name ?? '—',
      },
      {
        accessorKey: 'amount',
        header: () => <div className="text-right font-medium">Montant</div>,
        cell: ({ row }) => {
          const amount = row.original.amount;
          const type = row.original.type;
          const isRevenus = type === 'revenus';
          return (
            <div
              className={`text-right font-medium ${isRevenus ? 'text-green-600' : 'text-red-600'}`}
            >
              {isRevenus ? '+' : '-'}
              {Math.abs(amount).toLocaleString('fr-FR')} CFA
            </div>
          );
        },
      },
      {
        accessorKey: 'comment',
        header: 'Commentaire',
        cell: ({ row }) => (
          <span className="text-muted-foreground">{row.original.comment || '—'}</span>
        ),
      },
      {
        id: 'actions',
        enableHiding: false,
        cell: ({ row }) => (
          <div className="flex items-center gap-0.5">
            {onEdit && (
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 rounded-sm"
                onClick={() => onEdit(row.original)}
                aria-label="Modifier"
              >
                <Pencil className="h-4 w-4 text-muted-foreground" />
              </Button>
            )}
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 rounded-sm"
              onClick={() => onDelete(row.original.id)}
              aria-label="Supprimer"
            >
              <Trash2 className="h-4 w-4 text-destructive" />
            </Button>
          </div>
        ),
      },
    ],
    [typeLabels, onDelete, onEdit]
  );

  const table = useReactTable({
    data,
    columns,
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    state: {
      sorting,
      columnFilters,
    },
  });

  return (
    <div className="w-full space-y-4">
      <div className="flex items-center py-2">
        <Input
          placeholder="Filtrer par catégorie..."
          value={(table.getColumn('category')?.getFilterValue() as string) ?? ''}
          onChange={(e) => table.getColumn('category')?.setFilterValue(e.target.value)}
          className="max-w-sm rounded-sm"
        />
      </div>
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
                <TableRow key={row.id} data-state={row.getIsSelected() && 'selected'}>
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
                  Aucune transaction.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
      <div className="flex items-center justify-end gap-2 py-2">
        <div className="flex-1 text-sm text-muted-foreground">
          {table.getFilteredRowModel().rows.length} ligne(s)
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            className="rounded-sm"
            onClick={() => table.previousPage()}
            disabled={!table.getCanPreviousPage()}
          >
            Précédent
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="rounded-sm"
            onClick={() => table.nextPage()}
            disabled={!table.getCanNextPage()}
          >
            Suivant
          </Button>
        </div>
      </div>
    </div>
  );
}
