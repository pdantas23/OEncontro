/**
 * src/adapters/MockPaymentAdapter.ts
 *
 * Implementação mock para desenvolvimento e testes.
 * Simula respostas realistas da API de pagamento.
 *
 * Comportamento:
 * - Pix: sempre retorna QR Code fake + expira em 30 minutos
 * - Cartão: aprova se o número termina em par, recusa se ímpar
 * - Status: mock de polling (pending → paid após 10s)
 *
 * Task Final TF08: substituir por PaymentAdapter real.
 * Ao trocar, apenas a injeção em PaymentService muda — nada mais.
 */

import type {
  IPaymentAdapter,
  CreatePixPaymentInput,
  CreateCardPaymentInput,
  PixPaymentResult,
  CardPaymentResult,
  PaymentStatusResult,
  RefundResult,
} from './PaymentAdapter'

// Simula delay de rede
function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

// Armazena status em memória para o mock de polling
const paymentStatuses = new Map<string, 'pending' | 'paid' | 'failed'>()
const paymentTimestamps = new Map<string, number>()

export class MockPaymentAdapter implements IPaymentAdapter {
  async createPixPayment(input: CreatePixPaymentInput): Promise<PixPaymentResult> {
    await delay(800) // simula latência

    const paymentId = `mock_pix_${Date.now()}_${input.orderId.slice(0, 8)}`
    const expiresAt = new Date(Date.now() + 30 * 60 * 1000) // 30 minutos

    // Registra como pending, muda para paid após 15s (simula confirmação)
    paymentStatuses.set(paymentId, 'pending')
    paymentTimestamps.set(paymentId, Date.now())

    return {
      paymentId,
      // QR Code placeholder — TF08: substituir por QR Code real
      pixCode:
        '00020101021226580014br.gov.bcb.pix0136mock-pix-key-placeholder520400005303986540' +
        `${(input.totalAmount / 100).toFixed(2)}5802BR5925EVENTO MOCK6009SAO PAULO62070503***6304ABCD`,
      pixQrcodeUrl: `https://via.placeholder.com/300x300.png?text=QR+Code+Mock`,
      expiresAt,
      status: 'pending',
    }
  }

  async createCardPayment(input: CreateCardPaymentInput): Promise<CardPaymentResult> {
    await delay(1200) // simula processamento

    const paymentId = `mock_card_${Date.now()}_${input.orderId.slice(0, 8)}`
    const lastDigit = parseInt(input.card.number.slice(-1), 10)
    const isApproved = lastDigit % 2 === 0

    paymentStatuses.set(paymentId, isApproved ? 'paid' : 'failed')

    return {
      paymentId,
      status: isApproved ? 'paid' : 'failed',
      authorizationCode: isApproved ? `AUTH_${Date.now()}` : undefined,
      errorMessage: isApproved ? undefined : 'Cartão recusado pela operadora',
    }
  }

  async getPaymentStatus(paymentId: string): Promise<PaymentStatusResult> {
    await delay(300)

    const storedStatus = paymentStatuses.get(paymentId)

    if (!storedStatus) {
      return { paymentId, status: 'pending' }
    }

    // Simula confirmação automática do Pix após 15 segundos
    if (storedStatus === 'pending') {
      const createdAt = paymentTimestamps.get(paymentId) ?? Date.now()
      const elapsed = Date.now() - createdAt

      if (elapsed > 15_000) {
        paymentStatuses.set(paymentId, 'paid')
        return {
          paymentId,
          status: 'paid',
          paidAt: new Date(),
        }
      }
    }

    return {
      paymentId,
      status: storedStatus === 'paid' ? 'paid' : storedStatus === 'failed' ? 'failed' : 'pending',
      paidAt: storedStatus === 'paid' ? new Date() : undefined,
    }
  }

  async refundPayment(paymentId: string): Promise<RefundResult> {
    await delay(500)

    paymentStatuses.set(paymentId, 'failed')

    return {
      refundId: `mock_refund_${Date.now()}`,
      status: 'success',
    }
  }

  verifyWebhookSignature(payload: string, _signature: string): unknown {
    // Mock: aceita qualquer payload sem verificação de assinatura
    // TF08: substituir por verificação real (ex: stripe.webhooks.constructEvent)
    try {
      return JSON.parse(payload)
    } catch {
      throw new Error('[MockPaymentAdapter] Payload do webhook não é um JSON válido')
    }
  }
}
