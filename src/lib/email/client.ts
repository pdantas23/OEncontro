/**
 * src/lib/email/client.ts
 *
 * Cliente Resend para envio de e-mails transacionais.
 * Usar sempre via EmailService — nunca importar diretamente nas páginas.
 */

import { Resend } from 'resend'

// Instância singleton do cliente Resend (lazy para evitar erro em build sem API key)
let _resend: Resend | null = null
export function getResendClient(): Resend {
  if (!_resend) _resend = new Resend(process.env.RESEND_API_KEY ?? 'placeholder')
  return _resend
}
/** @deprecated use getResendClient() */
export const resend = { emails: { send: (...args: Parameters<Resend['emails']['send']>) => getResendClient().emails.send(...args) } }

export const emailConfig = {
  from: `${process.env.RESEND_FROM_NAME ?? 'Evento'} <${process.env.RESEND_FROM_EMAIL ?? 'noreply@localhost'}>`,
} as const
