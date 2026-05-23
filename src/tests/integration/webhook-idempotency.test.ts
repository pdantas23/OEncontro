/**
 * @deprecated DEAD CODE — teste de código não usado em produção.
 *
 * Apesar do nome, este teste exercita EmailService (não o webhook real).
 * EmailService faz parte da arquitetura ANTERIOR ao Mercado Pago Checkout Pro:
 * importado apenas por src/services/email-triggers.ts, que por sua vez é
 * importado apenas pelo CheckoutService.ts (dead). O fluxo de e-mail em
 * produção é independente: api/src/routes/webhook.ts → api/src/lib/resend.ts.
 *
 * Mantido temporariamente. Verificado em 2026-05-23 durante a Task 4 do projeto
 * de Order Bumps de Ingresso. Confirmado: o SUT é dead code transitivo.
 *
 * ⚠️ COBERTURA ENGANOSA: este teste continua passando no CI mas não valida
 * nenhum caminho de produção. Não usar como referência de cobertura real.
 *
 * TODO: deletar junto com o SUT em task de limpeza dedicada.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import type { Order } from '@/repositories/OrderRepository'

// ---------------------------------------------------------------------------
// Hoisted mocks
// ---------------------------------------------------------------------------

const {
  mockAlreadySent,
  mockLogAttempt,
  mockLogSuccess,
  mockLogFailed,
  mockSendEmail,
} = vi.hoisted(() => ({
  mockAlreadySent: vi.fn(),
  mockLogAttempt: vi.fn(),
  mockLogSuccess: vi.fn(),
  mockLogFailed: vi.fn(),
  mockSendEmail: vi.fn(),
}))

vi.mock('@/repositories/EmailLogRepository', () => ({
  EmailLogRepository: {
    alreadySent: mockAlreadySent,
    logAttempt: mockLogAttempt,
    logSuccess: mockLogSuccess,
    logFailed: mockLogFailed,
  },
}))

vi.mock('@/repositories/EventConfigRepository', () => ({
  EventConfigRepository: {
    find: vi.fn().mockResolvedValue({
      name: 'Evento Teste',
      date: '2025-10-01',
      location: 'São Paulo',
    }),
  },
}))

vi.mock('@react-email/components', () => ({
  render: vi.fn().mockResolvedValue('<html>Email</html>'),
}))

vi.mock('react', async (importOriginal) => {
  const actual = await importOriginal<typeof import('react')>()
  return { ...actual, createElement: vi.fn().mockReturnValue(null) }
})

vi.mock('qrcode', () => ({
  default: { toDataURL: vi.fn().mockResolvedValue('data:image/png;base64,fake') },
}))

vi.mock('resend', () => ({
  Resend: class {
    emails = { send: mockSendEmail }
  },
}))

vi.mock('@/config/env', () => ({
  env: {
    RESEND_API_KEY: 'test-key',
    RESEND_FROM_EMAIL: 'noreply@test.com',
    RESEND_FROM_NAME: 'Teste',
    NEXT_PUBLIC_APP_URL: 'http://localhost:3000',
  },
}))

vi.mock('@/lib/email/templates/payment-approved', () => ({ default: () => null }))
vi.mock('@/lib/email/templates/payment-pending', () => ({ default: () => null }))
vi.mock('@/lib/email/templates/payment-expired', () => ({ default: () => null }))

vi.mock('@/utils/format', () => ({
  formatDate: vi.fn().mockReturnValue('01/10/2025'),
  formatCurrency: vi.fn().mockReturnValue('R$ 100,00'),
}))

import { EmailService } from '@/services/EmailService'

// ---------------------------------------------------------------------------
// Fixtures
// ---------------------------------------------------------------------------

function makeOrder(id: string): Order {
  return {
    id,
    buyer_email: 'comprador@example.com',
    buyer_name: 'Comprador',
    buyer_whatsapp: '11999999999',
    buyer_cpf: null,
    ticket_lot_id: 'lot-uuid',
    ticket_quantity: 1,
    order_bumps: null,
    subtotal: 10000,
    total: 10000,
    payment_method: 'pix',
    payment_status: 'paid',
    payment_id: 'pix-001',
    pix_code: 'fake-pix-code',
    pix_qrcode_url: null,
    pix_expires_at: null,
    has_inventory_issue: false,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  }
}

beforeEach(() => {
  vi.clearAllMocks()
  mockSendEmail.mockResolvedValue({ id: 'resend-id' })
  mockLogSuccess.mockResolvedValue(undefined)
  mockLogAttempt.mockResolvedValue(undefined)
  mockLogFailed.mockResolvedValue(undefined)
})

// ---------------------------------------------------------------------------
// Idempotência — mesmo order_id processado duas vezes
// ---------------------------------------------------------------------------

describe('Webhook idempotência', () => {
  it('não reenvia e-mail se alreadySent retorna true na 2ª chamada', async () => {
    const order = makeOrder('order-idempotent-001')

    mockAlreadySent.mockResolvedValueOnce(false)
    const first = await EmailService.send('payment_approved', order)

    mockAlreadySent.mockResolvedValueOnce(true)
    const second = await EmailService.send('payment_approved', order)

    expect(first.error).toBeNull()
    expect(second.error).toBeNull()
    expect(mockSendEmail).toHaveBeenCalledTimes(1)
    expect(mockLogSuccess).toHaveBeenCalledTimes(1)
  })

  it('processa N chamadas paralelas — apenas 1 resulta em envio', async () => {
    const order = makeOrder('order-parallel-001')

    mockAlreadySent
      .mockResolvedValueOnce(false)
      .mockResolvedValueOnce(true)
      .mockResolvedValueOnce(true)

    const results = await Promise.all([
      EmailService.send('payment_approved', order),
      EmailService.send('payment_approved', order),
      EmailService.send('payment_approved', order),
    ])

    results.forEach((r) => expect(r.error).toBeNull())
    expect(mockSendEmail).toHaveBeenCalledTimes(1)
  })

  it('e-mail de Pix não é reenviado se order_id e template já existem', async () => {
    const pixOrder = makeOrder('order-pix-idempotent')

    mockAlreadySent.mockResolvedValueOnce(false)
    await EmailService.send('payment_pending', pixOrder)

    mockAlreadySent.mockResolvedValueOnce(true)
    await EmailService.send('payment_pending', pixOrder)

    expect(mockSendEmail).toHaveBeenCalledTimes(1)
  })

  it('cada template é independente — payment_approved não bloqueia payment_pending', async () => {
    const order = makeOrder('order-multi-template')

    mockAlreadySent.mockResolvedValue(false)

    await EmailService.send('payment_pending', order)
    await EmailService.send('payment_approved', order)

    expect(mockSendEmail).toHaveBeenCalledTimes(2)
    expect(mockAlreadySent).toHaveBeenNthCalledWith(1, order.id, 'payment_pending')
    expect(mockAlreadySent).toHaveBeenNthCalledWith(2, order.id, 'payment_approved')
  })
})

// ---------------------------------------------------------------------------
// Status inválido ignorado sem erro
// ---------------------------------------------------------------------------

describe('Webhook — status inválido', () => {
  it('não lança exceção para order com id inexistente', async () => {
    mockAlreadySent.mockResolvedValue(false)
    mockSendEmail.mockResolvedValue({ id: 'resend-id' })

    const order = makeOrder('order-inexistente-999')

    await expect(EmailService.send('payment_approved', order)).resolves.not.toThrow()
  })

  it('falha de Resend retorna erro estruturado, não exceção', async () => {
    mockAlreadySent.mockResolvedValue(false)
    mockSendEmail.mockRejectedValue(new Error('Resend API down'))

    const order = makeOrder('order-resend-down')

    const result = await EmailService.send('payment_approved', order)

    expect(result.error).not.toBeNull()
    expect(result.error?.code).toBe('EMAIL_FAILED')
  })
})
