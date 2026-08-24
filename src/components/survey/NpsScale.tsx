'use client'

/**
 * NpsScale — Nota de 0 a 10 para indicação.
 * Nada de "NPS" na tela: a pergunta é escrita em português comum e as duas
 * pontas da escala são rotuladas.
 */

import { NPS_MAX, NPS_MIN } from '@/config/survey'
import { cn } from '@/utils/cn'

export interface NpsScaleProps {
  value: number | null
  onChange: (value: number) => void
  ariaLabel: string
}

const SCORES = Array.from({ length: NPS_MAX - NPS_MIN + 1 }, (_, i) => NPS_MIN + i)

export function NpsScale({ value, onChange, ariaLabel }: NpsScaleProps) {
  return (
    <div>
      <div
        role="radiogroup"
        aria-label={ariaLabel}
        className="grid grid-cols-6 gap-1.5 sm:grid-cols-11"
      >
        {SCORES.map((score) => {
          const selected = value === score
          return (
            <button
              key={score}
              type="button"
              role="radio"
              aria-checked={selected}
              onClick={() => onChange(score)}
              className={cn(
                'flex h-12 items-center justify-center rounded-lg border text-sm font-semibold tabular-nums transition-all duration-150',
                'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background',
                selected
                  ? 'border-primary bg-primary text-primary-foreground shadow-sm'
                  : 'border-border bg-secondary text-muted-foreground hover:border-primary/40 hover:text-foreground',
              )}
            >
              {score}
            </button>
          )
        })}
      </div>

      <div className="mt-2 flex items-center justify-between text-xs text-muted-foreground">
        <span>Não indicaria</span>
        <span>Indicaria com certeza</span>
      </div>
    </div>
  )
}
