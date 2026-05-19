'use client'

import { useEffect, useState } from 'react'
import { useAdminAuth } from '@/hooks/useAdminAuth'
import { createClient } from '@/lib/supabase/client'
import { AdminLayout } from '@/components/layout/AdminLayout'
import { SpeakerList } from '@/components/admin/palestrantes/SpeakerList'
import type { Speaker } from '@/repositories/SpeakerRepository'

export default function PalestrantesPage() {
  const { user, loading: authLoading } = useAdminAuth()
  const [speakers, setSpeakers] = useState<Speaker[]>([])
  const [dataLoading, setDataLoading] = useState(true)

  useEffect(() => {
    if (!user) return
    async function load() {
      const supabase = createClient()
      const { data } = await supabase
        .from('speakers_encontro')
        .select('*')
        .order('display_order', { ascending: true })
      setSpeakers(data ?? [])
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
        <SpeakerList speakers={speakers} />
      </div>
    </AdminLayout>
  )
}
