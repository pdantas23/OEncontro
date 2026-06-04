/**
 * src/repositories/ScheduleRepository.ts
 *
 * Acesso à tabela schedule.
 * Programação do evento com dados do palestrante via join.
 */

import { createClient } from '@/lib/supabase/server'
import type { Database } from '@/types/database'
import type { Speaker } from './SpeakerRepository'

export type ScheduleItem = Database['public']['Tables']['schedule_encontro']['Row']

/** Schedule item com dados do palestrante já resolvidos */
export type ScheduleItemWithSpeaker = ScheduleItem & {
  speaker: Speaker | null
}

export const ScheduleRepository = {
  async findAll(): Promise<ScheduleItemWithSpeaker[]> {
    const supabase = await createClient()

    const { data, error } = await supabase
      .from('schedule_encontro')
      .select('*, speaker:speakers_encontro(*)')
      .order('day', { ascending: true })
      .order('start_time', { ascending: true })
      .order('display_order', { ascending: true })

    if (error) {
      console.error('[ScheduleRepository.findAll]', error.message)
      return []
    }

    return (data ?? []) as ScheduleItemWithSpeaker[]
  },

  async findByDay(day: number): Promise<ScheduleItemWithSpeaker[]> {
    const supabase = await createClient()

    const { data, error } = await supabase
      .from('schedule_encontro')
      .select('*, speaker:speakers_encontro(*)')
      .eq('day', day)
      .order('start_time', { ascending: true })
      .order('display_order', { ascending: true })

    if (error) {
      console.error('[ScheduleRepository.findByDay]', error.message)
      return []
    }

    return (data ?? []) as ScheduleItemWithSpeaker[]
  },

  async create(
    values: Database['public']['Tables']['schedule_encontro']['Insert'],
  ): Promise<ScheduleItem | null> {
    const supabase = await createClient()

    const { data, error } = await supabase
      .from('schedule_encontro')
      .insert(values)
      .select()
      .single()

    if (error) {
      console.error('[ScheduleRepository.create]', error.message)
      return null
    }

    return data
  },

  async update(
    id: string,
    values: Database['public']['Tables']['schedule_encontro']['Update'],
  ): Promise<ScheduleItem | null> {
    const supabase = await createClient()

    const { data, error } = await supabase
      .from('schedule_encontro')
      .update({ ...values, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single()

    if (error) {
      console.error('[ScheduleRepository.update]', error.message)
      return null
    }

    return data
  },

  async delete(id: string): Promise<boolean> {
    const supabase = await createClient()

    const { error } = await supabase.from('schedule_encontro').delete().eq('id', id)

    if (error) {
      console.error('[ScheduleRepository.delete]', error.message)
      return false
    }

    return true
  },

  /** Reordena items em batch (para drag and drop do admin) */
  async updateOrder(items: Array<{ id: string; display_order: number }>): Promise<boolean> {
    const supabase = await createClient()

    const updates = items.map(({ id, display_order }) =>
      supabase.from('schedule_encontro').update({ display_order }).eq('id', id),
    )

    const results = await Promise.all(updates)
    return results.every(({ error }) => !error)
  },
}
