/**
 * T121 — EmailService unit tests
 *
 * Testa retry até 3 tentativas, backoff, idempotência e logging correto.
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

const makeOrder = (overrides: Partial<Order> = {}): Order => ({
  id: 'order-abc-123',
  buyer_email: 'comprador@example.com',
  buyer_name: 'Comprador Teste',
  buyer_whatsapp: '11999999999',
  buyer_cpf: null,
  ticket_lot_id: 'lot-uuid',
  ticket_quantity: 1,
  order_bumps: null,
  subtotal: 10000,
  total: 10000,
  payment_method: 'pix',
  payment_status: 'pending',
  payment_id: null,
  pix_code: '00020101pix-code-fake',
  pix_qrcode_url: null,
  pix_expires_at: null,
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
  ...overrides,
})

beforeEach(() => {
  vi.clearAllMocks()
  mockAlreadySent.mockResolvedValue(false)
  mockLogAttempt.mockResolvedValue(undefined)
  mockLogSuccess.mockResolvedValue(undefined)
  mockLogFailed.mockResolvedValue(undefined)
})

// ---------------------------------------------------------------------------
// Idempotência
// ---------------------------------------------------------------------------

describe('EmailService.send — idempotência', () => {
  it('não envia se alreadySent retornar true', async () => {
    mockAlreadySent.mockResolvedValue(true)

    const result = await EmailService.send('payment_pending', makeOrder())

    expect(result.error).toBeNull()
    expect(mockSendEmail).not.toHaveBeenCalled()
    expect(mockLogSuccess).not.toHaveBeenCalled()
  })

  it('não chama logAttempt quando já enviado', async () => {
    mockAlreadySent.mockResolvedValue(true)

    await EmailService.send('payment_approved', makeOrder())

    expect(mockLogAttempt).not.toHaveBeenCalled()
  })
})

// ---------------------------------------------------------------------------
// Sucesso na 1ª tentativa
// ---------------------------------------------------------------------------

describe('EmailService.send — sucesso', () => {
  it('retorna { error: null } após envio bem-sucedido', async () => {
    mockSendEmail.mockResolvedValue({ id: 'resend-id' })

    const result = await EmailService.send('payment_approved', makeOrder())

    expect(result.error).toBeNull()
    expect(mockLogSuccess).toHaveBeenCalledWith(
      'order-abc-123',
      'payment_approved',
      'comprador@example.com',
    )
  })

  it('não chama logAttempt em caso de sucesso', async () => {
    mockSendEmail.mockResolvedValue({ id: 'resend-id' })

    await EmailService.send('payment_approved', makeOrder())

    expect(mockLogAttempt).not.toHaveBeenCalled()
  })
})

// ---------------------------------------------------------------------------
// Retry
// ---------------------------------------------------------------------------

describe('EmailService.send — retry', () => {
  it('tenta novamente após falha e retorna sucesso na 2ª tentativa', async () => {
    mockSendEmail
      .mockRejectedValueOnce(new Error('Network error'))
      .mockResolvedValue({ id: 'resend-id' })

    const result = await EmailService.send('payment_approved', makeOrder())

    expect(result.error).toBeNull()
    expect(mockSendEmail).toHaveBeenCalledTimes(2)
    expect(mockLogAttempt).toHaveBeenCalledTimes(1)
    expect(mockLogAttempt).toHaveBeenCalledWith(
      'order-abc-123',
      'payment_approved',
      'comprador@example.com',
      1,
    )
  })

  it('para na 3ª tentativa e retorna erro', async () => {
    mockSendEmail.mockRejectedValue(new Error('Persistent error'))

    const result = await EmailService.send('payment_approved', makeOrder())

    expect(result.error).not.toBeNull()
    expect(result.error?.code).toBe('EMAIL_FAILED')
    expect(mockSendEmail).toHaveBeenCalledTimes(3)
    expect(mockLogAttempt).toHaveBeenCalledTimes(3)
    expect(mockLogFailed).toHaveBeenCalledTimes(1)
    expect(mockLogFailed).toHaveBeenCalledWith('order-abc-123', 'payment_approved')
  })

  it('registra attempt com número correto em cada tentativa', async () => {
    mockSendEmail.mockRejectedValue(new Error('Error'))

    await EmailService.send('payment_approved', makeOrder())

    const attempts = mockLogAttempt.mock.calls.map((call) => call[3])
    expect(attempts).toEqual([1, 2, 3])
  })
})
