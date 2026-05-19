import { forwardRef } from 'react'
import * as RadixSeparator from '@radix-ui/react-separator'
import { cn } from '@/utils/cn'

export interface SeparatorProps
  extends React.ComponentPropsWithoutRef<typeof RadixSeparator.Root> {}

const Separator = forwardRef<
  React.ElementRef<typeof RadixSeparator.Root>,
  SeparatorProps
>(({ className, orientation = 'horizontal', decorative = true, ...props }, ref) => (
  <RadixSeparator.Root
    ref={ref}
    decorative={decorative}
    orientation={orientation}
    className={cn(
      'shrink-0 bg-border',
      orientation === 'horizontal' ? 'h-px w-full' : 'h-full w-px',
      className,
    )}
    {...props}
  />
))

Separator.displayName = RadixSeparator.Root.displayName

export { Separator }
