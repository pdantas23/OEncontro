/**
 * Supabase Edge Function: mp-webhook
 *
 * Recebe notificações IPN do Mercado Pago.
 * Fluxo:
 *   1. Recebe notificação (type: "payment")
 *   2. GET /v1/payments/{id} na API do MP para obter status real
 *   3. Encontra o pedido via external_reference (order_id)
 *   4. Atualiza payment_status e payment_id no pedido
 *   5. Se approved → envia e-mail de confirmação via Resend
 *   6. Se rejected/cancelled → libera vaga via release_ticket_slot RPC
 *
 * Secrets necessários:
 *   - MP_ACCESS_TOKEN
 *   - SUPABASE_URL (auto)
 *   - SUPABASE_SERVICE_ROLE_KEY (auto)
 *   - RESEND_API_KEY
 *   - RESEND_FROM_EMAIL (default: noreply@royalhubacademy.com.br)
 *   - RESEND_FROM_NAME (default: Evento)
 */

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

// Mapeia status do MP para status interno
function mapMpStatus(mpStatus: string): string {
  switch (mpStatus) {
    case 'approved':
      return 'paid'
    case 'pending':
    case 'in_process':
    case 'authorized':
      return 'pending'
    case 'rejected':
      return 'failed'
    case 'cancelled':
      return 'canceled'
    case 'refunded':
    case 'charged_back':
      return 'refunded'
    default:
      return 'pending'
  }
}

Deno.serve(async (req: Request) => {
  // MP envia POST para webhooks
  if (req.method !== 'POST') {
    return new Response('Method not allowed', { status: 405 })
  }

  try {
    const body = await req.json()

    // MP envia diversos tipos de notificação; só processamos "payment"
    if (body.type !== 'payment' && body.action !== 'payment.created' && body.action !== 'payment.updated') {
      return new Response('OK', { status: 200 })
    }

    // Extrai payment ID da notificação
    const paymentId = body.data?.id?.toString()
    if (!paymentId) {
      console.error('[mp-webhook] Notificação sem payment ID:', JSON.stringify(body))
      return new Response('OK', { status: 200 })
    }

    const mpAccessToken = Deno.env.get('MP_ACCESS_TOKEN')
    if (!mpAccessToken) {
      console.error('[mp-webhook] MP_ACCESS_TOKEN não configurado')
      return new Response('Config error', { status: 500 })
    }

    // Consulta o pagamento na API do MP para obter status real
    const mpResponse = await fetch(`https://api.mercadopago.com/v1/payments/${paymentId}`, {
      headers: { Authorization: `Bearer ${mpAccessToken}` },
    })

    if (!mpResponse.ok) {
      console.error('[mp-webhook] Erro ao consultar MP:', mpResponse.status)
      return new Response('MP API error', { status: 502 })
    }

    const payment = await mpResponse.json()
    const orderId = payment.external_reference
    const mpStatus = payment.status as string
    const internalStatus = mapMpStatus(mpStatus)

    if (!orderId) {
      console.error('[mp-webhook] Payment sem external_reference:', paymentId)
      return new Response('OK', { status: 200 })
    }

    // Conecta ao Supabase com service role
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
    )

    // Busca o pedido atual
    const { data: order, error: orderError } = await supabase
      .from('orders_encontro')
      .select('*')
      .eq('id', orderId)
      .maybeSingle()

    if (orderError || !order) {
      console.error('[mp-webhook] Pedido não encontrado:', orderId, orderError?.message)
      return new Response('OK', { status: 200 })
    }

    // Não sobrescreve status terminal
    const terminalStatuses = ['paid', 'refunded']
    if (terminalStatuses.includes(order.payment_status)) {
      return new Response('OK', { status: 200 })
    }

    // Atualiza o pedido
    await supabase
      .from('orders_encontro')
      .update({
        payment_status: internalStatus,
        payment_id: paymentId,
        updated_at: new Date().toISOString(),
      })
      .eq('id', orderId)

    // Se aprovado → envia e-mail de confirmação
    if (internalStatus === 'paid') {
      await sendApprovalEmail(order)
    }

    // Se falhou → libera vaga
    if (internalStatus === 'failed' || internalStatus === 'canceled') {
      const { error: releaseError } = await supabase.rpc('release_ticket_slot', {
        p_lot_id: order.ticket_lot_id,
        p_quantity: order.ticket_quantity,
      })
      if (releaseError) {
        console.error('[mp-webhook] Erro ao liberar vaga:', releaseError.message)
      }
    }

    return new Response('OK', { status: 200 })
  } catch (err) {
    console.error('[mp-webhook] Unexpected error:', err)
    return new Response('Internal error', { status: 500 })
  }
})

// ---------------------------------------------------------------------------
// E-mail de confirmação via Resend
// ---------------------------------------------------------------------------

async function sendApprovalEmail(order: Record<string, unknown>): Promise<void> {
  const resendApiKey = Deno.env.get('RESEND_API_KEY')
  if (!resendApiKey) {
    console.warn('[mp-webhook] RESEND_API_KEY não configurada — e-mail não enviado')
    return
  }

  const fromEmail = Deno.env.get('RESEND_FROM_EMAIL') ?? 'noreply@royalhubacademy.com.br'
  const fromName = Deno.env.get('RESEND_FROM_NAME') ?? 'O Encontro 2026'
  const buyerName = order.buyer_name as string
  const buyerEmail = order.buyer_email as string
  const orderId = (order.id as string).slice(0, 8).toUpperCase()
  const total = Number(order.total)
  const formattedTotal = new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(total)

  const html = `
<!DOCTYPE html>
<html lang="pt-BR">
<head><meta charset="utf-8"></head>
<body style="margin:0;padding:0;background-color:#0D0D0D;font-family:'DM Sans',Helvetica,Arial,sans-serif;">
  <div style="max-width:560px;margin:0 auto;padding:32px 16px;">
    <div style="text-align:center;margin-bottom:24px;">
      <span style="color:#C9A84C;font-size:20px;font-weight:700;letter-spacing:0.05em;">O ENCONTRO 2026</span>
    </div>
    <div style="background-color:#1A1A1A;border-radius:12px;border:1px solid #2A2A2A;padding:32px;">
      <p style="color:#F5F5F5;font-size:32px;text-align:center;margin:0 0 16px 0;">✅</p>
      <h1 style="color:#F5F5F5;font-size:22px;font-weight:700;text-align:center;margin:0 0 8px 0;">Pagamento confirmado!</h1>
      <p style="color:#F5F5F5;font-size:15px;text-align:center;margin:0 0 16px 0;">
        Olá, <strong>${buyerName}</strong>! Sua participação no <strong>O Encontro 2026</strong> está garantida.
      </p>
      <hr style="border-color:#2A2A2A;margin:20px 0;" />
      <p style="color:#888;font-size:11px;font-weight:600;text-transform:uppercase;letter-spacing:0.08em;margin:0 0 4px 0;">Número do pedido</p>
      <p style="color:#F5F5F5;font-size:14px;margin:0 0 12px 0;">#${orderId}</p>
      <p style="color:#888;font-size:11px;font-weight:600;text-transform:uppercase;letter-spacing:0.08em;margin:0 0 4px 0;">Total pago</p>
      <p style="color:#C9A84C;font-size:18px;font-weight:700;margin:0 0 12px 0;">${formattedTotal}</p>
      <hr style="border-color:#2A2A2A;margin:20px 0;" />
      <p style="color:#F5F5F5;font-size:15px;text-align:center;margin:0 0 16px 0;">
        Parabéns pela sua compra! 🎉<br/>
        Sua vaga está garantida. Fique atento ao seu e-mail para receber mais informações sobre o evento.
      </p>
      <p style="color:#888;font-size:13px;text-align:center;margin:0 0 8px 0;">
        Guarde este e-mail como comprovante da sua inscrição.
      </p>
    </div>
    <hr style="border-color:#2A2A2A;margin:24px 0;" />
    <p style="color:#888;font-size:12px;text-align:center;margin:0;">
      Este e-mail foi enviado automaticamente. Em caso de dúvidas, entre em contato pelo WhatsApp de suporte.
    </p>
  </div>
</body>
</html>`

  try {
    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${resendApiKey}`,
      },
      body: JSON.stringify({
        from: `${fromName} <${fromEmail}>`,
        to: [buyerEmail],
        subject: `✅ Pagamento confirmado — O Encontro 2026`,
        html,
      }),
    })

    if (!res.ok) {
      const errText = await res.text()
      console.error('[mp-webhook] Resend error:', res.status, errText)
    } else {
      console.log('[mp-webhook] E-mail de confirmação enviado para', buyerEmail)
    }

    // Log no banco
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
    )
    await supabase.from('email_logs_encontro').insert({
      order_id: order.id as string,
      template: 'payment_approved',
      recipient: buyerEmail,
      status: res.ok ? 'sent' : 'failed',
      attempts: 1,
      last_attempt_at: new Date().toISOString(),
    })
  } catch (err) {
    console.error('[mp-webhook] Falha ao enviar e-mail:', err)
  }
}
