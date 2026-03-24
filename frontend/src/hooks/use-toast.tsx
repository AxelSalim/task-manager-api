'use client';

import { toast as toastify } from 'react-toastify';
import type { ReactNode } from 'react';

export interface Toast {
  id: string;
  title: string;
  description?: string;
  variant?: 'default' | 'destructive';
}

function ToastBody({ title, description }: { title: string; description?: string }) {
  return (
    <div className="flex flex-col gap-0.5 text-left">
      <span className="font-semibold leading-tight">{title}</span>
      {description ? (
        <span className="text-sm leading-snug opacity-90">{description}</span>
      ) : null}
    </div>
  );
}

/** API compatible avec l’ancien hook : déclenche une notification react-toastify. */
export function toast({ title, description, variant = 'default' }: Omit<Toast, 'id'>) {
  const body = <ToastBody title={title} description={description} />;
  if (variant === 'destructive') {
    toastify.error(body, { autoClose: 4000 });
  } else {
    toastify.success(body, { autoClose: 3000 });
  }
}

export function useToast() {
  return {
    toast,
    toasts: [] as Toast[],
    removeToast: () => {},
  };
}

/** Conservé pour compatibilité : react-toastify ne nécessite plus de provider. */
export function ToastProvider({ children }: { children: ReactNode }) {
  return <>{children}</>;
}
