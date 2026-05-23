/**
 * @deprecated DEAD CODE — teste de código não usado em produção.
 *
 * Este teste exercita TicketLotService, que faz parte da arquitetura ANTERIOR
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

// ---------------------------------------------------------------------------
// Hoisted mocks (vi.mock factories run before const declarations)
// ---------------------------------------------------------------------------

const { mockRpc } = vi.hoisted(() => ({
  mockRpc: vi.fn(),
}))

vi.mock('@/lib/supabase/server', () => ({
  createClient: vi.fn().mockResolvedValue({
    rpc: mockRpc,
  }),
}))

import { TicketLotService } from '@/services/TicketLotService'

beforeEach(() => {
  mockRpc.mockReset()
})

// ---------------------------------------------------------------------------
// reserve()
// ---------------------------------------------------------------------------

describe('TicketLotService.reserve', () => {
  it('retorna true quando RPC retorna true', async () => {
    mockRpc.mockResolvedValue({ data: true, error: null })

    const result = await TicketLotService.reserve('lot-uuid', 1)

    expect(result).toBe(true)
    expect(mockRpc).toHaveBeenCalledWith('reserve_ticket_slot', {
      p_lot_id: 'lot-uuid',
      p_quantity: 1,
    })
  })

  it('retorna false quando RPC retorna false (sold_count >= total_limit)', async () => {
    mockRpc.mockResolvedValue({ data: false, error: null })

    const result = await TicketLotService.reserve('lot-uuid', 1)

    expect(result).toBe(false)
  })

  it('retorna false quando RPC retorna erro', async () => {
    mockRpc.mockResolvedValue({ data: null, error: { message: 'connection error' } })

    const result = await TicketLotService.reserve('lot-uuid', 1)

    expect(result).toBe(false)
  })

  it('usa quantity = 1 como padrão', async () => {
    mockRpc.mockResolvedValue({ data: true, error: null })

    await TicketLotService.reserve('lot-uuid')

    expect(mockRpc).toHaveBeenCalledWith('reserve_ticket_slot', {
      p_lot_id: 'lot-uuid',
      p_quantity: 1,
    })
  })

  it('reserva múltiplas vagas corretamente', async () => {
    mockRpc.mockResolvedValue({ data: true, error: null })

    const result = await TicketLotService.reserve('lot-uuid', 3)

    expect(result).toBe(true)
    expect(mockRpc).toHaveBeenCalledWith('reserve_ticket_slot', {
      p_lot_id: 'lot-uuid',
      p_quantity: 3,
    })
  })
})

// ---------------------------------------------------------------------------
// release()
// ---------------------------------------------------------------------------

describe('TicketLotService.release', () => {
  it('chama RPC com parâmetros corretos', async () => {
    mockRpc.mockResolvedValue({ data: null, error: null })

    await TicketLotService.release('lot-uuid', 2)

    expect(mockRpc).toHaveBeenCalledWith('release_ticket_slot', {
      p_lot_id: 'lot-uuid',
      p_quantity: 2,
    })
  })

  it('não lança exceção quando RPC retorna erro', async () => {
    mockRpc.mockResolvedValue({ data: null, error: { message: 'DB error' } })

    await expect(TicketLotService.release('lot-uuid', 1)).resolves.toBeUndefined()
  })

  it('usa quantity = 1 como padrão', async () => {
    mockRpc.mockResolvedValue({ data: null, error: null })

    await TicketLotService.release('lot-uuid')

    expect(mockRpc).toHaveBeenCalledWith('release_ticket_slot', {
      p_lot_id: 'lot-uuid',
      p_quantity: 1,
    })
  })
})
