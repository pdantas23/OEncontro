// Client-side — sem 'use server'
import { createClient } from '@/lib/supabase/client'
import { z } from 'zod'

const bumpSchema = z.object({
  name: z.string().min(1, 'Nome obrigatório').max(120),
  description: z.string().optional().nullable(),
  price: z.coerce.number().min(0, 'Preço inválido'),
  has_sizes: z.enum(['true', 'false']).transform((v) => v === 'true'),
  active: z.enum(['true', 'false']).transform((v) => v === 'true'),
  display_order: z.coerce.number().int().min(0).default(0),
})

export async function createBumpAction(formData: unknown) {
  const parsed = bumpSchema.safeParse(formData)
  if (!parsed.success) return { success: false as const, error: 'Dados inválidos' }

  const supabase = createClient()
  const { data, error } = await supabase
    .from('order_bumps_encontro')
    .insert({ ...parsed.data, sold_count: 0 })
    .select()
    .single()

  if (error || !data) return { success: false as const, error: 'Erro ao criar produto' }
  return { success: true as const, id: data.id as string }
}

export async function updateBumpAction(id: string, formData: unknown) {
  const parsed = bumpSchema.safeParse(formData)
  if (!parsed.success) return { success: false as const, error: 'Dados inválidos' }

  const supabase = createClient()
  const { error } = await supabase
    .from('order_bumps_encontro')
    .update({ ...parsed.data })
    .eq('id', id)

  if (error) return { success: false as const, error: 'Erro ao atualizar produto' }
  return { success: true as const }
}

/** Remove todos os arquivos do bump no bucket */
async function cleanupBumpImage(supabase: ReturnType<typeof createClient>, bumpId: string) {
  const { data: files } = await supabase.storage.from('order-bumps').list('', { search: bumpId })
  if (files && files.length > 0) {
    await supabase.storage.from('order-bumps').remove(files.map((f) => f.name))
  }
}

export async function deleteBumpAction(id: string) {
  const supabase = createClient()
  await cleanupBumpImage(supabase, id)
  const { error } = await supabase.from('order_bumps_encontro').delete().eq('id', id)
  if (error) return { success: false as const, error: 'Erro ao excluir produto' }
  return { success: true as const }
}

export async function removeBumpImageAction(bumpId: string) {
  const supabase = createClient()
  await cleanupBumpImage(supabase, bumpId)
  const { error } = await supabase
    .from('order_bumps_encontro')
    .update({ image_url: null })
    .eq('id', bumpId)
  if (error) return { success: false as const, error: 'Erro ao remover imagem' }
  return { success: true as const }
}

export async function uploadBumpImageAction(
  bumpId: string,
  file: File,
): Promise<{ success: true; url: string } | { success: false; error: string }> {
  if (!file || file.size === 0) return { success: false, error: 'Arquivo inválido' }
  if (file.size > 5 * 1024 * 1024) return { success: false, error: 'Imagem maior que 5MB' }
  if (!file.type.startsWith('image/')) return { success: false, error: 'Apenas imagens permitidas' }

  const supabase = createClient()
  // Limpar imagem anterior (pode ter extensão diferente)
  await cleanupBumpImage(supabase, bumpId)

  const ext = file.name.split('.').pop() ?? 'jpg'
  const path = `${bumpId}.${ext}`

  const { error: uploadError } = await supabase.storage
    .from('order-bumps')
    .upload(path, file, { upsert: true })

  if (uploadError) return { success: false, error: uploadError.message }

  const { data } = supabase.storage.from('order-bumps').getPublicUrl(path)

  await supabase
    .from('order_bumps_encontro')
    .update({ image_url: data.publicUrl })
    .eq('id', bumpId)

  return { success: true, url: data.publicUrl }
}
