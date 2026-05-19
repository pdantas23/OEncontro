/**
 * src/types/email.ts
 *
 * Tipos do sistema de e-mail transacional.
 */

export type EmailTemplate =
  | 'payment_approved'   // Pix confirmado ou cartão aprovado
  | 'payment_pending'    // Pix gerado — aguardando pagamento
  | 'payment_expired'    // Pix expirado sem pagamento

export interface EmailLog {
  orderId: string
  template: EmailTemplate
  recipient: string
}

export interface ServiceResult<T> {
  data: T | null
  error: { code: string; message: string } | null
}
