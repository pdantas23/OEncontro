'use client'

import * as RadixDialog from '@radix-ui/react-dialog'
import { X } from 'lucide-react'
import { cn } from '@/utils/cn'

const Sheet = RadixDialog.Root
const SheetTrigger = RadixDialog.Trigger
const SheetClose = RadixDialog.Close

function SheetOverlay({ className, ...props }: React.ComponentPropsWithoutRef<typeof RadixDialog.Overlay>) {
  return (
    <RadixDialog.Overlay
      className={cn(
        'fixed inset-0 z-50 bg-black/60 backdrop-blur-sm',
        'data-[state=open]:animate-fade-in',
        className,
      )}
      {...props}
    />
  )
}

export interface SheetContentProps
  extends React.ComponentPropsWithoutRef<typeof RadixDialog.Content> {
  side?: 'left' | 'right' | 'top' | 'bottom'
}

const sideClass = {
  left:   'inset-y-0 left-0 h-full w-3/4 max-w-sm border-r border-border data-[state=open]:animate-slide-in-up',
  right:  'inset-y-0 right-0 h-full w-3/4 max-w-sm border-l border-border data-[state=open]:animate-slide-in-up',
  top:    'inset-x-0 top-0 border-b border-border data-[state=open]:animate-slide-in-up',
  bottom: 'inset-x-0 bottom-0 border-t border-border data-[state=open]:animate-slide-in-up',
}

function SheetContent({ side = 'right', className, children, ...props }: SheetContentProps) {
  return (
    <RadixDialog.Portal>
      <SheetOverlay />
      <RadixDialog.Content
        className={cn(
          'fixed z-50 bg-secondary shadow-xl',
          'focus:outline-none',
          sideClass[side],
          className,
        )}
        aria-modal="true"
        {...props}
      >
        <RadixDialog.Title className="sr-only">Menu</RadixDialog.Title>
        <RadixDialog.Description className="sr-only">Menu de navegação</RadixDialog.Description>
        <RadixDialog.Close className="absolute right-4 top-4 rounded p-1 text-muted-foreground transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
          <X className="h-5 w-5" />
          <span className="sr-only">Fechar</span>
        </RadixDialog.Close>
        {children}
      </RadixDialog.Content>
    </RadixDialog.Portal>
  )
}

function SheetHeader({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn('flex flex-col gap-1.5 p-6', className)} {...props} />
}

function SheetTitle({ className, ...props }: React.ComponentPropsWithoutRef<typeof RadixDialog.Title>) {
  return (
    <RadixDialog.Title
      className={cn('font-display text-lg font-semibold', className)}
      {...props}
    />
  )
}

function SheetBody({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn('px-6 pb-6', className)} {...props} />
}

export { Sheet, SheetTrigger, SheetClose, SheetContent, SheetHeader, SheetTitle, SheetBody }
