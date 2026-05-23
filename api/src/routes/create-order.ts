/**
 * api/src/routes/create-order.ts
 *
 * POST /create-order
 *
 * Cria um pedido server-side:
 *   1. Valida lote (ativo, preço real do DB, vagas disponíveis)
 *   2. Calcula total com preços do DB (nunca confia no client)
 *   3. Insere o pedido em orders_encontro com status 'pending'
 *   4. Retorna { order_id } pro frontend chamar /create-preference
 *
 * sold_count NÃO é incrementado aqui — só no webhook quando o
 * pagamento é confirmado (status = 'paid'). Isso evita mostrar
 * ingressos como vendidos antes do pagamento.
 *
 * Bumps suportam discriminator `type`:
 *   - 'merchandise' (default): id = order_bumps_encontro.id (produto físico)
 *   - 'ticket_lot':            id = ticket_lot_bumps_encontro.id (regra de combo
 *                              aplicada ao lote oferecido)
 *
 * Combos: re-valida a regra contra DB (ativa, pertence ao principal,
 * oferecido ativo, sem overlap de event_days, vaga disponível) e
 * recalcula final_price com discount do DB. Combo enviado mas
 * inválido devolve 400 acionável.
 */

import { Hono } from 'hono'
import { z } from 'zod'
import { getSupabase } from '../lib/supabase.js'
import { computeBumpFinalPrice } from '../lib/bumps.js'

const app = new Hono()

const bodySchema = z.object({
  lot_id: z.string().uuid(),
  quantity: z.number().int().min(1).max(10),
  buyer_name: z.string().min(3),
  buyer_email: z.string().email(),
  buyer_whatsapp: z.string().min(10).max(15),
  buyer_cpf: z.string().length(11).optional().nullable(),
  bumps: z.array(z.object({
    id: z.string().uuid(),
    type: z.enum(['merchandise', 'ticket_lot']).optional(), // default 'merchandise'
    size: z.string().optional(),
  })).default([]),
})

type MerchPersistItem = {
  type: 'merchandise'
  id: string
  name: string
  price: number
  size: string | null
}

type ComboPersistItem = {
  type: 'ticket_lot'
  id: string
  ticket_lot_id: string
  name: string
  price: number
  original_price: number
}

app.post('/', async (c) => {
  const parsed = bodySchema.safeParse(await c.req.json())
  if (!parsed.success) {
    return c.json({
      success: false,
      error: 'Dados inválidos. Verifique as informações e tente novamente.',
      fields: parsed.error.flatten().fieldErrors,
    }, 400)
  }

  const { lot_id, quantity, buyer_name, buyer_email, buyer_whatsapp, buyer_cpf, bumps } = parsed.data
  const supabase = getSupabase()

  // 1. Valida lote principal (preço e status do DB — nunca confiar no client)
  const { data: lot } = await supabase
    .from('ticket_lots_encontro')
    .select('*')
    .eq('id', lot_id)
    .maybeSingle()

  if (!lot || lot.status !== 'active') {
    return c.json({ success: false, error: 'Lote de ingressos indisponível.' }, 400)
  }

  const available = lot.total_limit - lot.sold_count
  if (available < quantity) {
    return c.json({ success: false, error: 'Ingressos esgotados para este lote.' }, 400)
  }

  // 2. Separa bumps por tipo (default 'merchandise' pra backward compat)
  const merchBumps = bumps.filter((b) => (b.type ?? 'merchandise') === 'merchandise')
  const comboBumps = bumps.filter((b) => b.type === 'ticket_lot')

  // 2a. R3: dedup combo — semanticamente inválido enviar mesmo combo 2x
  if (new Set(comboBumps.map((b) => b.id)).size !== comboBumps.length) {
    return c.json({
      success: false,
      error: 'Combo duplicado no pedido. Recarregue a página e refaça a compra.',
    }, 400)
  }

  // 2b. Merchandise: lógica atual (busca produtos físicos ativos)
  let merchData: Array<{ id: string; name: string; price: number }> = []
  if (merchBumps.length > 0) {
    const { data } = await supabase
      .from('order_bumps_encontro')
      .select('id, name, price')
      .in('id', merchBumps.map((b) => b.id))
      .eq('active', true)
    merchData = data ?? []
  }

  const merchItems: MerchPersistItem[] = merchData.map((b) => ({
    type: 'merchandise',
    id: b.id,
    name: b.name,
    price: b.price,
    size: merchBumps.find((bp) => bp.id === b.id)?.size ?? null,
  }))

  // 2c. Combos: re-busca regra + oferecido, recalcula preço, valida tudo
  //
  // R2 (segurança): filtra principal_lot_id = lot_id — sem isso, atacante envia
  // combo_id válido mas de OUTRO principal e ganha desconto indevido.
  let comboItems: ComboPersistItem[] = []
  if (comboBumps.length > 0) {
    const { data: comboRows, error: comboError } = await supabase
      .from('ticket_lot_bumps_encontro')
      .select(
        'id, principal_lot_id, discount_type, discount_value, ' +
        'offered:ticket_lots_encontro!ticket_lot_bumps_encontro_offered_lot_id_fkey' +
        '(id, name, price, status, total_limit, sold_count, event_days)',
      )
      .in('id', comboBumps.map((b) => b.id))
      .eq('active', true)
      .eq('principal_lot_id', lot_id)

    if (comboError) {
      console.error('[create-order] Erro ao buscar combos:', comboError.message)
      return c.json({ success: false, error: 'Erro ao validar combos. Tente novamente.' }, 500)
    }

    type ComboRow = {
      id: string
      principal_lot_id: string
      discount_type: 'percent' | 'fixed' | null
      discount_value: number | null
      offered: {
        id: string
        name: string
        price: number
        status: string
        total_limit: number
        sold_count: number
        event_days: number[] | null
      } | null
    }

    const rowsById = new Map<string, ComboRow>()
    for (const row of (comboRows ?? []) as unknown as ComboRow[]) {
      rowsById.set(row.id, row)
    }

    const invalidIds: string[] = []
    const invalidLabels: string[] = []
    const reasonsByLabel: string[] = []

    for (const sent of comboBumps) {
      const row = rowsById.get(sent.id)
      if (!row) {
        invalidIds.push(sent.id)
        invalidLabels.push(`combo ${sent.id.slice(0, 8)} (não disponível para este lote)`)
        reasonsByLabel.push('combo não encontrado ou não pertence ao lote selecionado')
        continue
      }
      const offered = row.offered
      if (!offered) {
        invalidIds.push(sent.id)
        invalidLabels.push(`combo ${sent.id.slice(0, 8)} (lote oferecido removido)`)
        reasonsByLabel.push('lote oferecido removido')
        continue
      }
      if (offered.id === lot_id) {
        invalidIds.push(sent.id)
        invalidLabels.push(`"${offered.name}" (igual ao principal)`)
        reasonsByLabel.push('igual ao lote principal')
        continue
      }
      if (offered.status !== 'active') {
        invalidIds.push(sent.id)
        invalidLabels.push(`"${offered.name}" (desativado)`)
        reasonsByLabel.push('desativado')
        continue
      }
      if (offered.total_limit - offered.sold_count < 1) {
        invalidIds.push(sent.id)
        invalidLabels.push(`"${offered.name}" (esgotado)`)
        reasonsByLabel.push('esgotado')
        continue
      }
      if (lot.event_days == null || offered.event_days == null) {
        invalidIds.push(sent.id)
        invalidLabels.push(`"${offered.name}" (dias não configurados)`)
        reasonsByLabel.push('dias não configurados')
        continue
      }
      const overlap = (lot.event_days as number[]).filter((d: number) => offered.event_days!.includes(d))
      if (overlap.length > 0) {
        invalidIds.push(sent.id)
        invalidLabels.push(`"${offered.name}" (sobrepõe dias do principal)`)
        reasonsByLabel.push('sobrepõe dias do principal')
        continue
      }

      const { finalPrice } = computeBumpFinalPrice(offered.price, row.discount_type, row.discount_value)
      if (finalPrice <= 0) {
        invalidIds.push(sent.id)
        invalidLabels.push(`"${offered.name}" (desconto inválido)`)
        reasonsByLabel.push('desconto deixaria preço zero ou negativo')
        continue
      }

      comboItems.push({
        type: 'ticket_lot',
        id: row.id,
        ticket_lot_id: offered.id,
        name: offered.name,
        price: finalPrice,
        original_price: offered.price,
      })
    }

    if (invalidIds.length > 0) {
      console.warn('[create-order] Combos inválidos:', { lot_id, invalidIds, reasonsByLabel })
      return c.json({
        success: false,
        error: `Combos indisponíveis: ${invalidLabels.join(', ')}. Atualize a página e refaça a compra.`,
        invalid_combo_ids: invalidIds,
        fields: { bumps: invalidLabels },
      }, 400)
    }
  }

  // 3. Calcula totais com preços do DB
  const subtotal = lot.price * quantity
  const merchTotal = merchItems.reduce((s, b) => s + b.price, 0)
  const comboTotal = comboItems.reduce((s, b) => s + b.price, 0)
  const total = subtotal + merchTotal + comboTotal

  // 4. Insere pedido (service role bypassa RLS)
  const persistedBumps: Array<MerchPersistItem | ComboPersistItem> = [...merchItems, ...comboItems]
  const { data: order, error: orderError } = await supabase
    .from('orders_encontro')
    .insert({
      buyer_name,
      buyer_email,
      buyer_whatsapp,
      buyer_cpf: buyer_cpf ?? null,
      ticket_lot_id: lot_id,
      ticket_quantity: quantity,
      payment_method: 'mercadopago',
      payment_status: 'pending',
      subtotal,
      total,
      order_bumps: persistedBumps.length > 0 ? persistedBumps : null,
    })
    .select('id')
    .single()

  if (orderError || !order) {
    console.error('[create-order] INSERT error:', orderError?.message)
    return c.json({ success: false, error: 'Erro ao criar pedido. Tente novamente.' }, 500)
  }

  // 5. Items para MP preference: principal + merchandise + combo (com sufixo)
  const items: Array<{ title: string; quantity: number; unit_price: number }> = [
    { title: lot.name, quantity, unit_price: lot.price },
    ...merchItems.map((b) => ({ title: b.name, quantity: 1, unit_price: b.price })),
    ...comboItems.map((b) => ({ title: `${b.name} (Combo)`, quantity: 1, unit_price: b.price })),
  ]

  return c.json({
    success: true,
    order_id: order.id,
    total,
    items,
  })
})

export default app
