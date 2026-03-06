import * as React from 'react';
import { ChevronLeft, ChevronRight, MoreHorizontal } from 'lucide-react';
import { cn } from '@/lib/utils';
import { buttonVariants } from '@/components/ui/button';

const Pagination = ({ className, ...props }: React.ComponentProps<'nav'>) => (
  <nav
    role="navigation"
    aria-label="pagination"
    className={cn('mx-auto flex w-full justify-center', className)}
    {...props}
  />
);

const PaginationContent = React.forwardRef<
  HTMLUListElement,
  React.ComponentProps<'ul'>
>(({ className, ...props }, ref) => (
  <ul
    ref={ref}
    className={cn('flex flex-row items-center gap-2', className)}
    {...props}
  />
));
PaginationContent.displayName = 'PaginationContent';

const PaginationItem = React.forwardRef<
  HTMLLIElement,
  React.ComponentProps<'li'>
>(({ className, ...props }, ref) => (
  <li ref={ref} className={cn('', className)} {...props} />
));
PaginationItem.displayName = 'PaginationItem';

type PaginationLinkProps = React.ComponentProps<'button'> & {
  isActive?: boolean;
};

const PaginationLink = ({
  className,
  isActive,
  ...props
}: PaginationLinkProps) => (
  <button
    type="button"
    aria-current={isActive ? 'page' : undefined}
    className={cn(
      buttonVariants({
        variant: isActive ? 'outline' : 'ghost',
        size: 'icon',
      }),
      'size-9 rounded-sm',
      className
    )}
    {...props}
  />
);

const PaginationPrevious = ({
  className,
  onClick,
  disabled,
  ...props
}: React.ComponentProps<'button'>) => (
  <button
    type="button"
    aria-label="Page précédente"
    className={cn(
      buttonVariants({ variant: 'outline', size: 'default' }),
      'gap-1 pl-2.5 pr-3 rounded-sm',
      className
    )}
    onClick={onClick}
    disabled={disabled}
    {...props}
  >
    <ChevronLeft className="h-4 w-4" />
    <span>Précédent</span>
  </button>
);

const PaginationNext = ({
  className,
  onClick,
  disabled,
  ...props
}: React.ComponentProps<'button'>) => (
  <button
    type="button"
    aria-label="Page suivante"
    className={cn(
      buttonVariants({ variant: 'outline', size: 'default' }),
      'gap-1 pr-2.5 pl-3 rounded-sm',
      className
    )}
    onClick={onClick}
    disabled={disabled}
    {...props}
  >
    <span>Suivant</span>
    <ChevronRight className="h-4 w-4" />
  </button>
);

const PaginationEllipsis = ({
  className,
  ...props
}: React.ComponentProps<'span'>) => (
  <span
    aria-hidden
    className={cn('flex h-9 w-9 items-center justify-center', className)}
    {...props}
  >
    <MoreHorizontal className="h-4 w-4" />
    <span className="sr-only">Plus de pages</span>
  </span>
);

export {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
};
