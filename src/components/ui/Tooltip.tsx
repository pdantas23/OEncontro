'use client'

import * as RadixTooltip from '@radix-ui/react-tooltip'
import { cn } from '@/utils/cn'

const TooltipProvider = RadixTooltip.Provider
const TooltipRoot = RadixTooltip.Root
const TooltipTrigger = RadixTooltip.Trigger

function TooltipContent({
  className,
  sideOffset = 4,
  ...props
}: React.ComponentPropsWithoutRef<typeof RadixTooltip.Content>) {
  return (
    <RadixTooltip.Portal>
      <RadixTooltip.Content
        sideOffset={sideOffset}
        className={cn(
          'z-50 overflow-hidden rounded border border-border bg-secondary px-3 py-1.5 text-xs text-foreground shadow-md',
          'animate-fade-in',
          className,
        )}
        {...props}
      />
    </RadixTooltip.Portal>
  )
}

export interface TooltipProps {
  content: React.ReactNode
  children: React.ReactNode
  side?: 'top' | 'right' | 'bottom' | 'left'
  delayDuration?: number
}

function Tooltip({ content, children, side = 'top', delayDuration = 400 }: TooltipProps) {
  return (
    <TooltipProvider delayDuration={delayDuration}>
      <TooltipRoot>
        <TooltipTrigger asChild>{children}</TooltipTrigger>
        <TooltipContent side={side}>{content}</TooltipContent>
      </TooltipRoot>
    </TooltipProvider>
  )
}

export { Tooltip, TooltipProvider, TooltipRoot, TooltipTrigger, TooltipContent }
