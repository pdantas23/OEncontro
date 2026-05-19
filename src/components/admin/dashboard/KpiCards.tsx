'use client'

/**
 * KpiCards — Cards de métricas do dashboard.
 * Client Component: escuta Supabase Realtime para auto-atualização.
 *
 * Realtime: escuta apenas UPDATE em orders WHERE payment_status=eq.paid.
 * Ao receber evento: refetch via /api/admin/kpis (não calcula delta no cliente).
 */

import { useEffect, useState } from 'react'
import { TrendingUp, Ticket, Clock, BarChart2 } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { formatCurrency } from '@/utils/format'
import type { KpiData } from '@/repositories/DashboardRepository'

interface KpiCardsProps {
  initial: KpiData
}

const cards = (kpis: KpiData) => [
  {
    label: 'Ingressos vendidos',
    value: kpis.totalSold.toString(),
    icon: Ticket,
    color: 'text-primary',
  },
  {
    label: 'Receita total',
    value: formatCurrency(kpis.totalRevenue),
    icon: TrendingUp,
    color: 'text-emerald-500',
  },
  {
    label: 'Pix pendentes',
    value: kpis.pendingPix.toString(),
    icon: Clock,
    color: 'text-amber-500',
  },
  {
    label: 'Conversão',
    value: `${kpis.conversionRate.toFixed(1)}%`,
    icon: BarChart2,
    color: 'text-sky-500',
  },
]

export function KpiCards({ initial }: KpiCardsProps) {
  const [kpis, setKpis] = useState<KpiData>(initial)

  useEffect(() => {
    const supabase = createClient()

    const channel = supabase
      .channel('kpis')
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'orders_encontro',
          filter: 'payment_status=eq.paid',
        },
        async () => {
          try {
            const [paidResult, pendingResult, totalResult] = await Promise.all([
              supabase.from('orders_encontro').select('ticket_quantity, total').eq('payment_status', 'paid'),
              supabase.from('orders_encontro').select('id', { count: 'exact', head: true }).eq('payment_status', 'pending').eq('payment_method', 'pix'),
              supabase.from('orders_encontro').select('id', { count: 'exact', head: true }),
            ])
            const paid = paidResult.data ?? []
            setKpis({
              totalSold: paid.reduce((s, o) => s + (o.ticket_quantity ?? 0), 0),
              totalRevenue: paid.reduce((s, o) => s + (o.total ?? 0), 0),
              pendingPix: pendingResult.count ?? 0,
              conversionRate: (totalResult.count ?? 0) > 0 ? (paid.length / (totalResult.count ?? 1)) * 100 : 0,
            })
          } catch {
            // Falha silenciosa
          }
        },
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [])

  return (
    <dl className="grid grid-cols-2 gap-4 lg:grid-cols-4">
      {cards(kpis).map((card) => {
        const Icon = card.icon
        return (
          <div
            key={card.label}
            className="rounded-lg border border-border bg-card p-5 shadow-sm"
          >
            <div className="flex items-center justify-between">
              <dt className="text-xs font-medium text-muted-foreground">{card.label}</dt>
              <Icon className={`h-4 w-4 ${card.color}`} aria-hidden="true" />
            </div>
            <dd className="mt-2 font-display text-2xl font-bold text-foreground tabular-nums">
              {card.value}
            </dd>
          </div>
        )
      })}
    </dl>
  )
}
