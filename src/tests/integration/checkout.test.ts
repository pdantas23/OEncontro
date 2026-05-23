/**
 * @deprecated DEAD CODE — teste de código não usado em produção.
 *
 * Este teste exercita CheckoutService, que faz parte da arquitetura ANTERIOR
 * ao Mercado Pago Checkout Pro. O fluxo atual de produção é:
 * src/app/checkout/actions.ts → API Hono /create-order.
 *
 * Mantido temporariamente. Verificado em 2026-05-23 durante a Task 4 do projeto
 * de Order Bumps de Ingresso. Confirmado: o SUT é dead code (zero imports
 * em produção).
 *
 * ⚠️ COBERTURA ENGANOSA: este teste continua passando no CI mas não valida
 * nenhum caminho de produção. Não usar como referência de cobertura real.
 *
 * TODO: deletar junto com o SUT em task de limpeza dedicada.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import type { Order } from '@/repositories/OrderRepository'
import type { CreateOrderInput } from '@/types/checkout'

// ---------------------------------------------------------------------------
// Hoisted mocks
// ---------------------------------------------------------------------------

const {
  mockFindById,
  mockFindByIds,
  mockOrderCreate,
  mockUpdatePaymentData,
  mockUpdateStatus,
  mockReserve,
  mockRelease,
  mockOnPixGenerated,
  mockOnPaymentApproved,
  mockCreatePixPayment,
  mockCreateCardPayment,
} = vi.hoisted(() => ({
  mockFindById: vi.fn(),
  mockFindByIds: vi.fn(),
  mockOrderCreate: vi.fn(),
  mockUpdatePaymentData: vi.fn(),
  mockUpdateStatus: vi.fn(),
  mockReserve: vi.fn(),
  mockRelease: vi.fn(),
  mockOnPixGenerated: vi.fn(),
  mockOnPaymentApproved: vi.fn(),
  mockCreatePixPayment: vi.fn(),
  mockCreateCardPayment: vi.fn(),
}))

vi.mock('@/repositories/TicketLotRepository', () => ({
  TicketLotRepository: { findById: mockFindById },
}))

vi.mock('@/repositories/OrderBumpRepository', () => ({
  OrderBumpRepository: { findByIds: mockFindByIds },
}))

vi.mock('@/repositories/OrderRepository', () => ({
  OrderRepository: {
    create: mockOrderCreate,
    updatePaymentData: mockUpdatePaymentData,
    updateStatus: mockUpdateStatus,
  },
}))

vi.mock('@/services/TicketLotService', () => ({
  TicketLotService: {
    reserve: mockReserve,
    release: mockRelease,
  },
}))

vi.mock('@/services/email-triggers', () => ({
  onPixGenerated: mockOnPixGenerated,
  onPaymentApproved: mockOnPaymentApproved,
  onPixExpired: vi.fn().mockResolvedValue(undefined),
}))

vi.mock('@/lib/paymentAdapter', () => ({
  getPaymentAdapter: vi.fn().mockReturnValue({
    createPixPayment: mockCreatePixPayment,
    createCardPayment: mockCreateCardPayment,
  }),
}))

import { CheckoutService } from '@/services/CheckoutService'

// ---------------------------------------------------------------------------
// Fixtures
// ---------------------------------------------------------------------------

const mockTicketLot = {
  id: 'lot-uuid-001',
  name: 'Lote 1',
  price: 15000,
  status: 'active' as const,
  total_limit: 100,
  sold_count: 10,
}

const mockBumps = [{ id: 'bump-uuid-001', name: 'Camiseta', price: 5000 }]

const mockOrder: Order = {
  id: 'order-uuid-001',
  buyer_name: 'Ana Lima',
  buyer_email: 'ana@example.com',
  buyer_whatsapp: '11988887777',
  buyer_cpf: null,
  ticket_lot_id: 'lot-uuid-001',
  ticket_quantity: 1,
  order_bumps: null,
  subtotal: 15000,
  total: 15000,
  payment_method: 'pix',
  payment_status: 'pending',
  payment_id: null,
  pix_code: 'fake-pix-code',
  pix_qrcode_url: null,
  pix_expires_at: new Date(Date.now() + 30 * 60 * 1000).toISOString(),
  has_inventory_issue: false,
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
}

const baseInput: CreateOrderInput = {
  lotId: 'lot-uuid-001',
  quantity: 1,
  buyer: {
    name: 'Ana Lima',
    email: 'ana@example.com',
    whatsapp: '11988887777',
  },
  bumps: [],
  paymentMethod: 'pix',
}

beforeEach(() => {
  vi.clearAllMocks()
  mockFindById.mockResolvedValue(mockTicketLot)
  mockFindByIds.mockResolvedValue([])
  mockOrderCreate.mockResolvedValue(mockOrder)
  mockUpdatePaymentData.mockResolvedValue(undefined)
  mockUpdateStatus.mockResolvedValue(undefined)
  mockReserve.mockResolvedValue(true)
  mockRelease.mockResolvedValue(undefined)
  mockOnPixGenerated.mockResolvedValue(undefined)
  mockOnPaymentApproved.mockResolvedValue(undefined)
  mockCreatePixPayment.mockResolvedValue({
    paymentId: 'mock-pix-001',
    pixCode: 'fake-pix-code',
    pixQrcodeUrl: 'data:image/png;base64,fake',
    expiresAt: new Date(Date.now() + 30 * 60 * 1000),
  })
  mockCreateCardPayment.mockResolvedValue({
    paymentId: 'mock-card-001',
    status: 'paid',
  })
})

// ---------------------------------------------------------------------------
// Fluxo Pix
// ---------------------------------------------------------------------------

describe('CheckoutService — Pix', () => {
  it('retorna sucesso com orderId quando Pix é gerado', async () => {
    const result = await CheckoutService.createOrder(baseInput)

    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.orderId).toBe('order-uuid-001')
      expect(result.paymentMethod).toBe('pix')
    }
  })

  it('chama reserve antes de criar order', async () => {
    await CheckoutService.createOrder(baseInput)

    expect(mockReserve).toHaveBeenCalledWith('lot-uuid-001', 1)
    expect(mockOrderCreate).toHaveBeenCalled()
  })

  it('atualiza order com dados do Pix após geração', async () => {
    await CheckoutService.createOrder(baseInput)

    expect(mockUpdatePaymentData).toHaveBeenCalledWith(
      'order-uuid-001',
      expect.objectContaining({
        payment_id: 'mock-pix-001',
        pix_code: 'fake-pix-code',
        payment_status: 'pending',
      }),
    )
  })

  it('dispara onPixGenerated após salvar dados', async () => {
    await CheckoutService.createOrder(baseInput)

    expect(mockOnPixGenerated).toHaveBeenCalledWith('order-uuid-001')
  })

  it('não chama release quando Pix é gerado com sucesso', async () => {
    await CheckoutService.createOrder(baseInput)

    expect(mockRelease).not.toHaveBeenCalled()
  })
})

// ---------------------------------------------------------------------------
// Sem vagas disponíveis
// ---------------------------------------------------------------------------

describe('CheckoutService — sem vagas', () => {
  it('retorna erro sem criar order quando reserve retorna false', async () => {
    mockReserve.mockResolvedValue(false)

    const result = await CheckoutService.createOrder(baseInput)

    expect(result.success).toBe(false)
    if (!result.success) {
      expect(result.error).toMatch(/esgotados|indisponível/)
    }
    expect(mockOrderCreate).not.toHaveBeenCalled()
  })

  it('retorna erro se lote não encontrado', async () => {
    mockFindById.mockResolvedValue(null)

    const result = await CheckoutService.createOrder(baseInput)

    expect(result.success).toBe(false)
    if (!result.success) {
      expect(result.error).toMatch(/indisponível/)
    }
  })

  it('retorna erro se lote está inativo', async () => {
    mockFindById.mockResolvedValue({ ...mockTicketLot, status: 'sold_out' })

    const result = await CheckoutService.createOrder(baseInput)

    expect(result.success).toBe(false)
  })
})

// ---------------------------------------------------------------------------
// Fluxo Cartão — aprovado
// ---------------------------------------------------------------------------

describe('CheckoutService — Cartão aprovado', () => {
  const cardInput: CreateOrderInput = {
    ...baseInput,
    paymentMethod: 'card',
    card: {
      number: '4111111111111112',
      holderName: 'ANA LIMA',
      expirationMonth: '12',
      expirationYear: String(new Date().getFullYear() + 1),
      cvv: '123',
    },
  }

  beforeEach(() => {
    mockOrderCreate.mockResolvedValue({
      ...mockOrder,
      payment_method: 'card',
      pix_code: null,
      pix_qrcode_url: null,
      pix_expires_at: null,
    })
  })

  it('retorna sucesso para pagamento com cartão', async () => {
    const result = await CheckoutService.createOrder(cardInput)

    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.paymentMethod).toBe('card')
    }
  })

  it('dispara onPaymentApproved após aprovação', async () => {
    await CheckoutService.createOrder(cardInput)

    expect(mockOnPaymentApproved).toHaveBeenCalledWith('order-uuid-001')
  })

  it('não chama release quando cartão é aprovado', async () => {
    await CheckoutService.createOrder(cardInput)

    expect(mockRelease).not.toHaveBeenCalled()
  })
})

// ---------------------------------------------------------------------------
// Fluxo Cartão — recusado
// ---------------------------------------------------------------------------

describe('CheckoutService — Cartão recusado', () => {
  const cardInput: CreateOrderInput = {
    ...baseInput,
    paymentMethod: 'card',
    card: {
      number: '4111111111111111',
      holderName: 'ANA LIMA',
      expirationMonth: '12',
      expirationYear: String(new Date().getFullYear() + 1),
      cvv: '123',
    },
  }

  beforeEach(() => {
    mockCreateCardPayment.mockResolvedValue({
      paymentId: 'mock-card-declined',
      status: 'failed',
      errorMessage: 'Cartão recusado pela operadora.',
    })
  })

  it('retorna erro quando cartão é recusado', async () => {
    const result = await CheckoutService.createOrder(cardInput)

    expect(result.success).toBe(false)
    if (!result.success) {
      expect(result.error).toMatch(/recusado|operadora/)
    }
  })

  it('chama release quando cartão é recusado', async () => {
    await CheckoutService.createOrder(cardInput)

    expect(mockRelease).toHaveBeenCalledWith('lot-uuid-001', 1)
  })

  it('atualiza status do order para failed', async () => {
    await CheckoutService.createOrder(cardInput)

    expect(mockUpdateStatus).toHaveBeenCalledWith('order-uuid-001', 'failed')
  })

  it('não dispara email quando cartão é recusado', async () => {
    await CheckoutService.createOrder(cardInput)

    expect(mockOnPaymentApproved).not.toHaveBeenCalled()
  })
})

// ---------------------------------------------------------------------------
// Cálculo de totais com order bumps
// ---------------------------------------------------------------------------

describe('CheckoutService — cálculo de totais', () => {
  it('inclui order bumps no total', async () => {
    mockFindByIds.mockResolvedValue(mockBumps)

    await CheckoutService.createOrder({
      ...baseInput,
      bumps: [{ id: 'bump-uuid-001' }],
    })

    const createCall = mockOrderCreate.mock.calls[0][0]
    expect(createCall.total).toBe(15000 + 5000)
    expect(createCall.subtotal).toBe(15000)
  })
})
