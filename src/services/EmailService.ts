/**
 * src/services/EmailService.ts
 *
 * Envio de e-mails transacionais via Resend.
 * Retry: 3 tentativas com backoff exponencial (1s / 2s / 4s).
 * Logging: cada tentativa registrada individualmente em email_logs.
 *
 * Os triggers (T094, T095, T096) chamam apenas EmailService.send() —
 * não precisam saber da lógica de retry.
 *
 * TODO TF08: configurar RESEND_API_KEY no .env.local
 */

import { render } from '@react-email/components'
import * as React from 'react'
import { Resend } from 'resend'
import QRCode from 'qrcode'
import { env } from '@/config/env'
import { EmailLogRepository } from '@/repositories/EmailLogRepository'
import { EventConfigRepository } from '@/repositories/EventConfigRepository'
import PaymentApprovedEmail from '@/lib/email/templates/payment-approved'
import PaymentPendingEmail from '@/lib/email/templates/payment-pending'
import PaymentExpiredEmail from '@/lib/email/templates/payment-expired'
import { formatDate } from '@/utils/format'
import type { Order } from '@/repositories/OrderRepository'
import type { EmailTemplate, ServiceResult } from '@/types/email'

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

let _resend: Resend | null = null
function getResend(): Resend {
  if (!_resend) _resend = new Resend(env.RESEND_API_KEY ?? 'placeholder')
  return _resend
}

// ---------------------------------------------------------------------------
// Renderização de templates
// ---------------------------------------------------------------------------

async function renderTemplate(
  template: EmailTemplate,
  order: Order,
  config: Awaited<ReturnType<typeof EventConfigRepository.find>>,
): Promise<{ html: string; subject: string }> {
  const eventName = config?.name ?? 'Evento' // TODO TF03
  const appUrl = env.NEXT_PUBLIC_APP_URL

  switch (template) {
    case 'payment_approved': {
      const html = await render(
        React.createElement(PaymentApprovedEmail, {
          order,
          eventName,
          eventDate: config?.date ? formatDate(config.date) : 'A confirmar', // TODO TF03
          eventLocation: config?.location ?? 'A confirmar', // TODO TF03
          groupLink: config?.group_link ?? undefined,
        }),
      )
      return { html, subject: `✅ Ingresso confirmado — ${eventName}` }
    }

    case 'payment_pending': {
      if (!order.pix_code) throw new Error('Pedido sem pix_code para template payment_pending')

      // Gerar QR Code como base64 no servidor
      const qrCodeBase64 = await QRCode.toDataURL(order.pix_code)

      const expiresAt = order.pix_expires_at
        ? new Date(order.pix_expires_at).toLocaleString('pt-BR')
        : '30 minutos'

      const html = await render(
        React.createElement(PaymentPendingEmail, {
          order,
          eventName,
          qrCodeBase64,
          pixExpiresAt: expiresAt,
        }),
      )
      return { html, subject: `📱 Pague com Pix — ${eventName}` }
    }

    case 'payment_expired': {
      const html = await render(
        React.createElement(PaymentExpiredEmail, {
          order,
          eventName,
          appUrl,
        }),
      )
      return { html, subject: `⏰ Seu Pix expirou — ${eventName}` }
    }
  }
}

// ---------------------------------------------------------------------------
// EmailService
// ---------------------------------------------------------------------------

export const EmailService = {
  /**
   * Envia um e-mail transacional.
   * Retry: até 3 tentativas com backoff 1s/2s/4s.
   * Cada tentativa é registrada individualmente em email_logs.
   */
  async send(
    template: EmailTemplate,
    order: Order,
    attempt = 1,
  ): Promise<ServiceResult<void>> {
    const recipient = order.buyer_email

    // Idempotência: não reenviar se já enviado com sucesso
    const alreadySent = await EmailLogRepository.alreadySent(order.id, template)
    if (alreadySent) {
      return { data: null, error: null }
    }

    try {
      const config = await EventConfigRepository.find()
      const { html, subject } = await renderTemplate(template, order, config)

      await getResend().emails.send({
        from: `${env.RESEND_FROM_NAME} <${env.RESEND_FROM_EMAIL}>`,
        to: [recipient],
        subject,
        html,
      })

      await EmailLogRepository.logSuccess(order.id, template, recipient)
      return { data: null, error: null }

    } catch (err) {
      const message = err instanceof Error ? err.message : 'Erro desconhecido'
      console.error(`[EmailService] attempt ${attempt} failed for ${template}:`, message)

      await EmailLogRepository.logAttempt(order.id, template, recipient, attempt)

      if (attempt >= 3) {
        await EmailLogRepository.logFailed(order.id, template)
        return {
          data: null,
          error: {
            code: 'EMAIL_FAILED',
            message: `Falha ao enviar e-mail após ${attempt} tentativas: ${message}`,
          },
        }
      }

      // Backoff exponencial: 1s, 2s, 4s
      await sleep(1000 * Math.pow(2, attempt - 1))
      return this.send(template, order, attempt + 1)
    }
  },
}
