/**
 * src/repositories/SpeakerRepository.ts
 *
 * Acesso à tabela speakers.
 * Palestrantes do evento.
 */

import { createClient } from '@/lib/supabase/server'
import type { Database } from '@/types/database'

export type Speaker = Database['public']['Tables']['speakers_encontro']['Row']

export const SpeakerRepository = {
  async findAll(): Promise<Speaker[]> {
    const supabase = await createClient()

    const { data, error } = await supabase
      .from('speakers_encontro')
      .select('*')
      .order('display_order', { ascending: true })

    if (error) {
      console.error('[SpeakerRepository.findAll]', error.message)
      return []
    }

    return data ?? []
  },

  async findById(id: string): Promise<Speaker | null> {
    const supabase = await createClient()

    const { data, error } = await supabase
      .from('speakers_encontro')
      .select('*')
      .eq('id', id)
      .maybeSingle()

    if (error) {
      console.error('[SpeakerRepository.findById]', error.message)
      return null
    }

    return data
  },

  async create(
    values: Database['public']['Tables']['speakers_encontro']['Insert'],
  ): Promise<Speaker | null> {
    const supabase = await createClient()

    const { data, error } = await supabase
      .from('speakers_encontro')
      .insert(values)
      .select()
      .single()

    if (error) {
      console.error('[SpeakerRepository.create]', error.message)
      return null
    }

    return data
  },

  async update(
    id: string,
    values: Database['public']['Tables']['speakers_encontro']['Update'],
  ): Promise<Speaker | null> {
    const supabase = await createClient()

    const { data, error } = await supabase
      .from('speakers_encontro')
      .update({ ...values, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single()

    if (error) {
      console.error('[SpeakerRepository.update]', error.message)
      return null
    }

    return data
  },

  async delete(id: string): Promise<boolean> {
    const supabase = await createClient()

    const { error } = await supabase.from('speakers_encontro').delete().eq('id', id)

    if (error) {
      console.error('[SpeakerRepository.delete]', error.message)
      return false
    }

    return true
  },
}
