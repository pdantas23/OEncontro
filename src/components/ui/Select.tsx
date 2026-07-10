'use client'

import * as RadixSelect from '@radix-ui/react-select'
import { Check, ChevronDown } from 'lucide-react'
import { cn } from '@/utils/cn'

export interface SelectOption {
  value: string
  label: string
  disabled?: boolean
}

export interface SelectProps {
  options: SelectOption[]
  value?: string
  onValueChange?: (value: string) => void
  placeholder?: string
  disabled?: boolean
  error?: boolean
  className?: string
  id?: string
  name?: string
}

function Select({
  options,
  value,
  onValueChange,
  placeholder = 'Selecionar...',
  disabled = false,
  error = false,
  className,
}: SelectProps) {
  return (
    <RadixSelect.Root value={value} onValueChange={onValueChange} disabled={disabled}>
      <RadixSelect.Trigger
        className={cn(
          'flex h-10 w-full items-center justify-between rounded border bg-input px-3 py-2 text-sm text-foreground',
          'transition-colors duration-200',
          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background',
          'disabled:cursor-not-allowed disabled:opacity-50',
          'data-[placeholder]:text-muted-foreground',
          error ? 'border-destructive focus-visible:ring-destructive' : 'border-border',
          className,
        )}
        aria-invalid={error}
      >
        <RadixSelect.Value placeholder={placeholder} />
        <RadixSelect.Icon asChild>
          <ChevronDown className="h-4 w-4 text-muted-foreground" />
        </RadixSelect.Icon>
      </RadixSelect.Trigger>

      <RadixSelect.Portal>
        <RadixSelect.Content
          className={cn(
            'relative z-50 w-[var(--radix-select-trigger-width)] overflow-hidden rounded border border-border bg-secondary shadow-md',
            'animate-scale-in',
          )}
          position="popper"
          sideOffset={4}
        >
          <RadixSelect.Viewport className="p-1">
            {options.map((option) => (
              <RadixSelect.Item
                key={option.value}
                value={option.value}
                disabled={option.disabled}
                className={cn(
                  'relative flex cursor-pointer select-none items-center rounded px-8 py-2 text-sm text-foreground outline-none',
                  'transition-colors duration-150',
                  'hover:bg-muted focus:bg-muted',
                  'data-[disabled]:pointer-events-none data-[disabled]:opacity-50',
                )}
              >
                <RadixSelect.ItemIndicator className="absolute left-2">
                  <Check className="h-4 w-4 text-primary" />
                </RadixSelect.ItemIndicator>
                <RadixSelect.ItemText>{option.label}</RadixSelect.ItemText>
              </RadixSelect.Item>
            ))}
          </RadixSelect.Viewport>
        </RadixSelect.Content>
      </RadixSelect.Portal>
    </RadixSelect.Root>
  )
}

export { Select }
