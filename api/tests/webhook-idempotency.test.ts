/**
 * api/tests/webhook-idempotency.test.ts
 *
 * Teste integration do handler /mp-webhook (Task 10).
 *
 * ESCOPO: testa propriedades derivadas do CAS (compare-and-swap) atômico
 * introduzido na Task 9.5 — quando o UPDATE retorna 0 linhas, nenhum
 * downstream (reserve_ticket_slot, sendApprovalEmail) deve disparar.
 *
 * NÃO TESTA: a garantia transacional do CAS em si (atomicidade do UPDATE
 * + filtro no WHERE). Isso é propriedade do PostgreSQL via supabase-js —
 * validada por construção do SQL na 9.5, não por mock aplicacional.
 *
 * Cobre 3 specs:
 *   1. CAS retorna [] (status já terminal) → idempotente, sem efeitos.
 *   2. CAS reivindica + status paid → reserve_ticket_slot 1x principal +
 *      1x por combo, sendApprovalEmail chamado.
 *   3. Combo retorna false (oversell) → has_inventory_issue=true,
 *      sendApprovalEmail AINDA chamado (não aborta).
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'

// ---------------------------------------------------------------------------
// Mocks hoisted (precisam existir antes do import dinâmico do handler)
// ---------------------------------------------------------------------------

const { mockGetSupabase, mockGetPayment, mockSendEmail, mockBuildApprovalHtml } = vi.hoisted(() => ({
  mockGetSupabase: vi.fn(),
  mockGetPayment: vi.fn(),
  mockSendEmail: vi.fn(),
  mockBuildApprovalHtml: vi.fn(),
}))

vi.mock('../src/lib/supabase.js', () => ({
  getSupabase: mockGetSupabase,
}))

vi.mock('../src/lib/mercadopago.js', () => ({
  getPayment: mockGetPayment,
}))

vi.mock('../src/lib/resend.js', () => ({
  sendEmail: mockSendEmail,
}))

vi.mock('../src/lib/email-templates.js', () => ({
  buildApprovalHtml: mockBuildApprovalHtml,
}))

// ---------------------------------------------------------------------------
// Helpers — builder de mock supabase chainable
// ---------------------------------------------------------------------------

interface OrdersTableMocks {
  /** Resposta do SELECT * FROM orders_encontro WHERE id=… */
  selectMaybeSingle: { data: Record<string, unknown> | null; error: { message: string } | null }
  /** Resposta do UPDATE … RETURNING id (CAS) */
  updateSelect: { data: Array<{ id: string }> | null; error: { message: string } | null }
}

/**
 * Constrói um mock de cliente supabase com:
 *   - .from('orders_encontro')  → select+maybeSingle pra busca; update+...+select pro CAS;
 *                                 update simples pra has_inventory_issue
 *   - .from('email_logs_encontro').insert(...)  → no-op
 *   - .rpc(name, params)  → controlável via rpcImpl
 */
function buildSupabaseMock(opts: {
  orders: OrdersTableMocks
  rpcImpl: (name: string, params: Record<string, unknown>) => { data: unknown; error: { message: string } | null }
}) {
  const updateInventoryIssueSpy = vi.fn().mockResolvedValue({ error: null })
  const insertEmailLogSpy = vi.fn().mockResolvedValue({ error: null })

  const ordersFromBuilder = () => {
    const selectChain = {
      eq: vi.fn().mockReturnThis(),
      maybeSingle: vi.fn().mockResolvedValue(opts.orders.selectMaybeSingle),
    }
    const updateChain = {
      eq: vi.fn().mockReturnThis(),
      neq: vi.fn().mockReturnThis(),
      select: vi.fn().mockResolvedValue(opts.orders.updateSelect),
    }
    const inventoryUpdateChain = {
      eq: vi.fn().mockImplementation(() => updateInventoryIssueSpy()),
    }
    let updateCallCount = 0
    return {
      select: vi.fn(() => selectChain),
      update: vi.fn((payload: Record<string, unknown>) => {
        updateCallCount += 1
        // 1ª update = CAS (payment_status + payment_id + updated_at)
        // 2ª update = has_inventory_issue=true (payload com 1 chave)
        if (payload.has_inventory_issue !== undefined) return inventoryUpdateChain
        return updateChain
      }),
    }
  }

  // sendApprovalEmail faz:
  //   1. SELECT email_logs WHERE order_id=… AND template=… AND status='sent' → maybeSingle
  //   2. INSERT email_logs status='pending' → .select('id').single()
  //   3. UPDATE email_logs status='sent'/'failed' WHERE id=…
  const emailLogsFromBuilder = () => {
    const selectChain = {
      eq: vi.fn().mockReturnThis(),
      maybeSingle: vi.fn().mockResolvedValue({ data: null, error: null }),
    }
    const insertChain = {
      select: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue({ data: { id: 'email-log-fixture-id' }, error: null }),
    }
    const updateChain = {
      eq: vi.fn().mockResolvedValue({ error: null }),
    }
    return {
      select: vi.fn(() => selectChain),
      insert: vi.fn(() => {
        insertEmailLogSpy()
        return insertChain
      }),
      update: vi.fn(() => updateChain),
    }
  }

  const supabase = {
    from: vi.fn((table: string) => {
      if (table === 'orders_encontro') return ordersFromBuilder()
      if (table === 'email_logs_encontro') return emailLogsFromBuilder()
      throw new Error(`Mock supabase.from sem implementação para tabela ${table}`)
    }),
    rpc: vi.fn((name: string, params: Record<string, unknown>) => Promise.resolve(opts.rpcImpl(name, params))),
  }

  return { supabase, updateInventoryIssueSpy, insertEmailLogSpy }
}

// ---------------------------------------------------------------------------
// Fixtures
// ---------------------------------------------------------------------------

const PAYMENT_ID = '12345678'
const ORDER_ID = '00000000-0000-0000-0000-000000000abc'
const LOT_PRINCIPAL_ID = '11111111-1111-1111-1111-111111111111'
const COMBO_LOT_ID = '22222222-2222-2222-2222-222222222222'
const COMBO_RULE_ID = '33333333-3333-3333-3333-333333333333'

const webhookBody = {
  type: 'payment',
  data: { id: PAYMENT_ID },
}

function approvedPayment() {
  return { status: 'approved', external_reference: ORDER_ID }
}

function pendingOrder(overrides: Partial<Record<string, unknown>> = {}) {
  return {
    id: ORDER_ID,
    payment_status: 'pending',
    ticket_lot_id: LOT_PRINCIPAL_ID,
    ticket_quantity: 1,
    buyer_name: 'Fulano de Tal',
    buyer_email: 'fulano@example.com',
    total: 100,
    order_bumps: null,
    ...overrides,
  }
}

// ---------------------------------------------------------------------------
// Specs
// ---------------------------------------------------------------------------

describe('POST /mp-webhook — idempotency derivada do CAS (Task 9.5/10)', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    // PAYMENT_WEBHOOK_SECRET ausente → handler pula validação de assinatura (modo dev)
    delete process.env.PAYMENT_WEBHOOK_SECRET
    mockSendEmail.mockResolvedValue(true)
    mockBuildApprovalHtml.mockReturnValue('<html>ok</html>')
  })

  it('(a) CAS retorna [] (já processado) → não chama reserve_ticket_slot nem sendEmail', async () => {
    const rpcImpl = vi.fn().mockResolvedValue({ data: true, error: null })
    const { supabase, insertEmailLogSpy, updateInventoryIssueSpy } = buildSupabaseMock({
      orders: {
        selectMaybeSingle: { data: pendingOrder(), error: null },
        updateSelect: { data: [], error: null }, // CAS: 0 linhas (outro webhook já processou)
      },
      rpcImpl,
    })
    mockGetSupabase.mockReturnValue(supabase)
    mockGetPayment.mockResolvedValue(approvedPayment())

    const { default: app } = await import('../src/routes/webhook.js')
    const res = await app.request('/', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(webhookBody),
    })

    expect(res.status).toBe(200)
    expect(rpcImpl).not.toHaveBeenCalled()
    expect(mockSendEmail).not.toHaveBeenCalled()
    expect(insertEmailLogSpy).not.toHaveBeenCalled()
    expect(updateInventoryIssueSpy).not.toHaveBeenCalled()
  })

  it('(b) CAS reivindica + status paid → reserve_ticket_slot 1x principal + 1x por combo + sendEmail', async () => {
    const rpcImpl = vi.fn().mockResolvedValue({ data: true, error: null })
    const order = pendingOrder({
      order_bumps: [
        { type: 'ticket_lot', id: COMBO_RULE_ID, ticket_lot_id: COMBO_LOT_ID, name: 'Combo VIP', price: 50 },
        { type: 'merchandise', id: 'merch-xyz', name: 'Camiseta', price: 30 }, // ignorado pela iteração de combos
      ],
    })
    const { supabase, insertEmailLogSpy, updateInventoryIssueSpy } = buildSupabaseMock({
      orders: {
        selectMaybeSingle: { data: order, error: null },
        updateSelect: { data: [{ id: ORDER_ID }], error: null }, // CAS: este webhook reivindicou
      },
      rpcImpl,
    })
    mockGetSupabase.mockReturnValue(supabase)
    mockGetPayment.mockResolvedValue(approvedPayment())

    const { default: app } = await import('../src/routes/webhook.js')
    const res = await app.request('/', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(webhookBody),
    })

    expect(res.status).toBe(200)
    // 1ª: principal; 2ª: combo
    expect(rpcImpl).toHaveBeenCalledTimes(2)
    expect(rpcImpl).toHaveBeenNthCalledWith(1, 'reserve_ticket_slot', {
      p_lot_id: LOT_PRINCIPAL_ID,
      p_quantity: 1,
    })
    expect(rpcImpl).toHaveBeenNthCalledWith(2, 'reserve_ticket_slot', {
      p_lot_id: COMBO_LOT_ID,
      p_quantity: 1,
    })
    expect(mockSendEmail).toHaveBeenCalledTimes(1)
    expect(insertEmailLogSpy).toHaveBeenCalledTimes(1)
    expect(updateInventoryIssueSpy).not.toHaveBeenCalled()
  })

  it('(c) combo retorna false (oversell) → has_inventory_issue=true + sendEmail ainda dispara', async () => {
    let call = 0
    const rpcImpl = vi.fn().mockImplementation(() => {
      call += 1
      // principal OK, combo oversell
      return Promise.resolve({ data: call === 1 ? true : false, error: null })
    })
    const order = pendingOrder({
      order_bumps: [
        { type: 'ticket_lot', id: COMBO_RULE_ID, ticket_lot_id: COMBO_LOT_ID, name: 'Combo VIP', price: 50 },
      ],
    })
    const { supabase, insertEmailLogSpy, updateInventoryIssueSpy } = buildSupabaseMock({
      orders: {
        selectMaybeSingle: { data: order, error: null },
        updateSelect: { data: [{ id: ORDER_ID }], error: null },
      },
      rpcImpl,
    })
    mockGetSupabase.mockReturnValue(supabase)
    mockGetPayment.mockResolvedValue(approvedPayment())

    const { default: app } = await import('../src/routes/webhook.js')
    const res = await app.request('/', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(webhookBody),
    })

    expect(res.status).toBe(200)
    expect(rpcImpl).toHaveBeenCalledTimes(2)
    expect(updateInventoryIssueSpy).toHaveBeenCalledTimes(1)
    expect(mockSendEmail).toHaveBeenCalledTimes(1)
    expect(insertEmailLogSpy).toHaveBeenCalledTimes(1)
  })
})
