/**
 * T121 — TicketLotService unit tests
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
