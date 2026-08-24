'use client'

/**
 * src/app/admin/pesquisa/page.tsx
 *
 * Resultados da pesquisa de satisfação (rota pública /pesquisa).
 * Leitura protegida por RLS: só perfis do painel enxergam as respostas.
 */

import { useEffect, useState } from 'react'
import { SPEAKER_NAME } from '@/config/survey'
import { useAdminAuth } from '@/hooks/useAdminAuth'
import { createClient } from '@/lib/supabase/client'
import { AdminLayout } from '@/components/layout/AdminLayout'
import { EmptyState } from '@/components/shared/EmptyState'
import { SurveyKpis } from '@/components/admin/pesquisa/SurveyKpis'
import { AspectAverages } from '@/components/admin/pesquisa/AspectAverages'
import { ChoiceBreakdown } from '@/components/admin/pesquisa/ChoiceBreakdown'
import { OpenAnswers } from '@/components/admin/pesquisa/OpenAnswers'
import { computeSurveyStats } from '@/services/SurveyStatsService'
import type { SurveyResponseRow, SurveyStats } from '@/services/SurveyStatsService'

export default function AdminPesquisaPage() {
  const { user, loading: authLoading } = useAdminAuth()
  const [stats, setStats] = useState<SurveyStats | null>(null)
  const [dataLoading, setDataLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!user) return

    async function load() {
      const supabase = createClient()
      const { data, error: queryError } = await supabase
        .from('survey_responses_encontro')
        .select('*')
        .order('created_at', { ascending: false })

      if (queryError) {
        console.error('[admin/pesquisa]', queryError.message)
        setError('Não foi possível carregar as respostas.')
        setDataLoading(false)
        return
      }

      setStats(computeSurveyStats((data ?? []) as SurveyResponseRow[]))
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
      <div className="space-y-8 p-6 lg:p-8">
        <div>
          <h1 className="font-display text-2xl font-bold text-foreground">Pesquisa</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Respostas do formulário de satisfação enviado aos participantes.
          </p>
        </div>

        {error && (
          <p
            role="alert"
            className="rounded border border-destructive/40 bg-destructive/10 p-3 text-sm text-destructive"
          >
            {error}
          </p>
        )}

        {!error && stats && stats.total === 0 && (
          <EmptyState
            title="Nenhuma resposta ainda"
            description="Assim que os participantes responderem, as médias e os comentários aparecem aqui."
          />
        )}

        {!error && stats && stats.total > 0 && (
          <>
            <SurveyKpis stats={stats} />

            <div className="grid gap-4 xl:grid-cols-2">
              <AspectAverages title="Como foi o evento — média por item" items={stats.eventAverages} />
              <AspectAverages
                title={`A palestra de ${SPEAKER_NAME} — média por item`}
                items={stats.speakerAverages}
              />
            </div>

            <div className="grid gap-4 xl:grid-cols-2">
              <ChoiceBreakdown
                title="O conteúdo serve para o trabalho de quem respondeu?"
                items={stats.relevance}
              />
              <ChoiceBreakdown
                title={`Gostariam de ver ${SPEAKER_NAME} de novo?`}
                items={stats.speakerReturn}
              />
            </div>

            <ChoiceBreakdown title="O ponto alto desta edição" items={stats.highlight} />

            <OpenAnswers groups={stats.openAnswers} />
          </>
        )}
      </div>
    </AdminLayout>
  )
}
