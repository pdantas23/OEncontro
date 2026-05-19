'use client'

import { useEffect, useState } from 'react'
import { useAdminAuth } from '@/hooks/useAdminAuth'
import { createClient } from '@/lib/supabase/client'
import { AdminLayout } from '@/components/layout/AdminLayout'
import { BumpList } from '@/components/admin/order-bumps/BumpList'
import type { OrderBump } from '@/repositories/OrderBumpRepository'

export default function OrderBumpsPage() {
  const { user, loading: authLoading } = useAdminAuth()
  const [bumps, setBumps] = useState<OrderBump[]>([])
  const [dataLoading, setDataLoading] = useState(true)

  useEffect(() => {
    if (!user) return
    async function load() {
      const supabase = createClient()
      const { data } = await supabase
        .from('order_bumps_encontro')
        .select('*')
        .order('display_order', { ascending: true })
      setBumps(data ?? [])
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
        <BumpList bumps={bumps} />
      </div>
    </AdminLayout>
  )
}
