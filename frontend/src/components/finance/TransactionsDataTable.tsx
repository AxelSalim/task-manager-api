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
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from '@/components/ui/pagination';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
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
import { SquarePen, Trash2 } from 'lucide-react';

const PAGE_SIZE = 10;

/** Retourne les numéros de page à afficher, avec 'ellipsis' pour les trous */
function getPageNumbers(currentPage: number, totalPages: number): (number | 'ellipsis')[] {
  if (totalPages <= 1) return totalPages === 1 ? [1] : [];
  const numbers = [...new Set([1, currentPage, currentPage - 1, currentPage + 1, totalPages])]
    .filter((p) => p >= 1 && p <= totalPages)
    .sort((a, b) => a - b);
  const result: (number | 'ellipsis')[] = [];
  for (let i = 0; i < numbers.length; i++) {
    result.push(numbers[i]);
    if (i < numbers.length - 1 && numbers[i + 1]! - numbers[i]! > 1) result.push('ellipsis');
  }
  return result;
}

const TYPE_LABELS: Record<FinanceTransactionType, string> = {
  revenus: 'Revenus',
  factures: 'Factures',
  depenses: 'Dépenses',
  epargnes: 'Épargnes',
  credits: 'Crédits',
};

const TYPE_OPTIONS: { value: '' | FinanceTransactionType; label: string }[] = [
  { value: '', label: 'Tous les types' },
  ...(Object.entries(TYPE_LABELS) as [FinanceTransactionType, string][]).map(([value, label]) => ({ value, label })),
];

type DateRangeFilter = { from?: string; to?: string };

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
        filterFn: (row, _columnId, filterValue: DateRangeFilter | undefined) => {
          if (!filterValue?.from && !filterValue?.to) return true;
          const rowDate = new Date(row.getValue<string>('date'));
          const dateOnly = rowDate.toISOString().slice(0, 10);
          if (filterValue.from && dateOnly < filterValue.from) return false;
          if (filterValue.to && dateOnly > filterValue.to) return false;
          return true;
        },
      },
      {
        accessorKey: 'type',
        header: 'Type',
        cell: ({ row }) => typeLabels[row.getValue<FinanceTransactionType>('type')] ?? row.getValue('type'),
        filterFn: (row, _columnId, filterValue: string) => {
          if (!filterValue) return true;
          return row.getValue<FinanceTransactionType>('type') === filterValue;
        },
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
          <span className="text-muted-foreground truncate block max-w-[200px]" title={row.original.comment || undefined}>
            {row.original.comment || '—'}
          </span>
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
                <SquarePen className="h-4 w-4 text-muted-foreground" />
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
    initialState: { pagination: { pageSize: PAGE_SIZE } },
    state: {
      sorting,
      columnFilters,
    },
  });

  const pageCount = table.getPageCount();
  const pageIndex = table.getState().pagination.pageIndex;
  const pageNumbers = getPageNumbers(pageIndex + 1, pageCount);

  return (
    <div className="w-full space-y-4">
      <div className="flex flex-wrap items-center gap-3 py-2">
        <Select
          value={(table.getColumn('type')?.getFilterValue() as string) ?? 'all'}
          onValueChange={(value) => table.getColumn('type')?.setFilterValue(value === 'all' ? undefined : value)}
        >
          <SelectTrigger className="w-[180px] rounded-sm">
            <SelectValue placeholder="Type" />
          </SelectTrigger>
          <SelectContent>
            {TYPE_OPTIONS.map((opt) => (
              <SelectItem key={opt.value || 'all'} value={opt.value || 'all'}>
                {opt.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <div className="flex items-center gap-2">
          <Input
            type="date"
            className="w-[140px] rounded-sm"
            value={((table.getColumn('date')?.getFilterValue() as DateRangeFilter)?.from) ?? ''}
            onChange={(e) => {
              const from = e.target.value || undefined;
              const current = (table.getColumn('date')?.getFilterValue() as DateRangeFilter) ?? {};
              table.getColumn('date')?.setFilterValue({ ...current, from });
            }}
          />
          <span className="text-muted-foreground text-sm">→</span>
          <Input
            type="date"
            className="w-[140px] rounded-sm"
            value={((table.getColumn('date')?.getFilterValue() as DateRangeFilter)?.to) ?? ''}
            onChange={(e) => {
              const to = e.target.value || undefined;
              const current = (table.getColumn('date')?.getFilterValue() as DateRangeFilter) ?? {};
              table.getColumn('date')?.setFilterValue({ ...current, to });
            }}
          />
        </div>
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
      <div className="flex items-center justify-between gap-2 py-2">
        <div className="text-sm text-muted-foreground">
          {table.getFilteredRowModel().rows.length} ligne(s)
        </div>
        {pageCount > 1 && (
          <Pagination>
            <PaginationContent>
              <PaginationItem>
                <PaginationPrevious
                  onClick={() => table.previousPage()}
                  disabled={!table.getCanPreviousPage()}
                />
              </PaginationItem>
              {pageNumbers.map((page, i) =>
                page === 'ellipsis' ? (
                  <PaginationItem key={`ellipsis-${i}`}>
                    <PaginationEllipsis />
                  </PaginationItem>
                ) : (
                  <PaginationItem key={page}>
                    <PaginationLink
                      isActive={pageIndex + 1 === page}
                      onClick={() => table.setPageIndex(page - 1)}
                    >
                      {page}
                    </PaginationLink>
                  </PaginationItem>
                )
              )}
              <PaginationItem>
                <PaginationNext
                  onClick={() => table.nextPage()}
                  disabled={!table.getCanNextPage()}
                />
              </PaginationItem>
            </PaginationContent>
          </Pagination>
        )}
      </div>
    </div>
  );
}
