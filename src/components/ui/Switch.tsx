'use client'

import { forwardRef } from 'react'
import * as RadixSwitch from '@radix-ui/react-switch'
import { cn } from '@/utils/cn'

export interface SwitchProps
  extends React.ComponentPropsWithoutRef<typeof RadixSwitch.Root> {
  label?: string
  description?: string
}

const Switch = forwardRef<React.ElementRef<typeof RadixSwitch.Root>, SwitchProps>(
  ({ className, label, description, id, ...props }, ref) => {
    const switchId = id ?? `switch-${Math.random().toString(36).slice(2, 8)}`

    return (
      <div className="flex items-center gap-3">
        <RadixSwitch.Root
          ref={ref}
          id={switchId}
          className={cn(
            'peer inline-flex h-6 w-11 shrink-0 cursor-pointer items-center rounded-full border-2 border-transparent',
            'transition-colors duration-200',
            'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background',
            'disabled:cursor-not-allowed disabled:opacity-50',
            'data-[state=unchecked]:bg-muted',
            'data-[state=checked]:bg-primary',
            className,
          )}
          {...props}
        >
          <RadixSwitch.Thumb
            className={cn(
              'pointer-events-none block h-5 w-5 rounded-full bg-foreground shadow-sm ring-0',
              'transition-transform duration-200',
              'data-[state=unchecked]:translate-x-0',
              'data-[state=checked]:translate-x-5',
            )}
          />
        </RadixSwitch.Root>

        {(label ?? description) && (
          <div className="flex flex-col">
            {label && (
              <label
                htmlFor={switchId}
                className="text-sm font-medium text-foreground cursor-pointer peer-disabled:cursor-not-allowed peer-disabled:opacity-50"
              >
                {label}
              </label>
            )}
            {description && (
              <span className="text-xs text-muted-foreground">{description}</span>
            )}
          </div>
        )}
      </div>
    )
  },
)

Switch.displayName = 'Switch'

export { Switch }
