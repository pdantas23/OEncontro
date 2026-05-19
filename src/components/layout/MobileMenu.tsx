'use client'

import { useState } from 'react'
import { Menu, X } from 'lucide-react'
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetBody } from '@/components/ui/Sheet'
import { Button } from '@/components/ui/Button'
import { cn } from '@/utils/cn'

const NAV_ITEMS = [
  { label: 'Sobre o evento', href: '#sobre' },
  { label: 'Para quem é',    href: '#para-quem' },
  { label: 'Programação',    href: '#programacao' },
  { label: 'Palestrantes',   href: '#palestrantes' },
  { label: 'Ingressos',      href: '#ingressos' },
  { label: 'FAQ',            href: '#faq' },
]

export interface MobileMenuProps {
  className?: string
}

export function MobileMenu({ className }: MobileMenuProps) {
  const [open, setOpen] = useState(false)

  function handleNavClick(href: string) {
    setOpen(false)
    setTimeout(() => {
      document.querySelector(href)?.scrollIntoView({ behavior: 'smooth' })
    }, 150)
  }

  return (
    <div className={cn('md:hidden', className)}>
      <button
        onClick={() => setOpen(true)}
        className="rounded p-2 text-muted-foreground transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        aria-label="Abrir menu"
        aria-expanded={open}
      >
        <Menu className="h-5 w-5" />
      </button>

      <Sheet open={open} onOpenChange={setOpen}>
        <SheetContent side="right">
          <SheetHeader>
            <SheetTitle>Menu</SheetTitle>
          </SheetHeader>
          <SheetBody>
            <nav aria-label="Menu mobile">
              <ul className="flex flex-col gap-1">
                {NAV_ITEMS.map((item) => (
                  <li key={item.href}>
                    <button
                      onClick={() => handleNavClick(item.href)}
                      className="w-full rounded px-3 py-2.5 text-left text-sm text-foreground transition-colors hover:bg-muted hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                    >
                      {item.label}
                    </button>
                  </li>
                ))}
              </ul>
            </nav>

            <div className="mt-6">
              <Button
                className="w-full"
                onClick={() => handleNavClick('#ingressos')}
              >
                Garantir meu ingresso
              </Button>
            </div>
          </SheetBody>
        </SheetContent>
      </Sheet>
    </div>
  )
}
