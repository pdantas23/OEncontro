// Client-side — sem 'use server'
import { createClient } from '@/lib/supabase/client'
import { z } from 'zod'

const comboSchema = z
  .object({
    principal_lot_id: z.string().uuid('Lote principal inválido'),
    offered_lot_id: z.string().uuid('Lote oferecido inválido'),
    discount_type: z.enum(['percent', 'fixed']).nullable().optional(),
    discount_value: z.coerce.number().positive().nullable().optional(),
    display_order: z.coerce.number().int().min(0).default(0),
    active: z.boolean().default(true),
  })
  .refine((d) => d.principal_lot_id !== d.offered_lot_id, {
    message: 'Lote principal e oferecido devem ser diferentes',
    path: ['offered_lot_id'],
  })
  .refine(
    (d) =>
      (d.discount_type == null && d.discount_value == null) ||
      (d.discount_type != null && d.discount_value != null),
    { message: 'Tipo e valor de desconto devem estar coerentes', path: ['discount_value'] },
  )
  .refine(
    (d) =>
      d.discount_type !== 'percent' ||
      (d.discount_value != null && d.discount_value > 0 && d.discount_value <= 100),
    { message: 'Percentual deve estar entre 0 e 100', path: ['discount_value'] },
  )

async function validateNoOverlap(
  supabase: ReturnType<typeof createClient>,
  principalId: string,
  offeredId: string,
): Promise<string | null> {
  const { data: lots } = await supabase
    .from('ticket_lots_encontro')
    .select('id, name, event_days')
    .in('id', [principalId, offeredId])
  if (!lots || lots.length < 2) return null
  const principal = lots.find((l) => l.id === principalId)
  const offered = lots.find((l) => l.id === offeredId)
  if (!principal?.event_days || !offered?.event_days) return null
  const overlap = principal.event_days.filter((d) => offered.event_days!.includes(d))
  if (overlap.length > 0) {
    return `"${principal.name}" e "${offered.name}" compartilham dia(s) ${overlap.join(', ')}. Combos só fazem sentido entre lotes de dias distintos.`
  }
  return null
}

async function validateFixedDiscountAgainstPrice(
  supabase: ReturnType<typeof createClient>,
  offeredId: string,
  discountType: 'percent' | 'fixed' | null | undefined,
  discountValue: number | null | undefined,
): Promise<string | null> {
  if (discountType !== 'fixed' || discountValue == null) return null
  const { data: lot } = await supabase
    .from('ticket_lots_encontro')
    .select('name, price')
    .eq('id', offeredId)
    .single()
  if (!lot) return null
  if (discountValue >= lot.price) {
    return `Desconto fixo de R$ ${discountValue.toFixed(2)} é maior ou igual ao preço de "${lot.name}" (R$ ${lot.price.toFixed(2)}).`
  }
  return null
}

export async function createComboAction(formData: unknown) {
  const parsed = comboSchema.safeParse(formData)
  if (!parsed.success) {
    return { success: false as const, error: parsed.error.issues[0]?.message ?? 'Dados inválidos' }
  }

  const supabase = createClient()
  const overlapError = await validateNoOverlap(supabase, parsed.data.principal_lot_id, parsed.data.offered_lot_id)
  if (overlapError) return { success: false as const, error: overlapError }

  const fixedError = await validateFixedDiscountAgainstPrice(
    supabase,
    parsed.data.offered_lot_id,
    parsed.data.discount_type,
    parsed.data.discount_value,
  )
  if (fixedError) return { success: false as const, error: fixedError }

  const { data, error } = await supabase
    .from('ticket_lot_bumps_encontro')
    .insert(parsed.data)
    .select()
    .single()

  if (error || !data) return { success: false as const, error: error?.message ?? 'Erro ao criar combo' }
  return { success: true as const, id: data.id as string }
}

export async function updateComboAction(id: string, formData: unknown) {
  const parsed = comboSchema.safeParse(formData)
  if (!parsed.success) {
    return { success: false as const, error: parsed.error.issues[0]?.message ?? 'Dados inválidos' }
  }

  const supabase = createClient()
  const overlapError = await validateNoOverlap(supabase, parsed.data.principal_lot_id, parsed.data.offered_lot_id)
  if (overlapError) return { success: false as const, error: overlapError }

  const fixedError = await validateFixedDiscountAgainstPrice(
    supabase,
    parsed.data.offered_lot_id,
    parsed.data.discount_type,
    parsed.data.discount_value,
  )
  if (fixedError) return { success: false as const, error: fixedError }

  const { error } = await supabase
    .from('ticket_lot_bumps_encontro')
    .update(parsed.data)
    .eq('id', id)
  if (error) return { success: false as const, error: 'Erro ao atualizar combo' }
  return { success: true as const }
}

export async function deleteComboAction(id: string) {
  // TODO (Task 9): adicionar pre-check antes de DELETE.
  // Após Task 9, combos com vendas registradas (referenciados em
  // orders_encontro.order_bumps[].id) NÃO podem ser excluídos —
  // apenas desativados via toggle.
  // Implementação: query em orders_encontro com filtro jsonb
  // (order_bumps @> '[{"type":"ticket_lot","id":"<combo_id>"}]')
  const supabase = createClient()
  const { error } = await supabase.from('ticket_lot_bumps_encontro').delete().eq('id', id)
  if (error) return { success: false as const, error: error.message }
  return { success: true as const }
}
