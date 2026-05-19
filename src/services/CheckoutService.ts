/**
 * src/services/CheckoutService.ts
 *
 * Orquestra a criação de pedidos e o processamento de pagamento.
 *
 * Fluxo:
 * 1. Valida lote (ativo, preço atual do DB)
 * 2. Reserva vagas atomicamente via TicketLotService.reserve()
 * 3. Calcula totais com preços do DB (nunca confia no cliente)
 * 4. Cria order na DB
 * 5. Chama o adapter de pagamento (Pix ou Cartão)
 * 6. Atualiza order com dados do pagamento
 * 7. Em caso de falha: TicketLotService.release() como compensação
 */

import { TicketLotRepository } from '@/repositories/TicketLotRepository'
import { OrderBumpRepository } from '@/repositories/OrderBumpRepository'
import { OrderRepository } from '@/repositories/OrderRepository'
import { TicketLotService } from './TicketLotService'
import { getPaymentAdapter } from '@/lib/paymentAdapter'
import { onPixGenerated, onPaymentApproved } from './email-triggers'
import type { CreateOrderInput, CreateOrderResult } from '@/types/checkout'

export const CheckoutService = {
  async createOrder(input: CreateOrderInput): Promise<CreateOrderResult> {
    // -------------------------------------------------------------------------
    // 1. Validar lote (preço e status vêm do DB — não do cliente)
    // -------------------------------------------------------------------------
    const lot = await TicketLotRepository.findById(input.lotId)

    if (!lot || lot.status !== 'active') {
      return { success: false, error: 'Lote de ingressos indisponível.' }
    }

    // -------------------------------------------------------------------------
    // 2. Reservar vagas — atômico via RPC (FOR UPDATE lock)
    // -------------------------------------------------------------------------
    const reserved = await TicketLotService.reserve(input.lotId, input.quantity)

    if (!reserved) {
      return { success: false, error: 'Ingressos esgotados para este lote.' }
    }

    try {
      // -----------------------------------------------------------------------
      // 3. Calcular totais com preços do DB
      // -----------------------------------------------------------------------
      const bumpsInput = input.bumps ?? []
      const bumps = await OrderBumpRepository.findByIds(bumpsInput.map((b) => b.id))

      const subtotal = lot.price * input.quantity
      const bumpsTotal = bumps.reduce((acc, bump) => acc + bump.price, 0)
      const total = subtotal + bumpsTotal

      // -----------------------------------------------------------------------
      // 4. Criar order na DB
      // -----------------------------------------------------------------------
      const orderBumpsData =
        bumps.length > 0
          ? bumps.map((bump) => ({
              id: bump.id,
              name: bump.name,
              price: bump.price,
              size: bumpsInput.find((b) => b.id === bump.id)?.size ?? null,
            }))
          : null

      const order = await OrderRepository.create({
        buyer_name: input.buyer.name,
        buyer_email: input.buyer.email,
        buyer_whatsapp: input.buyer.whatsapp,
        buyer_cpf: input.buyer.cpf ?? null,
        ticket_lot_id: input.lotId,
        ticket_quantity: input.quantity,
        order_bumps: orderBumpsData,
        subtotal,
        total,
        payment_method: input.paymentMethod,
        payment_status: 'pending',
      })

      if (!order) {
        await TicketLotService.release(input.lotId, input.quantity)
        return { success: false, error: 'Erro ao registrar pedido. Tente novamente.' }
      }

      // -----------------------------------------------------------------------
      // 5. Processar pagamento
      // -----------------------------------------------------------------------
      const adapter = getPaymentAdapter()

      const customer = {
        name: input.buyer.name,
        email: input.buyer.email,
        cpf: input.buyer.cpf,
        phone: input.buyer.whatsapp,
      }

      const items = [
        { id: lot.id, name: lot.name, quantity: input.quantity, unitPrice: lot.price },
        ...bumps.map((b) => ({ id: b.id, name: b.name, quantity: 1, unitPrice: b.price })),
      ]

      // -----------------------------------------------------------------------
      // 5a. Pix
      // -----------------------------------------------------------------------
      if (input.paymentMethod === 'pix') {
        const pix = await adapter.createPixPayment({
          orderId: order.id,
          customer,
          items,
          totalAmount: total,
          expirationMinutes: 30,
        })

        await OrderRepository.updatePaymentData(order.id, {
          payment_id: pix.paymentId,
          pix_code: pix.pixCode,
          pix_qrcode_url: pix.pixQrcodeUrl,
          pix_expires_at: pix.expiresAt.toISOString(),
          payment_status: 'pending',
        })

        // T094 — Disparar e-mail de Pix gerado (não aguardar, não bloquear)
        onPixGenerated(order.id).catch((err) =>
          console.error('[CheckoutService] onPixGenerated failed:', err),
        )

        return { success: true, orderId: order.id, paymentMethod: 'pix' }
      }

      // -----------------------------------------------------------------------
      // 5b. Cartão
      // -----------------------------------------------------------------------
      if (!input.card) {
        await TicketLotService.release(input.lotId, input.quantity)
        await OrderRepository.updateStatus(order.id, 'failed')
        return { success: false, error: 'Dados do cartão não informados.' }
      }

      const cardResult = await adapter.createCardPayment({
        orderId: order.id,
        customer,
        items,
        totalAmount: total,
        card: input.card,
      })

      if (cardResult.status === 'paid') {
        await OrderRepository.updatePaymentData(order.id, {
          payment_id: cardResult.paymentId,
          payment_status: 'paid',
        })

        // T095 — Disparar e-mail de pagamento aprovado
        onPaymentApproved(order.id).catch((err) =>
          console.error('[CheckoutService] onPaymentApproved failed:', err),
        )

        return { success: true, orderId: order.id, paymentMethod: 'card' }
      }

      // Cartão recusado — liberar vaga e atualizar status
      await TicketLotService.release(input.lotId, input.quantity)
      await OrderRepository.updateStatus(order.id, 'failed')

      return {
        success: false,
        error: cardResult.errorMessage ?? 'Pagamento recusado pela operadora.',
        orderId: order.id,
        paymentMethod: 'card',
      } as CreateOrderResult

    } catch (err) {
      // Qualquer erro inesperado: compensar reserva
      console.error('[CheckoutService.createOrder]', err)
      await TicketLotService.release(input.lotId, input.quantity)
      return { success: false, error: 'Erro interno. Tente novamente em instantes.' }
    }
  },
}
