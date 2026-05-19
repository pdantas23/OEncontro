'use client'

import { useEffect, useState } from 'react'
import { useAdminAuth } from '@/hooks/useAdminAuth'
import { createClient } from '@/lib/supabase/client'
import { AdminLayout } from '@/components/layout/AdminLayout'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { formatCurrency } from '@/utils/format'
import { cn } from '@/utils/cn'
import { Download } from 'lucide-react'
import type { Database } from '@/types/database'

type Order = Database['public']['Tables']['orders_encontro']['Row']

const PAGE_SIZE = 30

const STATUS_VARIANT: Record<string, 'default' | 'success' | 'warning' | 'destructive' | 'secondary'> = {
  paid: 'success',
  pending: 'warning',
  failed: 'destructive',
  expired: 'secondary',
  canceled: 'secondary',
  refunded: 'secondary',
}

const STATUS_LABEL: Record<string, string> = {
  paid: 'Pago',
  pending: 'Pendente',
  failed: 'Recusado',
  expired: 'Expirado',
  canceled: 'Cancelado',
  refunded: 'Estornado',
}

export default function CompradoresPage() {
  const { user, loading: authLoading } = useAdminAuth()
  const [allOrders, setAllOrders] = useState<Order[]>([])
  const [dataLoading, setDataLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)

  useEffect(() => {
    if (!user) return
    async function load() {
      const supabase = createClient()
      const { data } = await supabase
        .from('orders_encontro')
        .select('*')
        .order('created_at', { ascending: false })
      setAllOrders(data ?? [])
      setDataLoading(false)
    }
    load()
  }, [user])

  function exportCsv() {
    const rows = [
      ['Nome', 'E-mail', 'Método', 'Total', 'Status', 'Data'],
      ...allOrders.map((o) => [
        o.buyer_name,
        o.buyer_email,
        o.payment_method,
        String(o.total),
        o.payment_status,
        new Date(o.created_at).toLocaleDateString('pt-BR'),
      ]),
    ]
    const csv = rows.map((r) => r.map((c) => `"${c}"`).join(',')).join('\n')
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'compradores.csv'
    a.click()
    URL.revokeObjectURL(url)
  }

  if (authLoading || dataLoading) {
    return <AdminLayout><div className="p-8 text-sm text-muted-foreground">Carregando…</div></AdminLayout>
  }

  const q = search.toLowerCase()
  const filtered = q
    ? allOrders.filter((o) => o.buyer_email.toLowerCase().includes(q) || o.buyer_name.toLowerCase().includes(q))
    : allOrders
  const total = filtered.length
  const totalPages = Math.ceil(total / PAGE_SIZE)
  const orders = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE)

  return (
    <AdminLayout>
      <div className="p-6 lg:p-8 space-y-6">
        <div className="flex items-center justify-between gap-4">
          <div>
            <h1 className="font-display text-2xl font-bold text-foreground">Compradores</h1>
            <p className="mt-1 text-sm text-muted-foreground">{total} pedidos</p>
          </div>
          <Button variant="outline" size="sm" onClick={exportCsv}>
            <Download className="mr-2 h-4 w-4" aria-hidden="true" />
            Exportar CSV
          </Button>
        </div>

        <div className="flex gap-2">
          <input
            type="search"
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1) }}
            placeholder="Buscar por nome ou e-mail…"
            className="flex-1 rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          />
        </div>

        <div className="overflow-x-auto rounded-lg border border-border">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-muted/40">
                <th className="px-4 py-3 text-left font-medium text-muted-foreground">Nome</th>
                <th className="px-4 py-3 text-left font-medium text-muted-foreground">E-mail</th>
                <th className="px-4 py-3 text-left font-medium text-muted-foreground">Método</th>
                <th className="px-4 py-3 text-left font-medium text-muted-foreground">Total</th>
                <th className="px-4 py-3 text-left font-medium text-muted-foreground">Status</th>
                <th className="px-4 py-3 text-left font-medium text-muted-foreground">Data</th>
              </tr>
            </thead>
            <tbody>
              {orders.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-4 py-8 text-center text-muted-foreground">Nenhum resultado.</td>
                </tr>
              ) : (
                orders.map((order) => (
                  <tr key={order.id} className={cn('border-b border-border last:border-0 transition-colors hover:bg-muted/20')}>
                    <td className="px-4 py-3 font-medium text-foreground">{order.buyer_name}</td>
                    <td className="px-4 py-3 text-muted-foreground">{order.buyer_email}</td>
                    <td className="px-4 py-3 text-muted-foreground capitalize">{order.payment_method}</td>
                    <td className="px-4 py-3 tabular-nums text-foreground">{formatCurrency(order.total)}</td>
                    <td className="px-4 py-3">
                      <Badge variant={STATUS_VARIANT[order.payment_status] ?? 'secondary'}>
                        {STATUS_LABEL[order.payment_status] ?? order.payment_status}
                      </Badge>
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">
                      {new Date(order.created_at).toLocaleDateString('pt-BR')}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {totalPages > 1 && (
          <nav className="flex items-center justify-between text-sm" aria-label="Paginação">
            <p className="text-muted-foreground">Página {page} de {totalPages}</p>
            <div className="flex gap-2">
              {page > 1 && (
                <button onClick={() => setPage(page - 1)} className="rounded border border-border px-3 py-1.5 text-foreground hover:bg-muted transition-colors">
                  Anterior
                </button>
              )}
              {page < totalPages && (
                <button onClick={() => setPage(page + 1)} className="rounded border border-border px-3 py-1.5 text-foreground hover:bg-muted transition-colors">
                  Próxima
                </button>
              )}
            </div>
          </nav>
        )}
      </div>
    </AdminLayout>
  )
}
