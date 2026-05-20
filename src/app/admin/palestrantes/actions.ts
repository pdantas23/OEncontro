// Client-side — sem 'use server'
import { createClient } from '@/lib/supabase/client'
import { z } from 'zod'

const speakerSchema = z.object({
  name: z.string().min(1, 'Nome obrigatório').max(120),
  role: z.string().optional().nullable(),
  bio: z.string().optional().nullable(),
  display_order: z.coerce.number().int().min(0),
})

export async function createSpeakerAction(formData: unknown) {
  const parsed = speakerSchema.safeParse(formData)
  if (!parsed.success) return { success: false as const, error: 'Dados inválidos' }

  const supabase = createClient()
  const { data, error } = await supabase
    .from('speakers_encontro')
    .insert({ ...parsed.data, role: parsed.data.role || null, bio: parsed.data.bio || null })
    .select()
    .single()

  if (error || !data) return { success: false as const, error: 'Erro ao criar palestrante' }
  return { success: true as const, id: data.id }
}

export async function updateSpeakerAction(id: string, formData: unknown) {
  const parsed = speakerSchema.safeParse(formData)
  if (!parsed.success) return { success: false as const, error: 'Dados inválidos' }

  const supabase = createClient()
  const { error } = await supabase
    .from('speakers_encontro')
    .update({ ...parsed.data, role: parsed.data.role || null, bio: parsed.data.bio || null })
    .eq('id', id)

  if (error) return { success: false as const, error: 'Erro ao atualizar palestrante' }
  return { success: true as const }
}

export async function deleteSpeakerAction(id: string) {
  const supabase = createClient()

  // Remover foto do storage
  const ext = ['jpg', 'jpeg', 'png', 'webp']
  await Promise.allSettled(ext.map((e) => supabase.storage.from('speakers').remove([`${id}.${e}`])))

  const { error } = await supabase.from('speakers_encontro').delete().eq('id', id)
  if (error) return { success: false as const, error: 'Erro ao excluir palestrante' }
  return { success: true as const }
}

export async function reorderSpeakersAction(items: Array<{ id: string; display_order: number }>) {
  const supabase = createClient()
  await Promise.all(
    items.map(({ id, display_order }) =>
      supabase.from('speakers_encontro').update({ display_order }).eq('id', id),
    ),
  )
  return { success: true as const }
}

export async function uploadSpeakerPhotoAction(
  speakerId: string,
  formData: FormData,
): Promise<{ success: true; url: string } | { success: false; error: string }> {
  const file = formData.get('photo') as File | null
  if (!file || file.size === 0) return { success: false, error: 'Arquivo inválido' }
  if (file.size > 5 * 1024 * 1024) return { success: false, error: 'Imagem maior que 5MB' }
  if (!file.type.startsWith('image/')) return { success: false, error: 'Apenas imagens permitidas' }

  const supabase = createClient()
  const ext = file.name.split('.').pop() ?? 'jpg'
  const path = `${speakerId}.${ext}`

  const { error: uploadError } = await supabase.storage
    .from('speakers')
    .upload(path, file, { upsert: true })

  if (uploadError) return { success: false, error: uploadError.message }

  const { data } = supabase.storage.from('speakers').getPublicUrl(path)

  await supabase
    .from('speakers_encontro')
    .update({ photo_url: data.publicUrl })
    .eq('id', speakerId)

  return { success: true, url: data.publicUrl }
}
