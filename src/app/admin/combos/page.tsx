'use client'

import { useEffect, useState } from 'react'
import { useAdminAuth } from '@/hooks/useAdminAuth'
import { createClient } from '@/lib/supabase/client'
import { AdminLayout } from '@/components/layout/AdminLayout'
import { CombosList, type ComboWithLots } from '@/components/admin/combos/CombosList'
import type { TicketLot } from '@/repositories/TicketLotRepository'

export default function CombosPage() {
  const { user, loading: authLoading } = useAdminAuth()
  const [combos, setCombos] = useState<ComboWithLots[]>([])
  const [lots, setLots] = useState<TicketLot[]>([])
  const [dataLoading, setDataLoading] = useState(true)

  useEffect(() => {
    if (!user) return
    async function load() {
      const supabase = createClient()
      const [combosRes, lotsRes] = await Promise.all([
        supabase
          .from('ticket_lot_bumps_encontro')
          .select(
            '*, principal:ticket_lots_encontro!ticket_lot_bumps_encontro_principal_lot_id_fkey(*), offered:ticket_lots_encontro!ticket_lot_bumps_encontro_offered_lot_id_fkey(*)',
          )
          .order('display_order', { ascending: true }),
        supabase.from('ticket_lots_encontro').select('*').order('display_order', { ascending: true }),
      ])
      setCombos((combosRes.data as unknown as ComboWithLots[]) ?? [])
      setLots(lotsRes.data ?? [])
      setDataLoading(false)
    }
    load()
  }, [user])

  if (authLoading || dataLoading) {
    return (
      <AdminLayout>
        <div className="p-8 text-sm text-muted-foreground">Carregando…</div>
      </AdminLayout>
    )
  }

  return (
    <AdminLayout>
      <div className="p-6 lg:p-8">
        <CombosList combos={combos} lots={lots} />
      </div>
    </AdminLayout>
  )
}
