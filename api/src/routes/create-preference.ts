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

  const webhookBaseUrl = process.env.WEBHOOK_PUBLIC_URL || publicApiUrl
  if (/localhost|127\.0\.0\.1/.test(webhookBaseUrl)) {
    console.warn('[create-preference] AVISO: notification_url aponta pra localhost, MP não conseguirá chamar webhook. Configure WEBHOOK_PUBLIC_URL com URL do ngrok.')
  }
  console.log('[create-preference] notification_url:', `${webhookBaseUrl}/mp-webhook`)

  const appUrl = process.env.APP_URL
  if (!appUrl) {
    console.error('[create-preference] APP_URL não configurada')
    return c.json({ error: 'Configuração do servidor incompleta (APP_URL)' }, 500)
  }
  const isSandbox = process.env.MP_SANDBOX === 'true'
  const isLocalhost = /localhost|127\.0\.0\.1/.test(appUrl)

  if (isLocalhost) {
    console.log('[create-preference] localhost detectado, auto_return desabilitado')
  }

  const preference: MpPreferenceInput = {
    items: items.map((item) => ({
      title: item.title,
      quantity: item.quantity,
      unit_price: item.unit_price, // já em reais (banco usa numeric(10,2))
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
    // auto_return só em produção — MP rejeita com URLs localhost
    ...(isLocalhost ? {} : { auto_return: 'approved' }),
    external_reference: order_id,
    notification_url: `${webhookBaseUrl}/mp-webhook`,
    statement_descriptor: 'ENCONTRO',
    // Preference expira em 30 minutos
    expiration_date_to: new Date(Date.now() + 30 * 60 * 1000).toISOString(),
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
