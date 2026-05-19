'use client'

import { useEffect, useState } from 'react'
import { useAdminAuth } from '@/hooks/useAdminAuth'
import { createClient } from '@/lib/supabase/client'
import { AdminLayout } from '@/components/layout/AdminLayout'
import { ConfigForm } from '@/components/admin/configuracoes/ConfigForm'
import type { Database } from '@/types/database'

type EventConfig = Database['public']['Tables']['event_config_encontro']['Row']

export default function ConfiguracoesPage() {
  const { user, loading: authLoading } = useAdminAuth()
  const [config, setConfig] = useState<EventConfig | null>(null)
  const [dataLoading, setDataLoading] = useState(true)

  useEffect(() => {
    if (!user) return
    async function load() {
      const supabase = createClient()
      const { data } = await supabase
        .from('event_config_encontro')
        .select('*')
        .maybeSingle()
      setConfig(data ?? null)
      setDataLoading(false)
    }
    load()
  }, [user])

  if (authLoading || dataLoading) {
    return <AdminLayout><div className="p-8 text-sm text-muted-foreground">Carregando…</div></AdminLayout>
  }

  if (!config) {
    return (
      <AdminLayout>
        <div className="p-8 text-center text-sm text-muted-foreground">
          Nenhuma configuração encontrada. Execute a migration inicial.
        </div>
      </AdminLayout>
    )
  }

  return (
    <AdminLayout>
      <div className="p-6 lg:p-8 max-w-3xl">
        <div className="mb-6">
          <h1 className="font-display text-2xl font-bold text-foreground">Configurações</h1>
          <p className="mt-1 text-sm text-muted-foreground">Informações do evento e configurações gerais.</p>
        </div>
        <ConfigForm config={config} />
      </div>
    </AdminLayout>
  )
}
