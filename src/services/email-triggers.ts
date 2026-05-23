/**
 * @deprecated DEAD CODE — não usado em produção.
 *
 * Este arquivo faz parte da arquitetura ANTERIOR ao Mercado Pago Checkout Pro.
 * Importado apenas pelo CheckoutService.ts (dead). O fluxo de e-mail em
 * produção é independente: api/src/routes/webhook.ts → api/src/lib/resend.ts.
 *
 * Mantido temporariamente. Verificado em 2026-05-23 durante a Task 4 do projeto
 * de Order Bumps de Ingresso. Confirmado: dead code transitivo.
 *
 * TODO: deletar em task de limpeza dedicada (validar fanout completo antes).
 */

import { EmailService } from './EmailService'
import { OrderRepository } from '@/repositories/OrderRepository'

/**
 * T094 — Pix gerado.
 * Chamado em CheckoutService após salvar pix_code/pix_qrcode_url no pedido.
 */
export async function onPixGenerated(orderId: string): Promise<void> {
  const order = await OrderRepository.findById(orderId)
  if (!order) return

  const result = await EmailService.send('payment_pending', order)
  if (result.error) {
    console.error('[trigger:onPixGenerated]', result.error.message)
  }
}

/**
 * T095 — Pagamento confirmado (Pix pago ou cartão aprovado).
 * Chamado quando payment_status muda para 'paid'.
 */
export async function onPaymentApproved(orderId: string): Promise<void> {
  const order = await OrderRepository.findById(orderId)
  if (!order) return

  const result = await EmailService.send('payment_approved', order)
  if (result.error) {
    console.error('[trigger:onPaymentApproved]', result.error.message)
  }
}

/**
 * T096 — Pix expirado.
 * Chamado pela API route /api/checkout/payment-status quando detecta expiração.
 */
export async function onPixExpired(orderId: string): Promise<void> {
  const order = await OrderRepository.findById(orderId)
  if (!order) return

  const result = await EmailService.send('payment_expired', order)
  if (result.error) {
    console.error('[trigger:onPixExpired]', result.error.message)
  }
}
