/**
 * src/repositories/TrackingEventRepository.ts
 *
 * Acesso à tabela tracking_events.
 * Log server-side de eventos de rastreamento para auditoria e análise.
 * Usado por Server Actions — eventos client-side vão direto ao dataLayer.
 */

import { createClient } from '@/lib/supabase/server'
import type { Database } from '@/types/database'

export type TrackingEvent = Database['public']['Tables']['tracking_events_encontro']['Row']

export const TrackingEventRepository = {
  async log(params: {
    eventName: string
    orderId?: string
    sessionId?: string
    metadata?: Record<string, unknown>
  }): Promise<void> {
    const supabase = await createClient()

    const { error } = await supabase.from('tracking_events_encontro').insert({
      event_name: params.eventName,
      order_id: params.orderId ?? null,
      session_id: params.sessionId ?? null,
      metadata: (params.metadata ?? null) as unknown as import('@/types/database').Json,
    })

    if (error) {
      console.error('[TrackingEventRepository.log]', error.message)
    }
  },
}
