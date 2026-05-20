/**
 * api/src/routes/public.ts
 *
 * Endpoints públicos de leitura para o frontend estático.
 * Dados servidos em runtime (não build time) para refletir
 * mudanças do admin imediatamente.
 *
 * Cache-Control: 5 minutos para CDN/browser.
 */

import { Hono } from 'hono'
import { getSupabase } from '../lib/supabase.js'

const app = new Hono()

const CACHE_HEADER = 'public, max-age=300, s-maxage=300'

// GET /lots — lotes ativos
app.get('/lots', async (c) => {
  const supabase = getSupabase()
  const { data, error } = await supabase
    .from('ticket_lots_encontro')
    .select('*')
    .eq('status', 'active')
    .order('display_order', { ascending: true })

  if (error) {
    console.error('[public/lots]', error.message)
    return c.json({ data: [], error: error.message }, 500)
  }

  c.header('Cache-Control', CACHE_HEADER)
  return c.json({ data: data ?? [] })
})

// GET /lots/:id — detalhes de um lote
app.get('/lots/:id', async (c) => {
  const id = c.req.param('id')
  const supabase = getSupabase()
  const { data, error } = await supabase
    .from('ticket_lots_encontro')
    .select('*')
    .eq('id', id)
    .maybeSingle()

  if (error) {
    console.error('[public/lots/:id]', error.message)
    return c.json({ data: null, error: error.message }, 500)
  }
  if (!data) {
    return c.json({ data: null, error: 'Lote não encontrado' }, 404)
  }

  c.header('Cache-Control', CACHE_HEADER)
  return c.json({ data })
})

// GET /order-bumps — order bumps ativos
app.get('/order-bumps', async (c) => {
  const supabase = getSupabase()
  const { data, error } = await supabase
    .from('order_bumps_encontro')
    .select('*')
    .eq('active', true)
    .order('display_order', { ascending: true })

  if (error) {
    console.error('[public/order-bumps]', error.message)
    return c.json({ data: [], error: error.message }, 500)
  }

  c.header('Cache-Control', CACHE_HEADER)
  return c.json({ data: data ?? [] })
})

// GET /speakers — palestrantes
app.get('/speakers', async (c) => {
  const supabase = getSupabase()
  const { data, error } = await supabase
    .from('speakers_encontro')
    .select('*')
    .order('display_order', { ascending: true })

  if (error) {
    console.error('[public/speakers]', error.message)
    return c.json({ data: [], error: error.message }, 500)
  }

  c.header('Cache-Control', CACHE_HEADER)
  return c.json({ data: data ?? [] })
})

// GET /schedule — programação com speaker join
app.get('/schedule', async (c) => {
  const supabase = getSupabase()
  const { data, error } = await supabase
    .from('schedule_encontro')
    .select('*, speaker:speakers_encontro(*)')
    .order('day', { ascending: true })
    .order('display_order', { ascending: true })

  if (error) {
    console.error('[public/schedule]', error.message)
    return c.json({ data: [], error: error.message }, 500)
  }

  c.header('Cache-Control', CACHE_HEADER)
  return c.json({ data: data ?? [] })
})

// GET /event-config — configuração do evento
app.get('/event-config', async (c) => {
  const supabase = getSupabase()
  const { data, error } = await supabase
    .from('event_config_encontro')
    .select('*')
    .maybeSingle()

  if (error) {
    console.error('[public/event-config]', error.message)
    return c.json({ data: null, error: error.message }, 500)
  }

  c.header('Cache-Control', CACHE_HEADER)
  return c.json({ data })
})

export default app
