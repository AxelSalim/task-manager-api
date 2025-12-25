'use client';

import { Tag } from '@/types/tag';
import { X } from 'lucide-react';
import { cn } from '@/lib/utils';

interface TagBadgeProps {
  tag: Tag;
  onRemove?: (tagId: number) => void;
  variant?: 'default' | 'outline';
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export function TagBadge({ 
  tag, 
  onRemove, 
  variant = 'default',
  size = 'md',
  className 
}: TagBadgeProps) {
  const sizeClasses = {
    sm: 'text-xs px-1.5 py-0.5',
    md: 'text-sm px-2 py-1',
    lg: 'text-base px-2.5 py-1.5',
  };

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full font-medium transition-colors',
        variant === 'default' 
          ? 'text-white' 
          : 'border bg-transparent',
        sizeClasses[size],
        className
      )}
      style={{
        backgroundColor: variant === 'default' ? tag.color : undefined,
        borderColor: variant === 'outline' ? tag.color : undefined,
        color: variant === 'outline' ? tag.color : undefined,
      }}
    >
      <span>{tag.name}</span>
      {onRemove && (
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onRemove(tag.id);
          }}
          className={cn(
            'rounded-full p-0.5 transition-colors hover:bg-black/10',
            variant === 'outline' && 'hover:bg-black/5'
          )}
          aria-label={`Supprimer le tag ${tag.name}`}
        >
          <X className="h-3 w-3" />
        </button>
      )}
    </span>
  );
}



