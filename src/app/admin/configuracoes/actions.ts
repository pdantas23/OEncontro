// Client-side — sem 'use server'
import { createClient } from '@/lib/supabase/client'
import { z } from 'zod'

const configSchema = z.object({
  name: z.string().min(1, 'Nome obrigatório').max(200).optional().nullable(),
  date: z.string().optional().nullable(),
  location: z.string().max(300).optional().nullable(),
  description: z.string().max(2000).optional().nullable(),
  group_link: z.string().url('URL inválida').optional().nullable().or(z.literal('')).transform((v) => v || null),
  whatsapp_support: z.string().max(20).optional().nullable(),
  total_ticket_limit: z.coerce.number().int().min(1).optional().nullable(),
  low_stock_threshold: z.coerce.number().int().min(1).optional(),
  sale_status: z.enum(['open', 'closed', 'sold_out']).optional(),
  meta_pixel_id: z.string().max(50).optional().nullable(),
  gtm_id: z.string().max(50).optional().nullable(),
  google_ads_id: z.string().max(50).optional().nullable(),
})

export async function saveConfigAction(id: string, formData: unknown) {
  const parsed = configSchema.safeParse(formData)
  if (!parsed.success) return { success: false as const, error: 'Dados inválidos' }

  const supabase = createClient()
  const { error } = await supabase
    .from('event_config_encontro')
    .update(parsed.data)
    .eq('id', id)

  if (error) return { success: false as const, error: 'Erro ao salvar configurações' }
  return { success: true as const }
}
