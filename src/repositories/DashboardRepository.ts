/**
 * src/repositories/DashboardRepository.ts
 *
 * Queries agregadas para o dashboard admin.
 * Agrega no servidor — nunca manda dados brutos ao cliente.
 */

import { createClient } from '@/lib/supabase/server'

export interface KpiData {
  totalSold: number        // ingressos pagos
  totalRevenue: number     // receita em centavos
  pendingPix: number       // pedidos Pix pendentes
  conversionRate: number   // % pedidos pagos / total
}

export interface SalesChartPoint {
  date: string   // 'YYYY-MM-DD'
  total: number  // receita em centavos
  count: number  // número de pedidos pagos
}

export const DashboardRepository = {
  async getKpis(): Promise<KpiData> {
    const supabase = await createClient()

    const [paidResult, pendingResult, totalResult] = await Promise.all([
      supabase
        .from('orders_encontro')
        .select('ticket_quantity, total')
        .eq('payment_status', 'paid'),
      supabase
        .from('orders_encontro')
        .select('id', { count: 'exact', head: true })
        .eq('payment_status', 'pending')
        .eq('payment_method', 'pix'),
      supabase
        .from('orders_encontro')
        .select('id', { count: 'exact', head: true }),
    ])

    const paid = paidResult.data ?? []
    const totalSold = paid.reduce((acc, o) => acc + (o.ticket_quantity ?? 0), 0)
    const totalRevenue = paid.reduce((acc, o) => acc + (o.total ?? 0), 0)
    const pendingPix = pendingResult.count ?? 0
    const totalOrders = totalResult.count ?? 0
    const conversionRate = totalOrders > 0 ? (paid.length / totalOrders) * 100 : 0

    return { totalSold, totalRevenue, pendingPix, conversionRate }
  },

  async getSalesChart(days = 30): Promise<SalesChartPoint[]> {
    const supabase = await createClient()

    const since = new Date()
    since.setDate(since.getDate() - days)

    const { data, error } = await supabase
      .from('orders_encontro')
      .select('created_at, total')
      .eq('payment_status', 'paid')
      .gte('created_at', since.toISOString())
      .order('created_at', { ascending: true })

    if (error || !data) return []

    // Agregar por dia no servidor
    const byDay = new Map<string, { total: number; count: number }>()

    for (const order of data) {
      const date = order.created_at.slice(0, 10) // 'YYYY-MM-DD'
      const existing = byDay.get(date) ?? { total: 0, count: 0 }
      byDay.set(date, { total: existing.total + order.total, count: existing.count + 1 })
    }

    return Array.from(byDay.entries())
      .map(([date, { total, count }]) => ({ date, total, count }))
      .sort((a, b) => a.date.localeCompare(b.date))
  },
}
