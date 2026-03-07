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
import { ArrowUpDown, Loader2 } from 'lucide-react';
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
import type { FinanceBudgetEntryDto, FinanceCategoryDto, FinanceTransactionType } from '@/lib/api';
import { cn } from '@/lib/utils';

const PAGE_SIZE = 10;
const TYPE_ORDER: FinanceTransactionType[] = [
  'revenus',
  'factures',
  'depenses',
  'epargnes',
  'credits',
];

function buildTypeOptions(
  typeLabels: Record<FinanceTransactionType, string>
): { value: '' | FinanceTransactionType; label: string }[] {
  return [
    { value: '', label: 'Tous les types' },
    ...(Object.entries(typeLabels) as [FinanceTransactionType, string][]).map(([value, label]) => ({
      value,
      label,
    })),
  ];
}

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

export type BudgetTableRow = {
  category: FinanceCategoryDto;
  entry: FinanceBudgetEntryDto | undefined;
};

export function BudgetTable({
  categories,
  budgetByCategory,
  typeLabels,
  filterType,
  filterCategoryId,
  onFilterChange,
  onSave,
  getSaving,
}: {
  categories: FinanceCategoryDto[];
  budgetByCategory: Map<number, FinanceBudgetEntryDto>;
  typeLabels: Record<FinanceTransactionType, string>;
  filterType?: '' | FinanceTransactionType;
  filterCategoryId?: number | null;
  onFilterChange?: (p: {
    type?: '' | FinanceTransactionType;
    categoryId?: number | null;
  }) => void;
  onSave: (categoryId: number, amount: number) => void;
  getSaving: (categoryId: number) => boolean;
}) {
  const [sorting, setSorting] = React.useState<SortingState>([]);

  const typeOptions = React.useMemo(() => buildTypeOptions(typeLabels), [typeLabels]);

  const data = React.useMemo<BudgetTableRow[]>(() => {
    let list = [...categories];
    if (filterType) list = list.filter((c) => c.type === filterType);
    if (filterCategoryId != null) list = list.filter((c) => c.id === filterCategoryId);
    return list
      .sort((a, b) => {
        const orderA = TYPE_ORDER.indexOf(a.type as FinanceTransactionType);
        const orderB = TYPE_ORDER.indexOf(b.type as FinanceTransactionType);
        if (orderA !== orderB) return orderA - orderB;
        return a.name.localeCompare(b.name);
      })
      .map((cat) => ({ category: cat, entry: budgetByCategory.get(cat.id) }));
  }, [categories, budgetByCategory, filterType, filterCategoryId]);

  const columns = React.useMemo<ColumnDef<BudgetTableRow>[]>(
    () => [
      {
        id: 'categoryName',
        accessorFn: (row) => row.category.name,
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
        cell: ({ row }) => (
          <span className="font-medium">{row.original.category.name}</span>
        ),
      },
      {
        id: 'type',
        accessorFn: (row) => row.category.type,
        header: 'Type',
        cell: ({ row }) => {
          const type = row.original.category.type as FinanceTransactionType;
          const label = typeLabels[type] ?? type;
          const isRevenus = type === 'revenus';
          return (
            <span
              className={cn(
                'text-sm',
                isRevenus ? 'text-green-700 dark:text-green-400' : 'text-muted-foreground'
              )}
            >
              {label}
            </span>
          );
        },
      },
      {
        id: 'amount',
        accessorFn: (row) => row.entry?.amount ?? 0,
        header: () => (
          <div className="text-left font-medium">Montant budgété (CFA)</div>
        ),
        cell: ({ row }) => (
          <BudgetAmountCell
            row={row.original}
            onSave={onSave}
            saving={getSaving(row.original.category.id)}
          />
        ),
      },
    ],
    [typeLabels, onSave, getSaving]
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
      <div className="flex flex-wrap items-center gap-3 py-2">
        {onFilterChange && (
          <>
            <Select
              value={filterType || 'all'}
              onValueChange={(v) =>
                onFilterChange({
                  type: (v === 'all' ? '' : v) as '' | FinanceTransactionType,
                })
              }
            >
              <SelectTrigger className="w-[180px] rounded-sm">
                <SelectValue placeholder="Type" />
              </SelectTrigger>
              <SelectContent>
                {typeOptions.map((opt) => (
                  <SelectItem key={opt.value || 'all'} value={opt.value || 'all'}>
                    {opt.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select
              value={filterCategoryId != null ? String(filterCategoryId) : 'all'}
              onValueChange={(v) =>
                onFilterChange({
                  categoryId: v === 'all' ? null : Number(v),
                })
              }
            >
              <SelectTrigger className="w-[220px] rounded-sm">
                <SelectValue placeholder="Catégorie" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Toutes les catégories</SelectItem>
                {categories.map((cat) => (
                  <SelectItem key={cat.id} value={String(cat.id)}>
                    {cat.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </>
        )}
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
                      : flexRender(
                          header.column.columnDef.header,
                          header.getContext()
                        )}
                  </TableHead>
                ))}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {table.getRowModel().rows?.length ? (
              table.getRowModel().rows.map((row) => (
                <TableRow
                  key={row.original.category.id}
                  data-state={row.getIsSelected() && 'selected'}
                >
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id}>
                      {flexRender(
                        cell.column.columnDef.cell,
                        cell.getContext()
                      )}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell
                  colSpan={columns.length}
                  className="h-24 text-center text-muted-foreground"
                >
                  Aucune catégorie.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
      <div className="flex items-center justify-between gap-2 py-2">
        <div className="text-sm text-muted-foreground">
          {table.getRowModel().rows.length} ligne(s)
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

function BudgetAmountCell({
  row,
  onSave,
  saving,
}: {
  row: BudgetTableRow;
  onSave: (categoryId: number, amount: number) => void;
  saving: boolean;
}) {
  const [localValue, setLocalValue] = React.useState<string | null>(null);
  const displayValue =
    localValue !== null ? localValue : String(row.entry?.amount ?? 0);

  const handleBlur = () => {
    if (localValue === null) return;
    const parsed = parseFloat(localValue.replace(/\s/g, '').replace(',', '.'));
    if (!Number.isNaN(parsed) && parsed >= 0) {
      onSave(row.category.id, parsed);
      setLocalValue(null);
    } else {
      setLocalValue(null);
    }
  };

  const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value;
    if (raw === '') {
      setLocalValue('');
      return;
    }
    const filtered = raw.replace(/[^\d,.]/g, '');
    const parts = filtered.split(/[,.]/);
    if (parts.length > 2) return;
    setLocalValue(filtered);
  };

  return (
    <div className="flex items-center justify-start gap-2">
      <Input
        type="text"
        inputMode="decimal"
        className="max-w-[160px] rounded-sm text-left h-9"
        value={displayValue}
        onChange={handleAmountChange}
        onBlur={handleBlur}
        placeholder="0"
        disabled={saving}
      />
      <span className="text-sm text-muted-foreground shrink-0 w-8">CFA</span>
      {saving && (
        <Loader2
          className="h-4 w-4 animate-spin text-muted-foreground shrink-0"
          aria-hidden
        />
      )}
    </div>
  );
}
