'use client'

import * as RadixDropdown from '@radix-ui/react-dropdown-menu'
import { Check, ChevronRight, Circle } from 'lucide-react'
import { cn } from '@/utils/cn'

const Dropdown = RadixDropdown.Root
const DropdownTrigger = RadixDropdown.Trigger
const DropdownGroup = RadixDropdown.Group
const DropdownPortal = RadixDropdown.Portal
const DropdownSub = RadixDropdown.Sub
const DropdownRadioGroup = RadixDropdown.RadioGroup

function DropdownSubTrigger({
  className,
  inset,
  children,
  ...props
}: React.ComponentPropsWithoutRef<typeof RadixDropdown.SubTrigger> & { inset?: boolean }) {
  return (
    <RadixDropdown.SubTrigger
      className={cn(
        'flex cursor-default select-none items-center gap-2 rounded px-2 py-1.5 text-sm text-foreground outline-none',
        'hover:bg-muted focus:bg-muted',
        'data-[state=open]:bg-muted',
        inset && 'pl-8',
        className,
      )}
      {...props}
    >
      {children}
      <ChevronRight className="ml-auto h-4 w-4" />
    </RadixDropdown.SubTrigger>
  )
}

function DropdownSubContent({
  className,
  ...props
}: React.ComponentPropsWithoutRef<typeof RadixDropdown.SubContent>) {
  return (
    <RadixDropdown.SubContent
      className={cn(
        'z-50 min-w-[8rem] overflow-hidden rounded border border-border bg-secondary p-1 shadow-md',
        'animate-scale-in',
        className,
      )}
      {...props}
    />
  )
}

function DropdownContent({
  className,
  sideOffset = 4,
  ...props
}: React.ComponentPropsWithoutRef<typeof RadixDropdown.Content>) {
  return (
    <RadixDropdown.Portal>
      <RadixDropdown.Content
        sideOffset={sideOffset}
        className={cn(
          'z-50 min-w-[8rem] overflow-hidden rounded border border-border bg-secondary p-1 shadow-md',
          'animate-scale-in',
          className,
        )}
        {...props}
      />
    </RadixDropdown.Portal>
  )
}

function DropdownItem({
  className,
  inset,
  ...props
}: React.ComponentPropsWithoutRef<typeof RadixDropdown.Item> & { inset?: boolean }) {
  return (
    <RadixDropdown.Item
      className={cn(
        'relative flex cursor-pointer select-none items-center gap-2 rounded px-2 py-1.5 text-sm text-foreground outline-none',
        'transition-colors duration-150',
        'hover:bg-muted focus:bg-muted',
        'data-[disabled]:pointer-events-none data-[disabled]:opacity-50',
        inset && 'pl-8',
        className,
      )}
      {...props}
    />
  )
}

function DropdownCheckboxItem({
  className,
  children,
  checked,
  ...props
}: React.ComponentPropsWithoutRef<typeof RadixDropdown.CheckboxItem>) {
  return (
    <RadixDropdown.CheckboxItem
      className={cn(
        'relative flex cursor-pointer select-none items-center rounded py-1.5 pl-8 pr-2 text-sm text-foreground outline-none',
        'hover:bg-muted focus:bg-muted',
        'data-[disabled]:pointer-events-none data-[disabled]:opacity-50',
        className,
      )}
      checked={checked}
      {...props}
    >
      <span className="absolute left-2 flex h-3.5 w-3.5 items-center justify-center">
        <RadixDropdown.ItemIndicator>
          <Check className="h-4 w-4" />
        </RadixDropdown.ItemIndicator>
      </span>
      {children}
    </RadixDropdown.CheckboxItem>
  )
}

function DropdownRadioItem({
  className,
  children,
  ...props
}: React.ComponentPropsWithoutRef<typeof RadixDropdown.RadioItem>) {
  return (
    <RadixDropdown.RadioItem
      className={cn(
        'relative flex cursor-pointer select-none items-center rounded py-1.5 pl-8 pr-2 text-sm text-foreground outline-none',
        'hover:bg-muted focus:bg-muted',
        'data-[disabled]:pointer-events-none data-[disabled]:opacity-50',
        className,
      )}
      {...props}
    >
      <span className="absolute left-2 flex h-3.5 w-3.5 items-center justify-center">
        <RadixDropdown.ItemIndicator>
          <Circle className="h-2 w-2 fill-current" />
        </RadixDropdown.ItemIndicator>
      </span>
      {children}
    </RadixDropdown.RadioItem>
  )
}

function DropdownLabel({
  className,
  inset,
  ...props
}: React.ComponentPropsWithoutRef<typeof RadixDropdown.Label> & { inset?: boolean }) {
  return (
    <RadixDropdown.Label
      className={cn('px-2 py-1.5 text-xs font-medium text-muted-foreground', inset && 'pl-8', className)}
      {...props}
    />
  )
}

function DropdownSeparator({
  className,
  ...props
}: React.ComponentPropsWithoutRef<typeof RadixDropdown.Separator>) {
  return (
    <RadixDropdown.Separator className={cn('-mx-1 my-1 h-px bg-border', className)} {...props} />
  )
}

function DropdownShortcut({ className, ...props }: React.HTMLAttributes<HTMLSpanElement>) {
  return (
    <span
      className={cn('ml-auto text-xs tracking-widest text-muted-foreground', className)}
      {...props}
    />
  )
}

export {
  Dropdown,
  DropdownTrigger,
  DropdownContent,
  DropdownItem,
  DropdownCheckboxItem,
  DropdownRadioItem,
  DropdownLabel,
  DropdownSeparator,
  DropdownShortcut,
  DropdownGroup,
  DropdownPortal,
  DropdownSub,
  DropdownSubContent,
  DropdownSubTrigger,
  DropdownRadioGroup,
}
