'use client'

/**
 * AspectAverages — Médias de 1 a 5 por item avaliado, do melhor para o pior.
 * A barra usa a nota como proporção de 5 para o olho comparar rápido.
 */

import { cn } from '@/utils/cn'
import type { AverageItem } from '@/services/SurveyStatsService'

interface AspectAveragesProps {
  title: string
  items: AverageItem[]
}

/** Abaixo de 3,5 acende como ponto de atenção */
const ATTENTION_THRESHOLD = 3.5

export function AspectAverages({ title, items }: AspectAveragesProps) {
  return (
    <section className="rounded-lg border border-border bg-card p-6">
      <h2 className="mb-5 font-sans text-sm font-semibold text-foreground">{title}</h2>

      <ul className="space-y-3.5">
        {items.map((item) => {
          const needsAttention = item.average < ATTENTION_THRESHOLD
          return (
            <li key={item.key}>
              <div className="mb-1 flex items-baseline justify-between gap-4">
                <span className="text-sm text-muted-foreground">{item.label}</span>
                <span
                  className={cn(
                    'shrink-0 text-sm font-semibold tabular-nums',
                    needsAttention ? 'text-destructive' : 'text-foreground',
                  )}
                >
                  {item.average.toFixed(2)}
                </span>
              </div>

              <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted">
                <div
                  className={cn(
                    'h-full rounded-full transition-[width] duration-500',
                    needsAttention ? 'bg-destructive' : 'bg-accent',
                  )}
                  style={{ width: `${(item.average / 5) * 100}%` }}
                />
              </div>
            </li>
          )
        })}
      </ul>
    </section>
  )
}
