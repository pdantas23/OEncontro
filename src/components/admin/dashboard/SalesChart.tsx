'use client'

import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts'
import { formatCurrency } from '@/utils/format'
import type { SalesChartPoint } from '@/repositories/DashboardRepository'

interface SalesChartProps {
  data: SalesChartPoint[]
}

function formatDay(dateStr: string): string {
  const [, month, day] = dateStr.split('-')
  return `${day}/${month}`
}

export function SalesChart({ data }: SalesChartProps) {
  if (data.length === 0) {
    return (
      <div className="flex h-48 items-center justify-center rounded-lg border border-border bg-card">
        <p className="text-sm text-muted-foreground">Sem vendas no período.</p>
      </div>
    )
  }

  return (
    <div className="rounded-lg border border-border bg-card p-6">
      <h2 className="mb-6 font-sans text-sm font-semibold text-foreground">Vendas — últimos 30 dias</h2>
      <ResponsiveContainer width="100%" height={260}>
        <AreaChart data={data} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
          <defs>
            <linearGradient id="salesGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#C9A84C" stopOpacity={0.25} />
              <stop offset="100%" stopColor="#C9A84C" stopOpacity={0.02} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
          <XAxis
            dataKey="date"
            tickFormatter={formatDay}
            tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }}
            tickLine={false}
            axisLine={false}
            dy={8}
          />
          <YAxis
            tickFormatter={(v: number) => `R$${v}`}
            tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }}
            tickLine={false}
            axisLine={false}
            width={60}
          />
          <Tooltip
            formatter={(value) => [formatCurrency(Number(value)), 'Receita']}
            labelFormatter={(label) => formatDay(String(label))}
            contentStyle={{
              background: 'hsl(var(--card))',
              border: '1px solid hsl(var(--border))',
              borderRadius: '8px',
              fontSize: 12,
              padding: '8px 12px',
            }}
          />
          <Area
            type="monotone"
            dataKey="total"
            stroke="#C9A84C"
            strokeWidth={2}
            fill="url(#salesGradient)"
            dot={false}
            activeDot={{ r: 4, stroke: '#C9A84C', strokeWidth: 2, fill: 'hsl(var(--card))' }}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  )
}
