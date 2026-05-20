/**
 * api/src/lib/cleanup.ts
 *
 * Expira pedidos pendentes com mais de 30 minutos.
 * Roda a cada 15 minutos via setInterval no boot da API.
 *
 * Pedidos expirados: payment_status 'pending' → 'expired'.
 * sold_count NÃO é afetado (nunca foi incrementado para pending).
 */

import { getSupabase } from './supabase.js'

const EXPIRATION_MINUTES = 30
const CLEANUP_INTERVAL_MS = 15 * 60 * 1000 // 15 minutos

async function expirePendingOrders(): Promise<void> {
  try {
    const supabase = getSupabase()
    const cutoff = new Date(Date.now() - EXPIRATION_MINUTES * 60 * 1000).toISOString()

    const { data, error } = await supabase
      .from('orders_encontro')
      .update({
        payment_status: 'expired',
        updated_at: new Date().toISOString(),
      })
      .eq('payment_status', 'pending')
      .lt('created_at', cutoff)
      .select('id')

    if (error) {
      console.error('[cleanup] Erro ao expirar pedidos:', error.message)
      return
    }

    if (data && data.length > 0) {
      console.log(`[cleanup] ${data.length} pedido(s) expirado(s)`)
    }
  } catch (err) {
    console.error('[cleanup] Erro inesperado:', err)
  }
}

export function startCleanupScheduler(): void {
  // Roda imediatamente no boot (após 10s para dar tempo do Supabase conectar)
  setTimeout(() => {
    expirePendingOrders()
  }, 10_000)

  // Depois a cada 15 minutos
  setInterval(() => {
    expirePendingOrders()
  }, CLEANUP_INTERVAL_MS)

  console.log(`[cleanup] Scheduler iniciado — expira pedidos pending > ${EXPIRATION_MINUTES}min a cada ${CLEANUP_INTERVAL_MS / 60_000}min`)
}
