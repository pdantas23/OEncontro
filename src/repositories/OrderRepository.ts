/**
 * src/repositories/OrderRepository.ts
 *
 * Acesso à tabela orders.
 * Pedidos de compra de ingressos.
 */

import { createClient } from '@/lib/supabase/server'
import type { Database } from '@/types/database'

export type Order = Database['public']['Tables']['orders_encontro']['Row']

export interface PaymentUpdateData {
  payment_id?: string | null
  payment_status?: string
  pix_code?: string | null
  pix_qrcode_url?: string | null
  pix_expires_at?: string | null
}

export const OrderRepository = {
  async create(
    values: Database['public']['Tables']['orders_encontro']['Insert'],
  ): Promise<Order | null> {
    const supabase = await createClient()

    const { data, error } = await supabase
      .from('orders_encontro')
      .insert(values)
      .select()
      .single()

    if (error) {
      console.error('[OrderRepository.create]', error.message)
      return null
    }

    return data
  },

  async findById(id: string): Promise<Order | null> {
    const supabase = await createClient()

    const { data, error } = await supabase
      .from('orders_encontro')
      .select('*')
      .eq('id', id)
      .maybeSingle()

    if (error) {
      console.error('[OrderRepository.findById]', error.message)
      return null
    }

    return data
  },

  async findByEmail(email: string): Promise<Order[]> {
    const supabase = await createClient()

    const { data, error } = await supabase
      .from('orders_encontro')
      .select('*')
      .eq('buyer_email', email)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('[OrderRepository.findByEmail]', error.message)
      return []
    }

    return data ?? []
  },

  async findAll(): Promise<Order[]> {
    const supabase = await createClient()

    const { data, error } = await supabase
      .from('orders_encontro')
      .select('*')
      .order('created_at', { ascending: false })

    if (error) {
      console.error('[OrderRepository.findAll]', error.message)
      return []
    }

    return data ?? []
  },

  async updatePaymentData(id: string, paymentData: PaymentUpdateData): Promise<Order | null> {
    const supabase = await createClient()

    const { data, error } = await supabase
      .from('orders_encontro')
      .update({ ...paymentData, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single()

    if (error) {
      console.error('[OrderRepository.updatePaymentData]', error.message)
      return null
    }

    return data
  },

  async updateStatus(id: string, status: string): Promise<boolean> {
    const supabase = await createClient()

    const { error } = await supabase
      .from('orders_encontro')
      .update({ payment_status: status, updated_at: new Date().toISOString() })
      .eq('id', id)

    if (error) {
      console.error('[OrderRepository.updateStatus]', error.message)
      return false
    }

    return true
  },

  /** Busca pedidos Pix com status pending e expirados — para compensação */
  async findExpiredPix(): Promise<Order[]> {
    const supabase = await createClient()

    const { data, error } = await supabase
      .from('orders_encontro')
      .select('*')
      .eq('payment_method', 'pix')
      .eq('payment_status', 'pending')
      .lt('pix_expires_at', new Date().toISOString())

    if (error) {
      console.error('[OrderRepository.findExpiredPix]', error.message)
      return []
    }

    return data ?? []
  },
}
