'use client'

import * as RadixAccordion from '@radix-ui/react-accordion'
import { ChevronDown } from 'lucide-react'
import { cn } from '@/utils/cn'

const Accordion = RadixAccordion.Root

function AccordionItem({
  className,
  ...props
}: React.ComponentPropsWithoutRef<typeof RadixAccordion.Item>) {
  return (
    <RadixAccordion.Item
      className={cn('border-b border-border last:border-0', className)}
      {...props}
    />
  )
}

function AccordionTrigger({
  className,
  children,
  ...props
}: React.ComponentPropsWithoutRef<typeof RadixAccordion.Trigger>) {
  return (
    <RadixAccordion.Header className="flex">
      <RadixAccordion.Trigger
        className={cn(
          'flex flex-1 items-center justify-between py-4 text-sm font-medium text-foreground',
          'text-left transition-colors duration-200 hover:text-primary',
          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background',
          '[&[data-state=open]>svg]:rotate-180',
          className,
        )}
        {...props}
      >
        {children}
        <ChevronDown className="h-4 w-4 shrink-0 text-muted-foreground transition-transform duration-200" />
      </RadixAccordion.Trigger>
    </RadixAccordion.Header>
  )
}

function AccordionContent({
  className,
  children,
  ...props
}: React.ComponentPropsWithoutRef<typeof RadixAccordion.Content>) {
  return (
    <RadixAccordion.Content
      className={cn(
        'overflow-hidden text-sm text-muted-foreground',
        'data-[state=open]:animate-fade-in',
        'data-[state=closed]:animate-fade-in',
        className,
      )}
      {...props}
    >
      <div className="pb-4">{children}</div>
    </RadixAccordion.Content>
  )
}

export { Accordion, AccordionItem, AccordionTrigger, AccordionContent }
