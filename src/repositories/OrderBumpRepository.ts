/**
 * src/repositories/OrderBumpRepository.ts
 *
 * Acesso à tabela order_bumps.
 * Produtos adicionais oferecidos no checkout.
 */

import { createClient } from '@/lib/supabase/server'
import type { Database } from '@/types/database'

export type OrderBump = Database['public']['Tables']['order_bumps_encontro']['Row']

export const OrderBumpRepository = {
  async findActive(): Promise<OrderBump[]> {
    const supabase = await createClient()

    const { data, error } = await supabase
      .from('order_bumps_encontro')
      .select('*')
      .eq('active', true)
      .order('display_order', { ascending: true })

    if (error) {
      console.error('[OrderBumpRepository.findActive]', error.message)
      return []
    }

    return data ?? []
  },

  async findAll(): Promise<OrderBump[]> {
    const supabase = await createClient()

    const { data, error } = await supabase
      .from('order_bumps_encontro')
      .select('*')
      .order('display_order', { ascending: true })

    if (error) {
      console.error('[OrderBumpRepository.findAll]', error.message)
      return []
    }

    return data ?? []
  },

  async findById(id: string): Promise<OrderBump | null> {
    const supabase = await createClient()

    const { data, error } = await supabase
      .from('order_bumps_encontro')
      .select('*')
      .eq('id', id)
      .maybeSingle()

    if (error) {
      console.error('[OrderBumpRepository.findById]', error.message)
      return null
    }

    return data
  },

  /** Busca múltiplos bumps por IDs — para verificação de preços no servidor */
  async findByIds(ids: string[]): Promise<OrderBump[]> {
    if (ids.length === 0) return []

    const supabase = await createClient()

    const { data, error } = await supabase
      .from('order_bumps_encontro')
      .select('*')
      .in('id', ids)
      .eq('active', true)

    if (error) {
      console.error('[OrderBumpRepository.findByIds]', error.message)
      return []
    }

    return data ?? []
  },

  async create(
    values: Database['public']['Tables']['order_bumps_encontro']['Insert'],
  ): Promise<OrderBump | null> {
    const supabase = await createClient()

    const { data, error } = await supabase
      .from('order_bumps_encontro')
      .insert(values)
      .select()
      .single()

    if (error) {
      console.error('[OrderBumpRepository.create]', error.message)
      return null
    }

    return data
  },

  async update(
    id: string,
    values: Database['public']['Tables']['order_bumps_encontro']['Update'],
  ): Promise<OrderBump | null> {
    const supabase = await createClient()

    const { data, error } = await supabase
      .from('order_bumps_encontro')
      .update({ ...values, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single()

    if (error) {
      console.error('[OrderBumpRepository.update]', error.message)
      return null
    }

    return data
  },

  async delete(id: string): Promise<boolean> {
    const supabase = await createClient()

    const { error } = await supabase.from('order_bumps_encontro').delete().eq('id', id)

    if (error) {
      console.error('[OrderBumpRepository.delete]', error.message)
      return false
    }

    return true
  },
}
