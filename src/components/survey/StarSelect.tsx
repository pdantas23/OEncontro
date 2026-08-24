'use client'

/**
 * StarSelect — Nota de 1 a 5 em estrelas clicáveis.
 *
 * Substitui os botões numerados: a pessoa toca na estrela e pronto. As
 * estrelas se preenchem até a que está sob o dedo/cursor e o significado da
 * nota aparece por extenso logo abaixo, para ninguém precisar adivinhar
 * o que "4" quer dizer.
 *
 * Acessibilidade: radiogroup navegável por setas, cada estrela com o rótulo
 * completo ("4 — Muito bom") para leitores de tela.
 */

import { useState } from 'react'
import { Star } from 'lucide-react'
import { cn } from '@/utils/cn'
import type { ChoiceOption } from '@/config/survey'

export interface StarSelectProps {
  value?: number
  onChange: (value: number) => void
  /** Opções de 1 a 5, em ordem crescente */
  options: ChoiceOption<number>[]
  ariaLabel: string
  size?: 'md' | 'lg'
}

const ICON_SIZE = {
  md: 'h-8 w-8',
  lg: 'h-10 w-10',
}

const HIT_SIZE = {
  md: 'h-12 w-12',
  lg: 'h-14 w-14',
}

export function StarSelect({ value, onChange, options, ariaLabel, size = 'lg' }: StarSelectProps) {
  const [preview, setPreview] = useState<number | null>(null)

  const shown = preview ?? value ?? 0
  const shownLabel = options.find((o) => o.value === shown)?.label

  function handleKeyDown(event: React.KeyboardEvent) {
    const current = value ?? 0
    if (event.key === 'ArrowRight' || event.key === 'ArrowUp') {
      event.preventDefault()
      onChange(Math.min(current + 1, options.length))
    }
    if (event.key === 'ArrowLeft' || event.key === 'ArrowDown') {
      event.preventDefault()
      onChange(Math.max(current - 1, 1))
    }
  }

  return (
    <div>
      <div
        role="radiogroup"
        aria-label={ariaLabel}
        onKeyDown={handleKeyDown}
        onMouseLeave={() => setPreview(null)}
        className="flex justify-center gap-1 sm:gap-2"
      >
        {options.map((option) => {
          const filled = option.value <= shown
          const selected = value === option.value

          return (
            <button
              key={option.value}
              type="button"
              role="radio"
              aria-checked={selected}
              aria-label={`${option.value} — ${option.label}`}
              tabIndex={selected || (!value && option.value === 1) ? 0 : -1}
              onClick={() => onChange(option.value)}
              onMouseEnter={() => setPreview(option.value)}
              onFocus={() => setPreview(option.value)}
              onBlur={() => setPreview(null)}
              className={cn(
                'flex items-center justify-center rounded-full transition-transform duration-150',
                'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background',
                'hover:scale-110 active:scale-95',
                HIT_SIZE[size],
              )}
            >
              <Star
                className={cn(
                  ICON_SIZE[size],
                  'transition-colors duration-150',
                  filled ? 'fill-accent text-accent' : 'fill-transparent text-border',
                )}
                strokeWidth={1.5}
                aria-hidden="true"
              />
            </button>
          )
        })}
      </div>

      <p
        aria-live="polite"
        className={cn(
          'mt-3 text-center text-sm font-medium transition-colors duration-200',
          shownLabel ? 'text-foreground' : 'text-muted-foreground',
        )}
      >
        {shownLabel ?? 'Toque nas estrelas para dar sua nota'}
      </p>
    </div>
  )
}
