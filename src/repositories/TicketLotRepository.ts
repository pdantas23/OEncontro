/**
 * src/repositories/TicketLotRepository.ts
 *
 * Acesso à tabela ticket_lots.
 * Lotes de ingresso com preço, limite e estoque.
 */

import { createClient } from '@/lib/supabase/server'
import type { Database } from '@/types/database'

export type TicketLot = Database['public']['Tables']['ticket_lots_encontro']['Row']

export const TicketLotRepository = {
  /** Retorna todos os lotes ativos, ordenados por display_order */
  async findActive(): Promise<TicketLot[]> {
    const supabase = await createClient()

    const { data, error } = await supabase
      .from('ticket_lots_encontro')
      .select('*')
      .eq('status', 'active')
      .order('display_order', { ascending: true })

    if (error) {
      console.error('[TicketLotRepository.findActive]', error.message)
      return []
    }

    return data ?? []
  },

  /** Retorna todos os lotes (admin) */
  async findAll(): Promise<TicketLot[]> {
    const supabase = await createClient()

    const { data, error } = await supabase
      .from('ticket_lots_encontro')
      .select('*')
      .order('display_order', { ascending: true })

    if (error) {
      console.error('[TicketLotRepository.findAll]', error.message)
      return []
    }

    return data ?? []
  },

  async findById(id: string): Promise<TicketLot | null> {
    const supabase = await createClient()

    const { data, error } = await supabase
      .from('ticket_lots_encontro')
      .select('*')
      .eq('id', id)
      .maybeSingle()

    if (error) {
      console.error('[TicketLotRepository.findById]', error.message)
      return null
    }

    return data
  },

  async create(
    values: Database['public']['Tables']['ticket_lots_encontro']['Insert'],
  ): Promise<TicketLot | null> {
    const supabase = await createClient()

    const { data, error } = await supabase
      .from('ticket_lots_encontro')
      .insert(values)
      .select()
      .single()

    if (error) {
      console.error('[TicketLotRepository.create]', error.message)
      return null
    }

    return data
  },

  async update(
    id: string,
    values: Database['public']['Tables']['ticket_lots_encontro']['Update'],
  ): Promise<TicketLot | null> {
    const supabase = await createClient()

    const { data, error } = await supabase
      .from('ticket_lots_encontro')
      .update({ ...values, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single()

    if (error) {
      console.error('[TicketLotRepository.update]', error.message)
      return null
    }

    return data
  },

  /**
   * Incrementa sold_count atomicamente.
   * Proteção contra race condition — verifica disponibilidade antes de incrementar.
   * Retorna false se o lote estiver esgotado.
   */
  async delete(id: string): Promise<boolean> {
    const supabase = await createClient()

    const { error } = await supabase.from('ticket_lots_encontro').delete().eq('id', id)

    if (error) {
      console.error('[TicketLotRepository.delete]', error.message)
      return false
    }

    return true
  },

  async incrementSoldCount(id: string, quantity: number): Promise<boolean> {
    const supabase = await createClient()

    // RPC para incremento atômico com validação (T059 — implementação completa)
    const { data, error } = await supabase.rpc('increment_ticket_sold_count', {
      lot_id: id,
      qty: quantity,
    })

    if (error) {
      console.error('[TicketLotRepository.incrementSoldCount]', error.message)
      return false
    }

    return data === true
  },
}
