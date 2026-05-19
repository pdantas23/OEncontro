// Client-side — sem 'use server'
import { createClient } from '@/lib/supabase/client'
import { z } from 'zod'

const scheduleSchema = z.object({
  day: z.coerce.number().int().min(1),
  start_time: z.string().min(1, 'Horário obrigatório'),
  end_time: z.string().optional().nullable(),
  talk_title: z.string().min(1, 'Título obrigatório').max(200),
  speaker_id: z.string().uuid().optional().nullable(),
  description: z.string().optional().nullable(),
  display_order: z.coerce.number().int().min(0),
})

function clean(data: z.infer<typeof scheduleSchema>) {
  return {
    ...data,
    end_time: data.end_time || null,
    speaker_id: data.speaker_id || null,
    description: data.description || null,
  }
}

export async function createScheduleItemAction(formData: unknown) {
  const parsed = scheduleSchema.safeParse(formData)
  if (!parsed.success) return { success: false as const, error: 'Dados inválidos' }

  const supabase = createClient()
  const { error } = await supabase.from('schedule_encontro').insert(clean(parsed.data))
  if (error) return { success: false as const, error: 'Erro ao criar item' }
  return { success: true as const }
}

export async function updateScheduleItemAction(id: string, formData: unknown) {
  const parsed = scheduleSchema.safeParse(formData)
  if (!parsed.success) return { success: false as const, error: 'Dados inválidos' }

  const supabase = createClient()
  const { error } = await supabase.from('schedule_encontro').update(clean(parsed.data)).eq('id', id)
  if (error) return { success: false as const, error: 'Erro ao atualizar item' }
  return { success: true as const }
}

export async function deleteScheduleItemAction(id: string) {
  const supabase = createClient()
  const { error } = await supabase.from('schedule_encontro').delete().eq('id', id)
  if (error) return { success: false as const, error: 'Erro ao excluir item' }
  return { success: true as const }
}

export async function reorderScheduleAction(items: Array<{ id: string; display_order: number }>) {
  const supabase = createClient()
  const updates = items.map(({ id, display_order }) =>
    supabase.from('schedule_encontro').update({ display_order }).eq('id', id),
  )
  await Promise.all(updates)
  return { success: true as const }
}
