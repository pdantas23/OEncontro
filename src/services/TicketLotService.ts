/**
 * @deprecated DEAD CODE — não usado em produção.
 *
 * Este arquivo faz parte da arquitetura ANTERIOR ao Mercado Pago Checkout Pro.
 * O fluxo atual de produção é: src/app/checkout/actions.ts → API Hono /create-order.
 *
 * Mantido temporariamente. Verificado em 2026-05-23 durante a Task 4 do projeto
 * de Order Bumps de Ingresso. Confirmado: zero imports em produção.
 *
 * TODO: deletar em task de limpeza dedicada (validar fanout completo antes).
 */

import { createClient } from '@/lib/supabase/server'

export const TicketLotService = {
  /**
   * Reserva `quantity` vagas do lote de forma atômica.
   * Retorna false se o lote estiver esgotado ou inativo.
   * O sold_count é incrementado imediatamente — compensação via release() se o pagamento falhar.
   */
  async reserve(lotId: string, quantity = 1): Promise<boolean> {
    const supabase = await createClient()

    const { data, error } = await supabase.rpc('reserve_ticket_slot', {
      p_lot_id: lotId,
      p_quantity: quantity,
    })

    if (error) {
      console.error('[TicketLotService.reserve]', error.message)
      return false
    }

    return data === true
  },

  /**
   * Libera `quantity` vagas previamente reservadas (compensação).
   * Chamado quando o pagamento falha, expira ou é cancelado.
   * Usa GREATEST(sold_count - quantity, 0) para evitar negativo.
   */
  async release(lotId: string, quantity = 1): Promise<void> {
    const supabase = await createClient()

    const { error } = await supabase.rpc('release_ticket_slot', {
      p_lot_id: lotId,
      p_quantity: quantity,
    })

    if (error) {
      console.error('[TicketLotService.release]', error.message)
    }
  },
}
