/**
 * src/services/email-triggers.ts
 *
 * Triggers de e-mail — chamados pelos pontos certos do fluxo.
 * Cada trigger simplesmente chama EmailService.send() sem saber de retry.
 *
 * T094: onPixGenerated    — após geração do QR Code
 * T095: onPaymentApproved — após confirmação do pagamento (Pix ou cartão)
 * T096: onPixExpired      — quando polling detecta expiração do Pix
 *
 * Falhas são logadas mas não propagadas — nunca bloquear o fluxo principal.
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
