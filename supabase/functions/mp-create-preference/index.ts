/**
 * Supabase Edge Function: mp-create-preference
 *
 * Recebe dados do pedido e cria uma Preference no Mercado Pago (Checkout Pro).
 * Retorna o init_point (URL de pagamento) para redirect no frontend.
 *
 * Secrets necessários (Supabase Secrets):
 *   - MP_ACCESS_TOKEN
 *   - APP_URL (ex: https://royalhubacademy.com.br/encontro)
 *   - SUPABASE_URL (auto)
 *   - SUPABASE_SERVICE_ROLE_KEY (auto)
 */

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { corsHeaders } from '../_shared/cors.ts'

interface RequestBody {
  order_id: string
  buyer_name: string
  buyer_email: string
  buyer_cpf?: string
  items: Array<{
    title: string
    quantity: number
    unit_price: number // em centavos
  }>
  total: number // em centavos
}

Deno.serve(async (req: Request) => {
  // CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const body: RequestBody = await req.json()
    const { order_id, buyer_name, buyer_email, buyer_cpf, items, total } = body

    if (!order_id || !items?.length || !total) {
      return new Response(
        JSON.stringify({ error: 'Campos obrigatórios: order_id, items, total' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
      )
    }

    const mpAccessToken = Deno.env.get('MP_ACCESS_TOKEN')
    if (!mpAccessToken) {
      console.error('[mp-create-preference] MP_ACCESS_TOKEN não configurado')
      return new Response(
        JSON.stringify({ error: 'Gateway de pagamento não configurado' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
      )
    }

    const appUrl = Deno.env.get('APP_URL') ?? 'http://localhost:3000'

    // Monta a preference do Mercado Pago
    const preference = {
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
      notification_url: `${Deno.env.get('SUPABASE_PUBLIC_URL')}/functions/v1/mp-webhook`,
      statement_descriptor: 'ENCONTRO',
    }

    // Cria a preference na API do Mercado Pago
    const mpResponse = await fetch('https://api.mercadopago.com/checkout/preferences', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${mpAccessToken}`,
      },
      body: JSON.stringify(preference),
    })

    if (!mpResponse.ok) {
      const errorBody = await mpResponse.text()
      console.error('[mp-create-preference] MP API error:', mpResponse.status, errorBody)
      return new Response(
        JSON.stringify({ error: 'Erro ao criar preferência de pagamento' }),
        { status: 502, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
      )
    }

    const mpData = await mpResponse.json()

    // Salva o mp_preference_id no pedido
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
    )

    await supabase
      .from('orders_encontro')
      .update({
        mp_preference_id: mpData.id,
        updated_at: new Date().toISOString(),
      })
      .eq('id', order_id)

    // Determina init_point (sandbox vs produção)
    const isSandbox = Deno.env.get('MP_SANDBOX') === 'true'
    const initPoint = isSandbox ? mpData.sandbox_init_point : mpData.init_point

    return new Response(
      JSON.stringify({
        init_point: initPoint,
        preference_id: mpData.id,
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
    )
  } catch (err) {
    console.error('[mp-create-preference] Unexpected error:', err)
    return new Response(
      JSON.stringify({ error: 'Erro interno no servidor' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
    )
  }
})
