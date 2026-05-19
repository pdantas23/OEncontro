/**
 * Tipos compartilhados de pedido — fonte canônica para a API.
 *
 * O frontend tem uma cópia parcial em src/types/checkout.ts (OrderSummary).
 * Se precisar sincronizar, este arquivo é a referência.
 */

export type PaymentStatus =
  | 'pending'
  | 'paid'
  | 'failed'
  | 'canceled'
  | 'expired'
  | 'refunded'

export interface OrderSummary {
  id: string
  payment_status: PaymentStatus
  payment_method: string
  buyer_name: string
  buyer_email: string
  total: number
}

export interface OrderRow {
  id: string
  buyer_name: string
  buyer_email: string
  buyer_whatsapp: string
  buyer_cpf: string | null
  ticket_lot_id: string
  ticket_quantity: number
  order_bumps: unknown
  subtotal: number
  total: number
  payment_method: string
  payment_status: string
  payment_id: string | null
  mp_preference_id: string | null
  pix_code: string | null
  pix_qrcode_url: string | null
  pix_expires_at: string | null
  created_at: string
  updated_at: string
}
