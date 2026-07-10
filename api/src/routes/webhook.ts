import { createHmac, timingSafeEqual } from 'node:crypto'
import { Hono } from 'hono'
import { getSupabase } from '../lib/supabase.js'
import { getPayment } from '../lib/mercadopago.js'
import { sendEmail } from '../lib/resend.js'
import { buildApprovalHtml } from '../lib/email-templates.js'

const app = new Hono()

// ---------------------------------------------------------------------------
// Validação de assinatura HMAC-SHA256 do Mercado Pago
// ---------------------------------------------------------------------------

function verifySignature(
  c: { req: { header: (name: string) => string | undefined } },
  body: Record<string, unknown>,
): { valid: boolean; reason?: string } {
  const secret = process.env.PAYMENT_WEBHOOK_SECRET

  if (!secret) {
    console.warn('[mp-webhook] PAYMENT_WEBHOOK_SECRET não configurado, pulando validação (modo dev)')
    return { valid: true }
  }

  const signature = c.req.header('x-signature')
  const requestId = c.req.header('x-request-id')

  if (!signature || !requestId) {
    return { valid: false, reason: 'headers x-signature ou x-request-id ausentes' }
  }

  // Parse "ts=123,v1=abc..."
  const parts: Record<string, string> = {}
  for (const segment of signature.split(',')) {
    const eq = segment.indexOf('=')
    if (eq > 0) {
      parts[segment.slice(0, eq).trim()] = segment.slice(eq + 1).trim()
    }
  }

  const ts = parts.ts
  const v1 = parts.v1
  const dataId = (body.data as Record<string, unknown>)?.id

  if (!ts || !v1 || !dataId) {
    return { valid: false, reason: 'partes da assinatura incompletas (ts, v1 ou data.id ausentes)' }
  }

  const manifest = `id:${dataId};request-id:${requestId};ts:${ts};`
  const computed = createHmac('sha256', secret).update(manifest).digest('hex')

  try {
    const a = Buffer.from(computed, 'hex')
    const b = Buffer.from(String(v1), 'hex')
    if (a.length !== b.length || !timingSafeEqual(a, b)) {
      return { valid: false, reason: 'HMAC não confere' }
    }
  } catch {
    return { valid: false, reason: 'erro ao comparar HMAC' }
  }

  return { valid: true }
}

// ---------------------------------------------------------------------------
// Mapeamento de status MP → interno
// ---------------------------------------------------------------------------

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

// ---------------------------------------------------------------------------
// Handler
// ---------------------------------------------------------------------------

app.post('/', async (c) => {
  try {
    const body = await c.req.json()

    // 1. Validação de assinatura
    const sig = verifySignature(c, body)
    if (!sig.valid) {
      console.error('[mp-webhook] Assinatura inválida:', sig.reason)
      return c.text('Unauthorized', 401)
    }
    if (process.env.PAYMENT_WEBHOOK_SECRET) {
      console.log('[mp-webhook] Assinatura válida')
    }

    // 2. Filtrar apenas eventos de payment
    if (body.type !== 'payment' && body.action !== 'payment.created' && body.action !== 'payment.updated') {
      return c.text('OK', 200)
    }

    const paymentId = body.data?.id?.toString()
    if (!paymentId) {
      console.error('[webhook] Notificação sem payment ID:', JSON.stringify(body))
      return c.text('OK', 200)
    }

    // 3. Consulta status real na API do MP
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

    // 4. Busca pedido
    const { data: order, error: orderError } = await supabase
      .from('orders_encontro')
      .select('*')
      .eq('id', orderId)
      .maybeSingle()

    if (orderError || !order) {
      console.error('[webhook] Pedido não encontrado:', orderId, orderError?.message)
      return c.text('OK', 200)
    }

    // 5. CAS (compare-and-swap) atômico — Task 9.5.
    //
    // O guard "não sobrescrever status terminal" vive DENTRO do WHERE deste
    // UPDATE de propósito — NÃO mover pra cima como if-guard antes do .update().
    // Mover reintroduz a race condition que esta task fechou: dois webhooks
    // concorrentes pro mesmo payment_id ambos passariam o if e ambos chamariam
    // reserve_ticket_slot, incrementando sold_count 2x (principal + combos)
    // e enviando email duplicado (sendApprovalEmail tem janela SELECT-INSERT-
    // UPDATE em que o UNIQUE de email_logs só falha DEPOIS do Resend ter sido
    // chamado). Com o guard no WHERE + .select('id'), só o primeiro webhook
    // reivindica a transição; os demais veem 0 linhas afetadas e saem.
    const { data: claimed, error: updateError } = await supabase
      .from('orders_encontro')
      .update({
        payment_status: internalStatus,
        payment_id: paymentId,
        updated_at: new Date().toISOString(),
      })
      .eq('id', orderId)
      .neq('payment_status', 'paid')
      .neq('payment_status', 'refunded')
      .select('id')

    if (updateError) {
      console.error('[webhook] CAS UPDATE falhou:', orderId, updateError.message)
      return c.text('OK', 200)
    }
    if (!claimed || claimed.length === 0) {
      console.info('[webhook] Idempotente — order já em status terminal', {
        order_id: orderId,
        payment_id: paymentId,
        incoming_status: internalStatus,
      })
      return c.text('OK', 200)
    }

    // 7. Se aprovado → incrementa sold_count (principal + combos) + e-mail idempotente
    //
    // Task 9: reserve_ticket_slot retorna boolean (false = oversell, sem error).
    // Antes desta task o webhook só lia `error` e engolia oversells silenciosamente
    // — para o principal isso era um bug pré-existente; agora marcamos
    // has_inventory_issue=true para qualquer falha (principal ou combo).
    if (internalStatus === 'paid') {
      let inventoryIssue = false

      // 7a. Principal
      const { data: principalOk, error: principalErr } = await supabase.rpc('reserve_ticket_slot', {
        p_lot_id: order.ticket_lot_id,
        p_quantity: order.ticket_quantity,
      })
      if (principalErr) {
        console.error('[webhook] Erro ao incrementar sold_count do principal:', {
          order_id: orderId,
          buyer_email: order.buyer_email,
          ticket_lot_id: order.ticket_lot_id,
          message: principalErr.message,
        })
        inventoryIssue = true
      } else if (principalOk === false) {
        console.error('[webhook] OVERSELL principal — vagas insuficientes no momento do pagamento', {
          order_id: orderId,
          buyer_email: order.buyer_email,
          ticket_lot_id: order.ticket_lot_id,
          quantity: order.ticket_quantity,
        })
        inventoryIssue = true
      }

      // 7b. Combos (ticket_lot bumps) — itera order_bumps com proteção contra jsonb malformado
      const bumpsRaw = order.order_bumps
      if (Array.isArray(bumpsRaw)) {
        for (const item of bumpsRaw) {
          try {
            if (!item || typeof item !== 'object') continue
            const b = item as Record<string, unknown>
            if (b.type !== 'ticket_lot') continue
            const ticketLotId = b.ticket_lot_id
            if (typeof ticketLotId !== 'string') continue

            const { data: comboOk, error: comboErr } = await supabase.rpc('reserve_ticket_slot', {
              p_lot_id: ticketLotId,
              p_quantity: 1,
            })
            if (comboErr) {
              console.error('[webhook] Erro ao incrementar sold_count de combo:', {
                order_id: orderId,
                buyer_email: order.buyer_email,
                combo_id: b.id,
                ticket_lot_id: ticketLotId,
                offered_name: b.name,
                message: comboErr.message,
              })
              inventoryIssue = true
            } else if (comboOk === false) {
              console.error('[webhook] OVERSELL combo bump — vagas esgotaram entre /create-order e webhook', {
                order_id: orderId,
                buyer_email: order.buyer_email,
                combo_id: b.id,
                ticket_lot_id: ticketLotId,
                offered_name: b.name,
              })
              inventoryIssue = true
            }
          } catch (itemErr) {
            console.error('[webhook] Erro inesperado em bump (skip silencioso):', {
              order_id: orderId,
              item,
              error: itemErr instanceof Error ? itemErr.message : String(itemErr),
            })
          }
        }
      }

      // 7c. Marca order pra atenção do operador se houve oversell em qualquer ponto
      if (inventoryIssue) {
        await supabase
          .from('orders_encontro')
          .update({ has_inventory_issue: true })
          .eq('id', orderId)
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
// E-mail de confirmação (best-effort + idempotente)
// ---------------------------------------------------------------------------

async function sendApprovalEmail(order: Record<string, unknown>): Promise<void> {
  const orderId = order.id as string
  const buyerName = order.buyer_name as string
  const buyerEmail = order.buyer_email as string
  const orderShort = orderId.slice(0, 8).toUpperCase()
  const total = Number(order.total)
  const formattedTotal = new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(total)

  const supabase = getSupabase()

  // Idempotência: checa se já foi enviado com sucesso
  const { data: existing } = await supabase
    .from('email_logs_encontro')
    .select('id')
    .eq('order_id', orderId)
    .eq('template', 'payment_approved')
    .eq('status', 'sent')
    .maybeSingle()

  if (existing) {
    console.log('[resend] E-mail já enviado anteriormente para pedido', orderShort)
    return
  }

  // Insere log com status 'pending' como lock (UNIQUE index impede
  // que duas inserções concorrentes passem se a primeira virar 'sent')
  const { data: logEntry, error: insertError } = await supabase
    .from('email_logs_encontro')
    .insert({
      order_id: orderId,
      template: 'payment_approved',
      recipient: buyerEmail,
      status: 'pending',
      attempts: 1,
      last_attempt_at: new Date().toISOString(),
    })
    .select('id')
    .single()

  if (insertError || !logEntry) {
    console.error('[resend] Erro ao criar log de e-mail:', insertError?.message)
    return
  }

  const html = buildApprovalHtml({ buyerName, orderShort, formattedTotal })

  const sent = await sendEmail({
    to: buyerEmail,
    subject: `Pagamento confirmado — O Encontro 2026`,
    html,
  })

  // Atualiza log com resultado
  await supabase
    .from('email_logs_encontro')
    .update({
      status: sent ? 'sent' : 'failed',
      last_attempt_at: new Date().toISOString(),
    })
    .eq('id', logEntry.id)
}

export default app
