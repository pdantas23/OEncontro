/**
 * src/types/checkout.ts
 *
 * Tipos do fluxo de checkout.
 * Estado local (useReducer) + tipos de input/output das Server Actions.
 */

// ---------------------------------------------------------------------------
// Domínio
// ---------------------------------------------------------------------------

export type PaymentMethod = 'pix' | 'card' | 'mercadopago'

export type OrderStatus =
  | 'pending'
  | 'paid'
  | 'failed'
  | 'canceled'
  | 'expired'
  | 'refunded'

export type CheckoutStep = 1 | 2 | 3

/**
 * Subset de Order retornado pelo RPC get_order_status.
 * Usado na /obrigado — sem dados sensíveis (cpf, whatsapp, payment_id, etc).
 *
 * Duplicado de /api/src/types/order.ts (Opção Y — independência de build).
 * Se alterar campos aqui, reflita em /api/src/types/order.ts.
 */
export interface OrderSummary {
  id: string
  payment_status: string
  payment_method: string
  buyer_name: string
  buyer_email: string
  total: number
}

// ---------------------------------------------------------------------------
// Estado do wizard (useReducer)
// ---------------------------------------------------------------------------

export interface BuyerData {
  name: string
  email: string
  whatsapp: string
  cpf?: string
}

export type BumpItemType = 'merchandise' | 'ticket_lot'

export interface SelectedBump {
  type: BumpItemType
  /**
   * Quando type='merchandise': order_bumps_encontro.id (produto físico).
   * Quando type='ticket_lot':  ticket_lot_bumps_encontro.id (REGRA DE COMBO aplicada).
   */
  id: string
  /** Lote oferecido (preenchido só quando type='ticket_lot'). */
  ticket_lot_id?: string
  name: string
  /** Preço efetivamente pago (já com desconto aplicado). */
  price: number
  /** Preço cheio (só quando houve promoção). */
  original_price?: number
  /** Só para mercadoria com has_sizes. */
  size?: string
  /** Default 1 — preparado para uso futuro, sem UI ainda. */
  quantity?: number
}

/**
 * Shape de cada item no jsonb orders_encontro.order_bumps.
 *
 * SEMÂNTICA DO CAMPO `id` (importante para auditoria):
 * - type='merchandise': id = order_bumps_encontro.id (produto físico)
 * - type='ticket_lot':  id = ticket_lot_bumps_encontro.id (REGRA DE COMBO aplicada)
 *                       e ticket_lot_id = ticket_lots_encontro.id (lote em si)
 *
 * Essa separação permite rastrear qual combo gerou a venda mesmo depois
 * de o admin desativar/alterar a regra.
 *
 * Backward compat: itens antigos sem `type` são tratados como 'merchandise'
 * (era o único formato antes desta feature).
 */
export interface PersistedBumpItem {
  type?: BumpItemType
  id: string
  ticket_lot_id?: string
  name: string
  price: number
  original_price?: number
  size?: string | null
  quantity?: number
}

export interface CheckoutState {
  step: CheckoutStep
  lotId: string
  lotName: string
  lotPrice: number // centavos
  lotAvailable: number
  quantity: number
  buyer: BuyerData | null
  bumps: SelectedBump[]
}

export type CheckoutAction =
  | { type: 'SET_BUYER'; buyer: BuyerData }
  | { type: 'SET_BUMPS'; bumps: SelectedBump[] }
  | { type: 'SET_QUANTITY'; quantity: number }
  | { type: 'NEXT_STEP' }
  | { type: 'PREV_STEP' }
  | { type: 'GO_TO_STEP'; step: CheckoutStep }

// ---------------------------------------------------------------------------
// Input/Output das Server Actions
// ---------------------------------------------------------------------------

export interface CreateOrderInput {
  lotId: string
  quantity: number
  buyer: BuyerData
  bumps: Array<{ id: string; size?: string }>
  paymentMethod: PaymentMethod
  card?: {
    number: string
    holderName: string
    expirationMonth: string
    expirationYear: string
    cvv: string
  }
}

export type CreateOrderResult =
  | { success: true; orderId: string; paymentMethod: PaymentMethod }
  | { success: false; error: string; fields?: Record<string, string[]>; orderId?: string }
