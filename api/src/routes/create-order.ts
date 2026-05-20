/**
 * api/src/routes/create-order.ts
 *
 * POST /create-order
 *
 * Cria um pedido completo server-side:
 *   1. Valida lote (ativo, preço real do DB)
 *   2. Reserva vagas via RPC reserve_ticket_slot (FOR UPDATE lock)
 *   3. Calcula total com preços do DB (nunca confia no client)
 *   4. Insere o pedido em orders_encontro
 *   5. Retorna { order_id } pro frontend chamar /create-preference
 *
 * Se qualquer passo falhar, compensa (release_ticket_slot).
 */

import { Hono } from 'hono'
import { z } from 'zod'
import { getSupabase } from '../lib/supabase.js'

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
    size: z.string().optional(),
  })).default([]),
})

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

  // 1. Valida lote (preço e status do DB — nunca confiar no client)
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

  // 2. Reserva vagas atomicamente (FOR UPDATE lock no Postgres)
  const { data: reserved, error: reserveError } = await supabase.rpc('reserve_ticket_slot', {
    p_lot_id: lot_id,
    p_quantity: quantity,
  })

  if (reserveError || !reserved) {
    return c.json({ success: false, error: 'Ingressos esgotados para este lote.' }, 400)
  }

  // 3. Calcula total com preços do DB
  let bumpsData: Array<{ id: string; name: string; price: number }> = []
  if (bumps.length > 0) {
    const { data } = await supabase
      .from('order_bumps_encontro')
      .select('id, name, price')
      .in('id', bumps.map((b) => b.id))
      .eq('active', true)
    bumpsData = data ?? []
  }

  const subtotal = lot.price * quantity
  const bumpsTotal = bumpsData.reduce((s, b) => s + b.price, 0)
  const total = subtotal + bumpsTotal

  // 4. Insere pedido (service role bypassa RLS)
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
      order_bumps: bumpsData.length > 0
        ? bumpsData.map((b) => ({
            id: b.id,
            name: b.name,
            price: b.price,
            size: bumps.find((bp) => bp.id === b.id)?.size ?? null,
          }))
        : null,
    })
    .select('id')
    .single()

  if (orderError || !order) {
    console.error('[create-order] INSERT error:', orderError?.message)
    // Compensa reserva
    await supabase.rpc('release_ticket_slot', { p_lot_id: lot_id, p_quantity: quantity })
    return c.json({ success: false, error: 'Erro ao criar pedido. Tente novamente.' }, 500)
  }

  return c.json({
    success: true,
    order_id: order.id,
    total,
    // lot.price e bump.price já estão em centavos no banco
    // (o admin multiplica por 100 ao salvar)
    items: [
      { title: lot.name, quantity, unit_price: lot.price },
      ...bumpsData.map((b) => ({ title: b.name, quantity: 1, unit_price: b.price })),
    ],
  })
})

export default app
