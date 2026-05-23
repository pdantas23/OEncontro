/**
 * api/src/lib/bumps.ts
 *
 * Helpers compartilhados de cálculo de preço de combo (ticket_lot bump).
 * Usados por GET /lots/:id/bumps (Task 8) e POST /create-order (Task 9)
 * para garantir fórmulas idênticas — se um arquivo mudar, o outro acompanha.
 */

export type DiscountType = 'percent' | 'fixed'

export interface ComputedBumpPrice {
  finalPrice: number
  discount: { type: DiscountType; value: number; label: string } | null
}

const round2 = (x: number) => Number(x.toFixed(2))
const fmtPercent = (v: number) => (v % 1 === 0 ? `${v}% OFF` : `${v.toFixed(1)}% OFF`)
const fmtFixed = (v: number) => `R$ ${v.toFixed(2).replace('.', ',')} OFF`

/**
 * Aplica desconto ao preço original do lote oferecido.
 * Sem desconto (type/value nulos) → retorna preço original sem label.
 */
export function computeBumpFinalPrice(
  originalPrice: number,
  discountType: DiscountType | null | undefined,
  discountValue: number | null | undefined,
): ComputedBumpPrice {
  if (discountType === 'percent' && discountValue != null) {
    return {
      finalPrice: round2(originalPrice * (1 - discountValue / 100)),
      discount: { type: 'percent', value: discountValue, label: fmtPercent(discountValue) },
    }
  }
  if (discountType === 'fixed' && discountValue != null) {
    return {
      finalPrice: round2(originalPrice - discountValue),
      discount: { type: 'fixed', value: discountValue, label: fmtFixed(discountValue) },
    }
  }
  return { finalPrice: originalPrice, discount: null }
}
