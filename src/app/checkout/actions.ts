// Client-side — sem 'use server'
import { createClient } from '@/lib/supabase/client'
import { createOrderSchema } from '@/lib/validations/checkout'
import type { CreateOrderResult } from '@/types/checkout'

export async function createOrderAction(input: unknown): Promise<CreateOrderResult> {
  const parsed = createOrderSchema.safeParse(input)
  if (!parsed.success) {
    return {
      success: false,
      error: 'Dados inválidos. Verifique as informações e tente novamente.',
      fields: parsed.error.flatten().fieldErrors as Record<string, string[]>,
    }
  }

  const { lotId, quantity, buyerName, buyerEmail, buyerWhatsapp, buyerCpf, bumps } = parsed.data

  const supabase = createClient()

  // Valida lote
  const { data: lot } = await supabase.from('ticket_lots_encontro').select('*').eq('id', lotId).maybeSingle()
  if (!lot || lot.status !== 'active') {
    return { success: false, error: 'Lote de ingressos indisponível.' }
  }

  const available = lot.total_limit - lot.sold_count
  if (available < quantity) {
    return { success: false, error: 'Ingressos esgotados para este lote.' }
  }

  // Calcula total
  const bumpsData = bumps && bumps.length > 0
    ? await supabase.from('order_bumps_encontro').select('id, name, price').in('id', bumps.map((b) => b.id))
    : { data: [] }
  const bumpsTotal = (bumpsData.data ?? []).reduce((s, b) => s + b.price, 0)
  const total = lot.price * quantity + bumpsTotal

  // Reserva vagas atomicamente
  const { error: reserveError } = await supabase.rpc('reserve_ticket_slot', {
    p_lot_id: lotId,
    p_quantity: quantity,
  })
  if (reserveError) {
    return { success: false, error: 'Ingressos esgotados para este lote.' }
  }

  // Gera UUID no client — evita depender de RETURNING (.select()),
  // que seria bloqueado pela policy SELECT (is_admin) da tabela.
  const orderId = crypto.randomUUID()

  // Cria pedido
  const { error: orderError } = await supabase
    .from('orders_encontro')
    .insert({
      id: orderId,
      ticket_lot_id: lotId,
      ticket_quantity: quantity,
      buyer_name: buyerName,
      buyer_email: buyerEmail,
      buyer_whatsapp: buyerWhatsapp,
      buyer_cpf: buyerCpf ?? null,
      payment_method: 'mercadopago',
      payment_status: 'pending',
      subtotal: lot.price * quantity,
      total,
      order_bumps: bumps?.map((b) => {
        const bumpData = (bumpsData.data ?? []).find((d) => d.id === b.id)
        return {
          id: b.id,
          name: bumpData?.name ?? '',
          price: bumpData?.price ?? 0,
          size: b.size ?? null,
        }
      }) ?? [],
    })

  if (orderError) {
    // Compensa reserva
    await supabase.rpc('release_ticket_slot', { p_lot_id: lotId, p_quantity: quantity })
    return { success: false, error: 'Erro ao criar pedido. Tente novamente.' }
  }

  // Chama API HTTP para criar preference no Mercado Pago
  const apiUrl = process.env.NEXT_PUBLIC_API_URL

  const items = [
    { title: lot.name, quantity, unit_price: lot.price * 100 },
    ...(bumpsData.data ?? []).map((b) => ({
      title: b.name,
      quantity: 1,
      unit_price: b.price * 100,
    })),
  ]

  try {
    const mpResponse = await fetch(`${apiUrl}/create-preference`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        order_id: orderId,
        buyer_name: buyerName,
        buyer_email: buyerEmail,
        buyer_cpf: buyerCpf ?? undefined,
        items,
        total: total * 100, // converte para centavos
      }),
    })

    if (!mpResponse.ok) {
      const errBody = await mpResponse.text()
      console.error('[createOrderAction] API preference error:', errBody)
      // Compensa reserva
      await supabase.rpc('release_ticket_slot', { p_lot_id: lotId, p_quantity: quantity })
      await supabase.from('orders_encontro').update({ payment_status: 'failed' }).eq('id', orderId)
      return { success: false, error: 'Erro ao iniciar pagamento. Tente novamente.' }
    }

    const { init_point } = await mpResponse.json()

    // Redireciona para o Mercado Pago
    window.location.href = init_point
    return { success: true, orderId: orderId, paymentMethod: 'mercadopago' }
  } catch (err) {
    console.error('[createOrderAction] Unexpected error:', err)
    // Compensa reserva
    await supabase.rpc('release_ticket_slot', { p_lot_id: lotId, p_quantity: quantity })
    await supabase.from('orders_encontro').update({ payment_status: 'failed' }).eq('id', orderId)
    return { success: false, error: 'Erro ao processar pagamento. Tente novamente.' }
  }
}
