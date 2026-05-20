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
  const { error } = await supabase
    .from('order_bumps_encontro')
    .insert({ ...parsed.data, sold_count: 0 })

  if (error) return { success: false as const, error: 'Erro ao criar produto' }
  return { success: true as const }
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

export async function deleteBumpAction(id: string) {
  const supabase = createClient()
  const { error } = await supabase.from('order_bumps_encontro').delete().eq('id', id)
  if (error) return { success: false as const, error: 'Erro ao excluir produto' }
  return { success: true as const }
}
