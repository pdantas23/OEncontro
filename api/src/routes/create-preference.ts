import { Hono } from 'hono'
import { z } from 'zod'
import { getSupabase } from '../lib/supabase.js'
import { createPreference, type MpPreferenceInput } from '../lib/mercadopago.js'

const app = new Hono()

const bodySchema = z.object({
  order_id: z.string().uuid(),
  buyer_name: z.string().min(1),
  buyer_email: z.string().email(),
  buyer_cpf: z.string().optional(),
  items: z.array(z.object({
    title: z.string(),
    quantity: z.number().int().positive(),
    unit_price: z.number().positive(), // centavos
  })).min(1),
  total: z.number().positive(), // centavos
})

app.post('/', async (c) => {
  const parsed = bodySchema.safeParse(await c.req.json())
  if (!parsed.success) {
    return c.json({ error: 'Payload inválido', details: parsed.error.flatten() }, 400)
  }

  const { order_id, buyer_name, buyer_email, buyer_cpf, items, total } = parsed.data

  const publicApiUrl = process.env.PUBLIC_API_URL
  if (!publicApiUrl) {
    console.error('[create-preference] PUBLIC_API_URL não configurada')
    return c.json({ error: 'Configuração do servidor incompleta' }, 500)
  }

  const appUrl = process.env.APP_URL || 'https://royalhubacademy.com/encontro'
  if (!process.env.APP_URL) {
    console.warn('[create-preference] APP_URL não definida, usando fallback: %s', appUrl)
  }
  const isSandbox = process.env.MP_SANDBOX === 'true'

  const preference: MpPreferenceInput = {
    items: items.map((item) => ({
      title: item.title,
      quantity: item.quantity,
      unit_price: item.unit_price / 100, // MP espera em reais (decimal)
      currency_id: 'BRL',
    })),
    payer: {
      name: buyer_name,
      email: buyer_email,
      ...(buyer_cpf ? { identification: { type: 'CPF', number: buyer_cpf } } : {}),
    },
    back_urls: {
      success: `${appUrl}/obrigado?order_id=${order_id}`,
      failure: `${appUrl}/obrigado?order_id=${order_id}`,
      pending: `${appUrl}/obrigado?order_id=${order_id}`,
    },
    auto_return: 'approved',
    external_reference: order_id,
    notification_url: `${publicApiUrl}/mp-webhook`,
    statement_descriptor: 'ENCONTRO',
  }

  // TODO: remover logs temporários após validação
  console.log('[create-preference] payload completo:', JSON.stringify(preference, null, 2))
  console.log('[create-preference] APP_URL env:', process.env.APP_URL)
  console.log('[create-preference] appUrl computado:', appUrl)

  try {
    const mpData = await createPreference(preference)

    // Salva mp_preference_id no pedido
    const supabase = getSupabase()
    await supabase
      .from('orders_encontro')
      .update({
        mp_preference_id: mpData.id,
        updated_at: new Date().toISOString(),
      })
      .eq('id', order_id)

    const initPoint = isSandbox ? mpData.sandbox_init_point : mpData.init_point

    return c.json({ init_point: initPoint, preference_id: mpData.id })
  } catch (err) {
    console.error('[create-preference] Erro:', err)
    return c.json({ error: 'Erro ao criar preferência de pagamento' }, 502)
  }
})

export default app
