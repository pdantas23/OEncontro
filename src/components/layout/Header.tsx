'use client'

import Link from 'next/link'
import { cn } from '@/utils/cn'
import { Button } from '@/components/ui/Button'

export interface HeaderProps {
  className?: string
}

/**
 * Header da landing page (marketing layout).
 * Conteúdo de texto (nome do evento) será substituído na Task Final TF03.
 */
export function Header({ className }: HeaderProps) {
  return (
    <header
      className={cn(
        'sticky top-0 z-40 w-full border-b border-border/50 bg-background/90 backdrop-blur-md',
        className,
      )}
    >
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-container-x">
        {/* Logo / nome do evento — Task Final TF03 */}
        <Link
          href="/"
          className="font-display text-lg font-semibold text-primary transition-opacity hover:opacity-80 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
          aria-label="Voltar ao início"
        >
          {/* Task Final TF03: substituir pelo nome real do evento */}
          Evento
        </Link>

        {/* CTA principal */}
        <Button
          asChild={false}
          size="sm"
          onClick={() => {
            document.getElementById('ingressos')?.scrollIntoView({ behavior: 'smooth' })
          }}
        >
          Garantir meu ingresso
        </Button>
      </div>
    </header>
  )
}
