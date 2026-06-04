/**
 * api/src/routes/public.ts
 *
 * Endpoints públicos de leitura para o frontend estático.
 * Dados servidos em runtime (não build time) para refletir
 * mudanças do admin imediatamente.
 *
 * Cache-Control: 30 segundos para CDN/browser (temporário; subir pra 5min quando estável).
 */

import { Hono } from 'hono'
import { getSupabase } from '../lib/supabase.js'
import { computeBumpFinalPrice } from '../lib/bumps.js'

const app = new Hono()

const CACHE_HEADER = 'public, max-age=30, s-maxage=30'

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

// GET /lots/:id/bumps — combos elegíveis de um lote principal
//
// Filtros server-side (frontend é dumb consumer):
//   - active=true na regra do combo
//   - oferecido com status='active'
//   - oferecido com (total_limit - sold_count) > 0
//   - sem overlap de event_days entre principal e oferecido (defesa — Task 7 valida no admin)
//   - final_price > 0 (defesa contra dados ruins legacy)
//
// Shape próximo de SelectedBump (src/types/checkout.ts) — o frontend adapta
// final_price→price e descarta exclusivity_group antes de mandar pro /create-order.
//
// UUID malformado retorna 500 (match com /lots/:id; correção dos dois fica em task dedicada).
app.get('/lots/:id/bumps', async (c) => {
  const id = c.req.param('id')
  const supabase = getSupabase()

  const { data: principal, error: principalError } = await supabase
    .from('ticket_lots_encontro')
    .select('id, status, event_days')
    .eq('id', id)
    .maybeSingle()

  if (principalError) {
    console.error('[public/lots/:id/bumps]', principalError.message)
    return c.json({ data: null, error: principalError.message }, 500)
  }
  if (!principal) {
    console.warn('[public/lots/:id/bumps] lote não encontrado:', id)
    return c.json({ data: null, error: 'Lote não encontrado' }, 404)
  }

  if (principal.status !== 'active') {
    console.info('[public/lots/:id/bumps] principal inativo, devolvendo []:', id)
    c.header('Cache-Control', CACHE_HEADER)
    return c.json({ data: [] })
  }

  const { data: rows, error } = await supabase
    .from('ticket_lot_bumps_encontro')
    .select(
      'id, discount_type, discount_value, display_order, ' +
      'offered:ticket_lots_encontro!ticket_lot_bumps_encontro_offered_lot_id_fkey' +
      '(id, name, description, image_url, price, status, total_limit, sold_count, event_days)',
    )
    .eq('principal_lot_id', id)
    .eq('active', true)
    .order('display_order', { ascending: true })

  if (error) {
    console.error('[public/lots/:id/bumps]', error.message)
    return c.json({ data: [], error: error.message }, 500)
  }

  type Row = {
    id: string
    discount_type: 'percent' | 'fixed' | null
    discount_value: number | null
    display_order: number
    offered: {
      id: string
      name: string
      description: string | null
      image_url: string | null
      price: number
      status: string
      total_limit: number
      sold_count: number
      event_days: number[] | null
    } | null
  }

  type EligibleBump = {
    id: string
    type: 'ticket_lot'
    ticket_lot_id: string
    name: string
    description: string | null
    image_url: string | null
    event_days: number[] | null
    original_price: number
    final_price: number
    discount: { type: 'percent' | 'fixed'; value: number; label: string } | null
    display_order: number
    available: number
  }
  const eligible: EligibleBump[] = []

  for (const row of (rows ?? []) as unknown as Row[]) {
    const offered = row.offered
    if (!offered) continue
    if (offered.id === principal.id) continue
    if (offered.status !== 'active') continue

    const available = offered.total_limit - offered.sold_count
    if (available <= 0) continue

    if (principal.event_days == null || offered.event_days == null) {
      // LotForm permite salvar lote com event_days null — sem dias, não dá pra validar
      // sobreposição. Descarta com log; admin precisa preencher event_days no(s) lote(s).
      console.warn(
        `[public/lots/:id/bumps] bump descartado por event_days null (combo=${row.id}, ` +
        `offered=${offered.id}, principal=${principal.id})`,
      )
      continue
    }
    const overlap = (principal.event_days as number[]).filter((d: number) => offered.event_days!.includes(d))
    if (overlap.length > 0) continue

    const originalPrice = offered.price
    const { finalPrice, discount } = computeBumpFinalPrice(
      originalPrice,
      row.discount_type,
      row.discount_value,
    )

    if (finalPrice <= 0) continue

    eligible.push({
      id: row.id,
      type: 'ticket_lot',
      ticket_lot_id: offered.id,
      name: offered.name,
      description: offered.description,
      image_url: offered.image_url,
      event_days: offered.event_days,
      original_price: originalPrice,
      final_price: finalPrice,
      discount,
      display_order: row.display_order,
      available,
    })
  }

  // exclusivity_group: union-find sobre bumps cujos event_days têm intersecção.
  // Bumps com event_days null não participam — cada um vira grupo próprio.
  const n = eligible.length
  const parent = Array.from({ length: n }, (_, i) => i)
  const find = (x: number): number => (parent[x] === x ? x : (parent[x] = find(parent[x])))
  const union = (a: number, b: number) => {
    const ra = find(a)
    const rb = find(b)
    if (ra !== rb) parent[ra] = rb
  }

  for (let i = 0; i < n; i++) {
    for (let j = i + 1; j < n; j++) {
      const di = eligible[i].event_days
      const dj = eligible[j].event_days
      if (!di || !dj) continue
      if (di.some((d) => dj.includes(d))) union(i, j)
    }
  }

  const componentDays = new Map<number, Set<number>>()
  for (let i = 0; i < n; i++) {
    const days = eligible[i].event_days
    if (!days || days.length === 0) continue
    const root = find(i)
    if (!componentDays.has(root)) componentDays.set(root, new Set())
    days.forEach((d) => componentDays.get(root)!.add(d))
  }

  const bumps = eligible.map((b, i) => {
    let exclusivityGroup: string
    if (!b.event_days || b.event_days.length === 0) {
      exclusivityGroup = `days:unknown:${b.ticket_lot_id}`
    } else {
      const days = [...componentDays.get(find(i))!].sort((a, x) => a - x)
      exclusivityGroup = `days:${days.join(',')}`
    }
    return { ...b, exclusivity_group: exclusivityGroup }
  })

  c.header('Cache-Control', CACHE_HEADER)
  return c.json({ data: bumps })
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
    .order('start_time', { ascending: true })
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
