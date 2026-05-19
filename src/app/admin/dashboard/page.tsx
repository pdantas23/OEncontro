'use client'

import { useEffect, useState } from 'react'
import { useAdminAuth } from '@/hooks/useAdminAuth'
import { createClient } from '@/lib/supabase/client'
import { AdminLayout } from '@/components/layout/AdminLayout'
import { KpiCards } from '@/components/admin/dashboard/KpiCards'
import { SalesChart } from '@/components/admin/dashboard/SalesChart'
import type { KpiData, SalesChartPoint } from '@/repositories/DashboardRepository'

export default function AdminDashboardPage() {
  const { user, loading: authLoading } = useAdminAuth()
  const [kpis, setKpis] = useState<KpiData | null>(null)
  const [salesChart, setSalesChart] = useState<SalesChartPoint[]>([])
  const [dataLoading, setDataLoading] = useState(true)

  useEffect(() => {
    if (!user) return
    async function load() {
      const supabase = createClient()
      const since = new Date()
      since.setDate(since.getDate() - 30)

      const [paidResult, pendingResult, totalResult, chartResult] = await Promise.all([
        supabase.from('orders_encontro').select('ticket_quantity, total').eq('payment_status', 'paid'),
        supabase.from('orders_encontro').select('id', { count: 'exact', head: true }).eq('payment_status', 'pending').eq('payment_method', 'pix'),
        supabase.from('orders_encontro').select('id', { count: 'exact', head: true }),
        supabase.from('orders_encontro').select('created_at, total').eq('payment_status', 'paid').gte('created_at', since.toISOString()).order('created_at', { ascending: true }),
      ])

      const paid = paidResult.data ?? []
      setKpis({
        totalSold: paid.reduce((s, o) => s + (o.ticket_quantity ?? 0), 0),
        totalRevenue: paid.reduce((s, o) => s + (o.total ?? 0), 0),
        pendingPix: pendingResult.count ?? 0,
        conversionRate: (totalResult.count ?? 0) > 0 ? (paid.length / (totalResult.count ?? 1)) * 100 : 0,
      })

      const byDay = new Map<string, { total: number; count: number }>()
      for (const o of chartResult.data ?? []) {
        const date = o.created_at.slice(0, 10)
        const e = byDay.get(date) ?? { total: 0, count: 0 }
        byDay.set(date, { total: e.total + o.total, count: e.count + 1 })
      }
      setSalesChart(Array.from(byDay.entries()).sort(([a], [b]) => a.localeCompare(b)).map(([date, { total, count }]) => ({ date, total, count })))
      setDataLoading(false)
    }
    load()
  }, [user])

  if (authLoading || dataLoading) {
    return <AdminLayout><div className="p-8 text-sm text-muted-foreground">Carregando…</div></AdminLayout>
  }

  const roleLabel = user?.role === 'marketing' ? 'Marketing' : 'Comercial'

  return (
    <AdminLayout>
      <div className="p-6 lg:p-8 space-y-8">
        <div>
          <h1 className="font-display text-2xl font-bold text-foreground">Dashboard</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Bem-vindo, {user?.email}{' '}
            <span className="rounded-full bg-accent/15 px-2 py-0.5 text-xs font-medium text-accent">
              {roleLabel}
            </span>
          </p>
        </div>
        {kpis && <KpiCards initial={kpis} />}
        <SalesChart data={salesChart} />
      </div>
    </AdminLayout>
  )
}
