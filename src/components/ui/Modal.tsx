'use client'

import * as RadixDialog from '@radix-ui/react-dialog'
import { X } from 'lucide-react'
import { cn } from '@/utils/cn'

const Modal = RadixDialog.Root
const ModalTrigger = RadixDialog.Trigger
const ModalClose = RadixDialog.Close

function ModalOverlay({ className, ...props }: React.ComponentPropsWithoutRef<typeof RadixDialog.Overlay>) {
  return (
    <RadixDialog.Overlay
      className={cn(
        'fixed inset-0 z-50 bg-black/60 backdrop-blur-sm',
        'data-[state=open]:animate-fade-in data-[state=closed]:animate-fade-in',
        className,
      )}
      {...props}
    />
  )
}

export interface ModalContentProps
  extends React.ComponentPropsWithoutRef<typeof RadixDialog.Content> {
  size?: 'sm' | 'md' | 'lg' | 'xl'
  showClose?: boolean
}

const sizeClass = {
  sm: 'max-w-sm',
  md: 'max-w-md',
  lg: 'max-w-lg',
  xl: 'max-w-2xl',
}

function ModalContent({
  className,
  children,
  size = 'md',
  showClose = true,
  ...props
}: ModalContentProps) {
  return (
    <RadixDialog.Portal>
      <ModalOverlay />
      <RadixDialog.Content
        className={cn(
          'fixed left-1/2 top-1/2 z-50 w-[calc(100%-2rem)] -translate-x-1/2 -translate-y-1/2',
          'rounded-lg border border-border bg-secondary shadow-xl',
          'animate-scale-in',
          'focus:outline-none',
          sizeClass[size],
          className,
        )}
        aria-modal="true"
        {...props}
      >
        {showClose && (
          <RadixDialog.Close className="absolute right-4 top-4 rounded p-1 text-muted-foreground transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
            <X className="h-4 w-4" />
            <span className="sr-only">Fechar</span>
          </RadixDialog.Close>
        )}
        {children}
      </RadixDialog.Content>
    </RadixDialog.Portal>
  )
}

function ModalHeader({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn('flex flex-col gap-1.5 p-6 pb-0', className)} {...props} />
}

function ModalTitle({ className, ...props }: React.ComponentPropsWithoutRef<typeof RadixDialog.Title>) {
  return (
    <RadixDialog.Title
      className={cn('font-display text-lg font-semibold text-foreground', className)}
      {...props}
    />
  )
}

function ModalDescription({ className, ...props }: React.ComponentPropsWithoutRef<typeof RadixDialog.Description>) {
  return (
    <RadixDialog.Description
      className={cn('text-sm text-muted-foreground', className)}
      {...props}
    />
  )
}

function ModalBody({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn('p-6', className)} {...props} />
}

function ModalFooter({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn('flex items-center justify-end gap-2 border-t border-border p-6', className)}
      {...props}
    />
  )
}

export {
  Modal,
  ModalTrigger,
  ModalClose,
  ModalContent,
  ModalHeader,
  ModalTitle,
  ModalDescription,
  ModalBody,
  ModalFooter,
}
