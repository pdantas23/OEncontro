// Client-side — sem 'use server'
import { createClient } from '@/lib/supabase/client'
import { z } from 'zod'

const lotSchema = z.object({
  name: z.string().min(1, 'Nome obrigatório').max(120),
  description: z.string().optional().nullable(),
  label: z.preprocess((v) => (v === '' ? null : v), z.string().max(60).nullable().default(null)),
  price: z.coerce.number().min(0, 'Preço inválido'),
  total_limit: z.coerce.number().int().min(1).default(99999),
  status: z.enum(['active', 'inactive', 'sold_out']),
  display_order: z.coerce.number().int().min(0).default(0),
  event_days: z.array(z.number().int().positive()).nullable().optional(),
})

export async function createLotAction(formData: unknown) {
  const parsed = lotSchema.safeParse(formData)
  if (!parsed.success) return { success: false as const, error: 'Dados inválidos' }

  const supabase = createClient()
  const { data, error } = await supabase
    .from('ticket_lots_encontro')
    .insert({ ...parsed.data, sold_count: 0 })
    .select()
    .single()

  if (error || !data) return { success: false as const, error: 'Erro ao criar lote' }
  return { success: true as const, id: data.id }
}

export async function updateLotAction(id: string, formData: unknown) {
  const parsed = lotSchema.safeParse(formData)
  if (!parsed.success) return { success: false as const, error: 'Dados inválidos' }

  const supabase = createClient()

  // Cross-table: bloqueia mudanças que invalidariam combos existentes
  const { data: current } = await supabase
    .from('ticket_lots_encontro')
    .select('price, event_days')
    .eq('id', id)
    .single()

  if (current) {
    if (current.price !== parsed.data.price) {
      const priceErr = await validateLotPriceChange(supabase, id, parsed.data.price)
      if (priceErr) return { success: false as const, error: priceErr }
    }
    if (!sameEventDays(current.event_days, parsed.data.event_days ?? null)) {
      const daysErr = await validateLotEventDaysChange(supabase, id, parsed.data.event_days ?? null)
      if (daysErr) return { success: false as const, error: daysErr }
    }
  }

  const { error } = await supabase
    .from('ticket_lots_encontro')
    .update({ ...parsed.data })
    .eq('id', id)

  if (error) return { success: false as const, error: 'Erro ao atualizar lote' }
  return { success: true as const }
}

function sameEventDays(a: number[] | null, b: number[] | null): boolean {
  const aa = a ?? []
  const bb = b ?? []
  if (aa.length !== bb.length) return false
  const sa = [...aa].sort((x, y) => x - y)
  const sb = [...bb].sort((x, y) => x - y)
  return sa.every((v, i) => v === sb[i])
}

async function validateLotPriceChange(
  supabase: ReturnType<typeof createClient>,
  lotId: string,
  newPrice: number,
): Promise<string | null> {
  const { data: combos } = await supabase
    .from('ticket_lot_bumps_encontro')
    .select(
      'id, discount_value, principal:ticket_lots_encontro!ticket_lot_bumps_encontro_principal_lot_id_fkey(name), offered:ticket_lots_encontro!ticket_lot_bumps_encontro_offered_lot_id_fkey(name)',
    )
    .eq('offered_lot_id', lotId)
    .eq('discount_type', 'fixed')
  if (!combos || combos.length === 0) return null
  type Row = { discount_value: number | null; principal: { name: string } | null; offered: { name: string } | null }
  const invalid = (combos as unknown as Row[]).filter((c) => c.discount_value != null && c.discount_value >= newPrice)
  if (invalid.length === 0) return null
  const list = invalid
    .map((c) => `• "${c.principal?.name ?? '?'}" → "${c.offered?.name ?? '?'}" (desconto fixo R$ ${c.discount_value!.toFixed(2)})`)
    .join('\n')
  return `Esta mudança de preço invalidaria ${invalid.length} combo(s):\n${list}\n\nNovo preço R$ ${newPrice.toFixed(2)} é menor ou igual ao desconto fixo aplicado.\nAjuste ou desative esses combos em /admin/combos antes de salvar.`
}

async function validateLotEventDaysChange(
  supabase: ReturnType<typeof createClient>,
  lotId: string,
  newDays: number[] | null,
): Promise<string | null> {
  const { data: combos } = await supabase
    .from('ticket_lot_bumps_encontro')
    .select(
      'id, principal_lot_id, offered_lot_id, principal:ticket_lots_encontro!ticket_lot_bumps_encontro_principal_lot_id_fkey(name, event_days), offered:ticket_lots_encontro!ticket_lot_bumps_encontro_offered_lot_id_fkey(name, event_days)',
    )
    .or(`principal_lot_id.eq.${lotId},offered_lot_id.eq.${lotId}`)
  if (!combos || combos.length === 0) return null
  type Row = {
    principal_lot_id: string
    offered_lot_id: string
    principal: { name: string; event_days: number[] | null } | null
    offered: { name: string; event_days: number[] | null } | null
  }
  const invalid: string[] = []
  for (const c of combos as unknown as Row[]) {
    const otherDays = c.principal_lot_id === lotId ? c.offered?.event_days : c.principal?.event_days
    if (!newDays || !otherDays) continue
    const overlap = newDays.filter((d) => otherDays.includes(d))
    if (overlap.length > 0) {
      invalid.push(`• "${c.principal?.name ?? '?'}" → "${c.offered?.name ?? '?'}" (overlap em: ${overlap.join(', ')})`)
    }
  }
  if (invalid.length === 0) return null
  return `Esta mudança de dias do evento invalidaria ${invalid.length} combo(s):\n${invalid.join('\n')}\n\nCombos só fazem sentido entre lotes que não compartilham dias.\nAjuste ou desative esses combos em /admin/combos antes de salvar.`
}

/** Remove todos os arquivos do lote no bucket */
async function cleanupLotImage(supabase: ReturnType<typeof createClient>, lotId: string) {
  const { data: files } = await supabase.storage.from('ticket-lots').list('', { search: lotId })
  if (files && files.length > 0) {
    await supabase.storage.from('ticket-lots').remove(files.map((f) => f.name))
  }
}

export async function reorderLotsAction(items: Array<{ id: string; display_order: number }>) {
  const supabase = createClient()
  await Promise.all(
    items.map(({ id, display_order }) =>
      supabase.from('ticket_lots_encontro').update({ display_order }).eq('id', id),
    ),
  )
  return { success: true as const }
}

export async function deleteLotAction(id: string) {
  const supabase = createClient()

  // Cross-table: pre-check de combos onde este lote é offered (FK RESTRICT do DB
  // já bloquearia, mas dá erro friendly antes em vez de mensagem genérica do Postgres)
  const { data: refCombos } = await supabase
    .from('ticket_lot_bumps_encontro')
    .select(
      'id, principal:ticket_lots_encontro!ticket_lot_bumps_encontro_principal_lot_id_fkey(name), offered:ticket_lots_encontro!ticket_lot_bumps_encontro_offered_lot_id_fkey(name)',
    )
    .eq('offered_lot_id', id)
  if (refCombos && refCombos.length > 0) {
    type Row = { principal: { name: string } | null; offered: { name: string } | null }
    const list = (refCombos as unknown as Row[])
      .map((c) => `• "${c.principal?.name ?? '?'}" → "${c.offered?.name ?? '?'}"`)
      .join('\n')
    return {
      success: false as const,
      error: `Este lote é oferecido em ${refCombos.length} combo(s):\n${list}\n\nRemova ou ajuste esses combos em /admin/combos antes de excluir o lote.`,
    }
  }

  await cleanupLotImage(supabase, id)
  const { error } = await supabase.from('ticket_lots_encontro').delete().eq('id', id)
  if (error) {
    console.error('[deleteLotAction]', error.message, error.code, error.details)
    return { success: false as const, error: error.message }
  }
  return { success: true as const }
}

export async function removeLotImageAction(lotId: string) {
  const supabase = createClient()
  await cleanupLotImage(supabase, lotId)
  const { error } = await supabase
    .from('ticket_lots_encontro')
    .update({ image_url: null })
    .eq('id', lotId)
  if (error) return { success: false as const, error: 'Erro ao remover imagem' }
  return { success: true as const }
}

export async function uploadLotImageAction(
  lotId: string,
  file: File,
): Promise<{ success: true; url: string } | { success: false; error: string }> {
  if (!file || file.size === 0) return { success: false, error: 'Arquivo inválido' }
  if (file.size > 5 * 1024 * 1024) return { success: false, error: 'Imagem maior que 5MB' }
  if (!file.type.startsWith('image/')) return { success: false, error: 'Apenas imagens permitidas' }

  const supabase = createClient()
  // Limpar imagem anterior
  await cleanupLotImage(supabase, lotId)

  const ext = file.name.split('.').pop() ?? 'jpg'
  const path = `${lotId}.${ext}`

  const { error: uploadError } = await supabase.storage
    .from('ticket-lots')
    .upload(path, file, { upsert: true })

  if (uploadError) return { success: false, error: uploadError.message }

  const { data } = supabase.storage.from('ticket-lots').getPublicUrl(path)

  await supabase
    .from('ticket_lots_encontro')
    .update({ image_url: data.publicUrl })
    .eq('id', lotId)

  return { success: true, url: data.publicUrl }
}
