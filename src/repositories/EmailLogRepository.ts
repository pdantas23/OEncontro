/**
 * src/repositories/EmailLogRepository.ts
 *
 * Acesso à tabela email_logs.
 * Registra cada tentativa de envio individualmente para diagnóstico.
 */

import { createClient } from '@/lib/supabase/server'
import type { Database } from '@/types/database'
import type { EmailTemplate } from '@/types/email'

export type EmailLog = Database['public']['Tables']['email_logs_encontro']['Row']

export const EmailLogRepository = {
  /** Registra uma tentativa de envio */
  async logAttempt(
    orderId: string,
    template: EmailTemplate,
    recipient: string,
    attempt: number,
  ): Promise<void> {
    const supabase = await createClient()

    // Upsert: cria ou incrementa attempts
    const { data: existing } = await supabase
      .from('email_logs_encontro')
      .select('id, attempts')
      .eq('order_id', orderId)
      .eq('template', template)
      .maybeSingle()

    if (existing) {
      await supabase
        .from('email_logs_encontro')
        .update({
          attempts: attempt,
          last_attempt_at: new Date().toISOString(),
          status: 'retrying',
        })
        .eq('id', existing.id)
    } else {
      await supabase.from('email_logs_encontro').insert({
        order_id: orderId,
        template,
        recipient,
        status: 'pending',
        attempts: attempt,
        last_attempt_at: new Date().toISOString(),
      })
    }
  },

  /** Marca como enviado com sucesso */
  async logSuccess(
    orderId: string,
    template: EmailTemplate,
    recipient: string,
  ): Promise<void> {
    const supabase = await createClient()

    const { data: existing } = await supabase
      .from('email_logs_encontro')
      .select('id')
      .eq('order_id', orderId)
      .eq('template', template)
      .maybeSingle()

    if (existing) {
      await supabase
        .from('email_logs_encontro')
        .update({ status: 'sent', last_attempt_at: new Date().toISOString() })
        .eq('id', existing.id)
    } else {
      await supabase.from('email_logs_encontro').insert({
        order_id: orderId,
        template,
        recipient,
        status: 'sent',
        attempts: 1,
        last_attempt_at: new Date().toISOString(),
      })
    }
  },

  /** Marca como falha definitiva (todas as tentativas esgotadas) */
  async logFailed(
    orderId: string,
    template: EmailTemplate,
  ): Promise<void> {
    const supabase = await createClient()

    await supabase
      .from('email_logs_encontro')
      .update({ status: 'failed', last_attempt_at: new Date().toISOString() })
      .eq('order_id', orderId)
      .eq('template', template)
  },

  /** Verifica se já enviou este template para este pedido */
  async alreadySent(orderId: string, template: EmailTemplate): Promise<boolean> {
    const supabase = await createClient()

    const { data } = await supabase
      .from('email_logs_encontro')
      .select('id')
      .eq('order_id', orderId)
      .eq('template', template)
      .eq('status', 'sent')
      .maybeSingle()

    return !!data
  },
}
