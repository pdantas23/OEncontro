// Client-side — sem 'use server'
import { createOrderSchema } from '@/lib/validations/checkout'
import { env } from '@/config/env'
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
  const apiUrl = env.NEXT_PUBLIC_API_URL

  try {
    // 1. Cria pedido via API (reserva vaga + insert — tudo server-side)
    const orderRes = await fetch(`${apiUrl}/create-order`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        lot_id: lotId,
        quantity,
        buyer_name: buyerName,
        buyer_email: buyerEmail,
        buyer_whatsapp: buyerWhatsapp,
        buyer_cpf: buyerCpf ?? null,
        bumps: bumps?.map((b) => ({ id: b.id, size: b.size })) ?? [],
      }),
    })

    const orderData = await orderRes.json()

    if (!orderRes.ok || !orderData.success) {
      return {
        success: false,
        error: orderData.error ?? 'Erro ao criar pedido. Tente novamente.',
        fields: orderData.fields,
      }
    }

    const { order_id, items, total } = orderData

    // 2. Cria preference no MP via API
    const mpRes = await fetch(`${apiUrl}/create-preference`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        order_id,
        buyer_name: buyerName,
        buyer_email: buyerEmail,
        buyer_cpf: buyerCpf ?? undefined,
        items,
        total,
      }),
    })

    if (!mpRes.ok) {
      const errBody = await mpRes.text()
      console.error('[createOrderAction] API preference error:', errBody)
      return { success: false, error: 'Erro ao iniciar pagamento. Tente novamente.' }
    }

    const { init_point } = await mpRes.json()

    if (!init_point) {
      console.error('[createOrderAction] Resposta da API sem init_point')
      return { success: false, error: 'Erro ao iniciar pagamento. Tente novamente.' }
    }

    // 3. Redireciona para o Mercado Pago
    window.location.href = init_point
    return { success: true, orderId: order_id, paymentMethod: 'mercadopago' }
  } catch (err) {
    console.error('[createOrderAction] Unexpected error:', err)
    return { success: false, error: 'Erro ao processar pagamento. Tente novamente.' }
  }
}
