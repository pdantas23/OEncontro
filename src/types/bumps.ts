/**
 * src/types/bumps.ts
 *
 * Espelho do shape de GET /lots/:id/bumps (api/src/routes/public.ts).
 * Se alterar campos aqui, reflita no endpoint (decisão Y — independência
 * de build entre frontend e API).
 */

export interface EligibleBump {
  /** ticket_lot_bumps_encontro.id — REGRA de combo aplicada. */
  id: string
  type: 'ticket_lot'
  /** ticket_lots_encontro.id do lote oferecido (o que o comprador leva). */
  ticket_lot_id: string
  name: string
  description: string | null
  image_url: string | null
  event_days: number[] | null
  /** Preço cheio do lote oferecido, em REAIS. */
  original_price: number
  /** Preço pós-desconto, em REAIS — é o que vai pro carrinho. */
  final_price: number
  /** value em REAIS quando type='fixed', ou em pontos percentuais quando 'percent'. */
  discount: { type: 'percent' | 'fixed'; value: number; label: string } | null
  display_order: number
  available: number
  /**
   * Identificador de grupo de exclusividade (union-find sobre intersecção
   * de event_days). Combos no MESMO grupo são mutuamente exclusivos no UI
   * (selecionar B desmarca A).
   */
  exclusivity_group: string
}
