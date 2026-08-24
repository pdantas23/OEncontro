'use client'

/**
 * OptionCard — Card grande e clicável para perguntas de seleção.
 * Feedback visual imediato: borda + fundo em destaque e marca de conferido.
 */

import { Check } from 'lucide-react'
import { cn } from '@/utils/cn'

export interface OptionCardProps {
  label: string
  description?: string
  selected: boolean
  onSelect: () => void
  /** Elemento à esquerda (estrelas, número, ícone) */
  leading?: React.ReactNode
  className?: string
}

export function OptionCard({
  label,
  description,
  selected,
  onSelect,
  leading,
  className,
}: OptionCardProps) {
  return (
    <button
      type="button"
      onClick={onSelect}
      aria-pressed={selected}
      className={cn(
        'flex w-full items-center gap-3 rounded-lg border p-4 text-left transition-all duration-150',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background',
        selected
          ? 'border-primary bg-primary/5 shadow-sm'
          : 'border-border bg-secondary hover:border-primary/40 hover:bg-secondary/70',
        className,
      )}
    >
      {leading && <span className="shrink-0">{leading}</span>}

      <span className="min-w-0 flex-1">
        <span className="block font-medium leading-snug text-foreground">{label}</span>
        {description && (
          <span className="mt-0.5 block text-sm leading-snug text-muted-foreground">
            {description}
          </span>
        )}
      </span>

      <span
        className={cn(
          'flex h-6 w-6 shrink-0 items-center justify-center rounded-full border transition-colors',
          selected
            ? 'border-primary bg-primary text-primary-foreground'
            : 'border-border bg-background',
        )}
        aria-hidden="true"
      >
        {selected && <Check className="h-4 w-4" />}
      </span>
    </button>
  )
}
