'use client'

import { useEffect, useState } from 'react'
import { useAdminAuth } from '@/hooks/useAdminAuth'
import { createClient } from '@/lib/supabase/client'
import { AdminLayout } from '@/components/layout/AdminLayout'
import { LotList } from '@/components/admin/ingressos/LotList'
import type { TicketLot } from '@/repositories/TicketLotRepository'

export default function IngressosPage() {
  const { user, loading: authLoading } = useAdminAuth()
  const [lots, setLots] = useState<TicketLot[]>([])
  const [dataLoading, setDataLoading] = useState(true)

  useEffect(() => {
    if (!user) return
    async function load() {
      const supabase = createClient()
      const { data } = await supabase
        .from('ticket_lots_encontro')
        .select('*')
        .order('display_order', { ascending: true })
      setLots(data ?? [])
      setDataLoading(false)
    }
    load()
  }, [user])

  if (authLoading || dataLoading) {
    return <AdminLayout><div className="p-8 text-sm text-muted-foreground">Carregando…</div></AdminLayout>
  }

  return (
    <AdminLayout>
      <div className="p-6 lg:p-8">
        <LotList lots={lots} />
      </div>
    </AdminLayout>
  )
}
