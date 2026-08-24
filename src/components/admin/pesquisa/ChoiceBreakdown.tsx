'use client'

/**
 * ChoiceBreakdown — Distribuição de uma pergunta de seleção:
 * quantas pessoas escolheram cada opção.
 */

import type { BreakdownItem } from '@/services/SurveyStatsService'

interface ChoiceBreakdownProps {
  title: string
  items: BreakdownItem[]
}

export function ChoiceBreakdown({ title, items }: ChoiceBreakdownProps) {
  return (
    <section className="rounded-lg border border-border bg-card p-6">
      <h2 className="mb-5 font-sans text-sm font-semibold text-foreground">{title}</h2>

      <ul className="space-y-3.5">
        {items.map((item) => (
          <li key={item.value}>
            <div className="mb-1 flex items-baseline justify-between gap-4">
              <span className="text-sm text-muted-foreground">{item.label}</span>
              <span className="shrink-0 text-sm font-semibold tabular-nums text-foreground">
                {item.count}
                <span className="ml-1.5 font-normal text-muted-foreground">{item.percent}%</span>
              </span>
            </div>

            <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted">
              <div
                className="h-full rounded-full bg-primary transition-[width] duration-500"
                style={{ width: `${item.percent}%` }}
              />
            </div>
          </li>
        ))}
      </ul>
    </section>
  )
}
