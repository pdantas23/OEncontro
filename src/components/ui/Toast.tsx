'use client'

/**
 * Toast — wrapper sobre Sonner com estilo do design system.
 * Usar: import { toast } from '@/components/ui/Toast'
 * Provider: <Toaster /> deve estar no root layout.
 */

import { Toaster as SonnerToaster } from 'sonner'
export { toast } from 'sonner'

export function Toaster() {
  return (
    <SonnerToaster
      position="bottom-right"
      toastOptions={{
        classNames: {
          toast:
            'group flex items-center gap-3 rounded-lg border border-border bg-secondary px-4 py-3 text-foreground shadow-lg',
          title: 'text-sm font-medium',
          description: 'text-xs text-muted-foreground',
          actionButton: 'text-xs font-medium text-primary',
          cancelButton: 'text-xs text-muted-foreground',
          success: '!border-success/30 [&>[data-icon]]:text-success',
          error: '!border-destructive/30 [&>[data-icon]]:text-destructive',
          warning: '!border-warning/30 [&>[data-icon]]:text-warning',
          info: '!border-info/30 [&>[data-icon]]:text-info',
        },
      }}
    />
  )
}
