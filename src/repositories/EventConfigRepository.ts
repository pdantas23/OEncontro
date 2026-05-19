/**
 * src/repositories/EventConfigRepository.ts
 *
 * Acesso à tabela event_config (single-row).
 * Dados públicos do evento: nome, data, local, status de vendas.
 */

import { createClient } from '@/lib/supabase/server'
import type { Database } from '@/types/database'

export type EventConfig = Database['public']['Tables']['event_config_encontro']['Row']

export const EventConfigRepository = {
  async find(): Promise<EventConfig | null> {
  // 1. Sem env vars, nem tenta conectar
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL) return null

  const supabase = await createClient()
  const { data, error } = await supabase
    .from('event_config_encontro')
    .select('*')
    .limit(1)
    .maybeSingle()

  if (error) {
    // 2. Só loga em dev, silencioso em produção
    if (process.env.NODE_ENV === 'development') {
      console.warn('[EventConfigRepository.find] Supabase indisponível:', error.message)
    }
    return null
  }

  return data
},

  async update(
    id: string,
    values: Database['public']['Tables']['event_config_encontro']['Update'],
  ): Promise<EventConfig | null> {
    const supabase = await createClient()

    const { data, error } = await supabase
      .from('event_config_encontro')
      .update({ ...values, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single()

    if (error) {
      console.error('[EventConfigRepository.update]', error.message)
      return null
    }

    return data
  },
}
