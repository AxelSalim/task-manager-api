'use client';

import * as React from 'react';
import {
  type ColumnDef,
  type SortingState,
  flexRender,
  getCoreRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
} from '@tanstack/react-table';
import { ArrowUpDown } from 'lucide-react';

import { Button } from '@/components/ui/button';
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
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

const PAGE_SIZE = 10;

function getPageNumbers(currentPage: number, totalPages: number): (number | 'ellipsis')[] {
  if (totalPages <= 1) return totalPages === 1 ? [1] : [];
  const numbers = [...new Set([1, currentPage, currentPage - 1, currentPage + 1, totalPages])]
    .filter((p) => p >= 1 && p <= totalPages)
    .sort((a, b) => a - b);
  const result: (number | 'ellipsis')[] = [];
  for (let i = 0; i < numbers.length; i++) {
    result.push(numbers[i]!);
    if (i < numbers.length - 1 && numbers[i + 1]! - numbers[i]! > 1) result.push('ellipsis');
  }
  return result;
}

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
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    initialState: { pagination: { pageSize: PAGE_SIZE } },
    state: { sorting },
  });

  const pageCount = table.getPageCount();
  const pageIndex = table.getState().pagination.pageIndex;
  const pageNumbers = getPageNumbers(pageIndex + 1, pageCount);

  return (
    <div className="w-full space-y-4">
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
      <div className="flex items-center justify-between gap-2 py-2">
        <div className="text-sm text-muted-foreground">
          {table.getCoreRowModel().rows.length} ligne(s)
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
