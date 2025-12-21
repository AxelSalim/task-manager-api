'use client';

import { useToast } from '@/hooks/use-toast';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

export function Toaster() {
  const { toasts, removeToast } = useToast();

  if (toasts.length === 0) return null;

  return (
    <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-2 max-w-md">
      {toasts.map((toast) => (
        <Alert
          key={toast.id}
          className={cn(
            'shadow-lg relative',
            toast.variant === 'destructive' && 'border-red-200 bg-red-50'
          )}
        >
          <Button
            variant="ghost"
            size="icon"
            className="absolute top-2 right-2 h-6 w-6"
            onClick={() => removeToast(toast.id)}
          >
            <X className="h-4 w-4" />
          </Button>
          <AlertTitle>{toast.title}</AlertTitle>
          {toast.description && (
            <AlertDescription>{toast.description}</AlertDescription>
          )}
        </Alert>
      ))}
    </div>
  );
}
