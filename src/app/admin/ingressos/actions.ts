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
  const { error } = await supabase
    .from('ticket_lots_encontro')
    .update({ ...parsed.data })
    .eq('id', id)

  if (error) return { success: false as const, error: 'Erro ao atualizar lote' }
  return { success: true as const }
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
