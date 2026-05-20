import { Hono } from 'hono'
import { getSupabase } from '../lib/supabase.js'
import { getPayment } from '../lib/mercadopago.js'
import { sendEmail } from '../lib/resend.js'

const app = new Hono()

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

app.post('/', async (c) => {
  try {
    const body = await c.req.json()

    // Só processa notificações de pagamento
    if (body.type !== 'payment' && body.action !== 'payment.created' && body.action !== 'payment.updated') {
      return c.text('OK', 200)
    }

    const paymentId = body.data?.id?.toString()
    if (!paymentId) {
      console.error('[webhook] Notificação sem payment ID:', JSON.stringify(body))
      return c.text('OK', 200)
    }

    // Consulta status real na API do MP
    let payment
    try {
      payment = await getPayment(paymentId)
    } catch (err) {
      console.error('[webhook] Falha ao consultar payment:', paymentId, err)
      return c.text('OK', 200)
    }

    if (!payment) {
      console.warn('[webhook] Payment não encontrado no MP (id: %s)', paymentId)
      return c.text('OK', 200)
    }

    const orderId = payment.external_reference
    const internalStatus = mapMpStatus(payment.status)

    if (!orderId) {
      console.error('[webhook] Payment sem external_reference:', paymentId)
      return c.text('OK', 200)
    }

    const supabase = getSupabase()

    // Busca pedido
    const { data: order, error: orderError } = await supabase
      .from('orders_encontro')
      .select('*')
      .eq('id', orderId)
      .maybeSingle()

    if (orderError || !order) {
      console.error('[webhook] Pedido não encontrado:', orderId, orderError?.message)
      return c.text('OK', 200)
    }

    // Não sobrescreve status terminal
    if (['paid', 'refunded'].includes(order.payment_status)) {
      return c.text('OK', 200)
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

    // Se aprovado → incrementa sold_count + e-mail best-effort
    if (internalStatus === 'paid') {
      // sold_count só é incrementado aqui (no pagamento aprovado),
      // NÃO na criação do pedido. Isso garante que o admin só vê
      // ingressos como vendidos após pagamento real.
      const { error: slotError } = await supabase.rpc('reserve_ticket_slot', {
        p_lot_id: order.ticket_lot_id,
        p_quantity: order.ticket_quantity,
      })
      if (slotError) {
        console.error('[webhook] Erro ao incrementar sold_count:', slotError.message)
      }

      await sendApprovalEmail(order)
    }

    return c.text('OK', 200)
  } catch (err) {
    console.error('[webhook] Unexpected error:', err)
    return c.text('Internal error', 500)
  }
})

// ---------------------------------------------------------------------------
// E-mail de confirmação (best-effort)
// ---------------------------------------------------------------------------

async function sendApprovalEmail(order: Record<string, unknown>): Promise<void> {
  const buyerName = order.buyer_name as string
  const buyerEmail = order.buyer_email as string
  const orderId = (order.id as string).slice(0, 8).toUpperCase()
  const total = Number(order.total)
  const formattedTotal = new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(total)

  const html = `<!DOCTYPE html>
<html lang="pt-BR">
<head><meta charset="utf-8"></head>
<body style="margin:0;padding:0;background-color:#0D0D0D;font-family:'DM Sans',Helvetica,Arial,sans-serif;">
  <div style="max-width:560px;margin:0 auto;padding:32px 16px;">
    <div style="text-align:center;margin-bottom:24px;">
      <span style="color:#C9A84C;font-size:20px;font-weight:700;letter-spacing:0.05em;">O ENCONTRO 2026</span>
    </div>
    <div style="background-color:#1A1A1A;border-radius:12px;border:1px solid #2A2A2A;padding:32px;">
      <p style="color:#F5F5F5;font-size:32px;text-align:center;margin:0 0 16px 0;">&#10004;&#65039;</p>
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
        Parabéns pela sua compra!<br/>
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

  const sent = await sendEmail({
    to: buyerEmail,
    subject: `Pagamento confirmado — O Encontro 2026`,
    html,
  })

  // Log no banco (best-effort)
  try {
    const supabase = getSupabase()
    await supabase.from('email_logs_encontro').insert({
      order_id: order.id as string,
      template: 'payment_approved',
      recipient: buyerEmail,
      status: sent ? 'sent' : 'failed',
      attempts: 1,
      last_attempt_at: new Date().toISOString(),
    })
  } catch (err) {
    console.error('[webhook] Erro ao logar e-mail:', err)
  }
}

export default app
