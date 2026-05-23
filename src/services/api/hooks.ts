/**
 * src/services/api/hooks.ts
 *
 * Hooks React para consumir a API Hono em runtime.
 * Substituem os Server Component repositories que buscavam
 * dados em build time.
 */

'use client'

import { useState, useEffect } from 'react'
import { apiFetch } from './client'
import type { TicketLot } from '@/repositories/TicketLotRepository'
import type { OrderBump } from '@/repositories/OrderBumpRepository'
import type { EligibleBump } from '@/types/bumps'

// Tipo genérico para o estado do hook
interface UseApiState<T> {
  data: T
  loading: boolean
  error: string | null
}

/**
 * Variante condicional: aceita path null/'' e mantém loading=true até
 * receber path válido. Previne flash de empty state durante resolução
 * assíncrona de parâmetros (ex: lotId vindo de useSearchParams).
 */
function useApiConditional<T>(path: string | null, fallback: T): UseApiState<T> {
  const [data, setData] = useState<T>(fallback)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!path) return // mantém loading=true; outro render com path válido dispara fetch
    let cancelled = false

    apiFetch<T>(path)
      .then((result) => {
        if (!cancelled) {
          setData(result)
          setLoading(false)
        }
      })
      .catch((err) => {
        if (!cancelled) {
          console.error(`[useApiConditional] ${path}:`, err)
          setError(err instanceof Error ? err.message : 'Erro desconhecido')
          setLoading(false)
        }
      })

    return () => { cancelled = true }
  }, [path])

  return { data, loading, error }
}

function useApi<T>(path: string, fallback: T): UseApiState<T> {
  const [data, setData] = useState<T>(fallback)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false

    apiFetch<T>(path)
      .then((result) => {
        if (!cancelled) {
          setData(result)
          setLoading(false)
        }
      })
      .catch((err) => {
        if (!cancelled) {
          console.error(`[useApi] ${path}:`, err)
          setError(err instanceof Error ? err.message : 'Erro desconhecido')
          setLoading(false)
        }
      })

    return () => { cancelled = true }
  }, [path])

  return { data, loading, error }
}

// ---------------------------------------------------------------------------
// Hooks específicos
// ---------------------------------------------------------------------------

export function useLots() {
  return useApi<TicketLot[]>('/lots', [])
}

export function useLot(id: string) {
  return useApi<TicketLot | null>(`/lots/${id}`, null)
}

export function useOrderBumps() {
  return useApi<OrderBump[]>('/order-bumps', [])
}

export function useLotBumps(lotId: string | null) {
  return useApiConditional<EligibleBump[]>(lotId ? `/lots/${lotId}/bumps` : null, [])
}

// Tipos inline para dados que não têm type export pronto
interface Speaker {
  id: string
  name: string
  role: string | null
  bio: string | null
  photo_url: string | null
  social_links: Record<string, unknown> | null
  display_order: number
  created_at: string
  updated_at: string
}

interface ScheduleItem {
  id: string
  day: number
  start_time: string
  end_time: string | null
  talk_title: string
  speaker_id: string | null
  description: string | null
  display_order: number
  created_at: string
  updated_at: string
  speaker: Speaker | null
}

interface EventConfig {
  id: string
  name: string | null
  date: string | null
  location: string | null
  description: string | null
  group_link: string | null
  whatsapp_support: string | null
  total_ticket_limit: number | null
  low_stock_threshold: number
  sale_status: string
  meta_pixel_id: string | null
  gtm_id: string | null
  google_ads_id: string | null
  updated_at: string | null
}

export function useSpeakers() {
  return useApi<Speaker[]>('/speakers', [])
}

export function useSchedule() {
  return useApi<ScheduleItem[]>('/schedule', [])
}

export function useEventConfig() {
  return useApi<EventConfig | null>('/event-config', null)
}

export type { Speaker, ScheduleItem, EventConfig }
