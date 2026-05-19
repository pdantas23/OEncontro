'use client'

import { forwardRef } from 'react'
import * as RadixCheckbox from '@radix-ui/react-checkbox'
import { Check } from 'lucide-react'
import { cn } from '@/utils/cn'

export interface CheckboxProps
  extends Omit<React.ComponentPropsWithoutRef<typeof RadixCheckbox.Root>, 'onChange'> {
  label?: string
  error?: boolean
}

const Checkbox = forwardRef<React.ElementRef<typeof RadixCheckbox.Root>, CheckboxProps>(
  ({ className, label, id, error = false, ...props }, ref) => {
    const checkboxId = id ?? `checkbox-${Math.random().toString(36).slice(2, 8)}`

    return (
      <div className="flex items-center gap-2">
        <RadixCheckbox.Root
          ref={ref}
          id={checkboxId}
          className={cn(
            'peer h-4 w-4 shrink-0 rounded-sm border border-border bg-input',
            'transition-colors duration-200',
            'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background',
            'disabled:cursor-not-allowed disabled:opacity-50',
            'data-[state=checked]:bg-primary data-[state=checked]:border-primary data-[state=checked]:text-primary-foreground',
            error && 'border-destructive',
            className,
          )}
          aria-invalid={error}
          {...props}
        >
          <RadixCheckbox.Indicator className="flex items-center justify-center text-current">
            <Check className="h-3 w-3" />
          </RadixCheckbox.Indicator>
        </RadixCheckbox.Root>

        {label && (
          <label
            htmlFor={checkboxId}
            className="text-sm text-foreground leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-50 cursor-pointer"
          >
            {label}
          </label>
        )}
      </div>
    )
  },
)

Checkbox.displayName = 'Checkbox'

export { Checkbox }
