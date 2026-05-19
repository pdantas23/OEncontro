'use client'

import { useEffect, useState } from 'react'
import { useAdminAuth } from '@/hooks/useAdminAuth'
import { createClient } from '@/lib/supabase/client'
import { AdminLayout } from '@/components/layout/AdminLayout'
import { ScheduleList } from '@/components/admin/programacao/ScheduleList'
import type { ScheduleItemWithSpeaker } from '@/repositories/ScheduleRepository'
import type { Speaker } from '@/repositories/SpeakerRepository'

export default function ProgramacaoPage() {
  const { user, loading: authLoading } = useAdminAuth()
  const [schedule, setSchedule] = useState<ScheduleItemWithSpeaker[]>([])
  const [speakers, setSpeakers] = useState<Speaker[]>([])
  const [dataLoading, setDataLoading] = useState(true)

  useEffect(() => {
    if (!user) return
    async function load() {
      const supabase = createClient()
      const [scheduleResult, speakersResult] = await Promise.all([
        supabase.from('schedule_encontro').select('*, speaker:speakers_encontro(*)').order('display_order', { ascending: true }),
        supabase.from('speakers_encontro').select('*').order('display_order', { ascending: true }),
      ])
      setSchedule((scheduleResult.data ?? []) as unknown as ScheduleItemWithSpeaker[])
      setSpeakers(speakersResult.data ?? [])
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
        <ScheduleList items={schedule} speakers={speakers} />
      </div>
    </AdminLayout>
  )
}
