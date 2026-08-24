'use client'

/**
 * SurveyKpis — Números de topo da pesquisa.
 * "Recomendação líquida" é o NPS: % de quem deu 9–10 menos % de quem deu 0–6.
 */

import { MessageSquare, Star, ThumbsUp, Gauge } from 'lucide-react'
import { StarRating } from '@/components/ui/StarRating'
import type { SurveyStats } from '@/services/SurveyStatsService'

interface SurveyKpisProps {
  stats: SurveyStats
}

export function SurveyKpis({ stats }: SurveyKpisProps) {
  const cards = [
    {
      label: 'Respostas recebidas',
      value: stats.total.toString(),
      icon: MessageSquare,
      color: 'text-primary',
      extra: null as React.ReactNode,
    },
    {
      label: 'Nota geral (1–5)',
      value: stats.overallAverage.toFixed(2),
      icon: Star,
      color: 'text-amber-500',
      extra: <StarRating value={Math.round(stats.overallAverage)} size="sm" tone="accent" />,
    },
    {
      label: 'Indicação (0–10)',
      value: stats.npsAverage.toFixed(2),
      icon: ThumbsUp,
      color: 'text-emerald-500',
      extra: (
        <span className="font-detail text-xs text-muted-foreground">
          {stats.promoters} promotores · {stats.passives} neutros · {stats.detractors} críticos
        </span>
      ),
    },
    {
      label: 'Recomendação líquida',
      value: stats.npsScore > 0 ? `+${stats.npsScore}` : stats.npsScore.toString(),
      icon: Gauge,
      color: 'text-sky-500',
      extra: (
        <span className="font-detail text-xs text-muted-foreground">
          % de notas 9–10 menos % de 0–6
        </span>
      ),
    },
  ]

  return (
    <dl className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
      {cards.map((card) => {
        const Icon = card.icon
        return (
          <div key={card.label} className="rounded-lg border border-border bg-card p-5 shadow-sm">
            <div className="flex items-center justify-between">
              <dt className="text-xs font-medium text-muted-foreground">{card.label}</dt>
              <Icon className={`h-4 w-4 ${card.color}`} aria-hidden="true" />
            </div>
            <dd className="mt-2 font-sans text-2xl font-bold tabular-nums text-foreground">
              {card.value}
            </dd>
            {card.extra && <div className="mt-1.5">{card.extra}</div>}
          </div>
        )
      })}
    </dl>
  )
}
