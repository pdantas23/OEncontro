/**
 * src/utils/csv.ts
 *
 * Gera CSV no servidor — nunca no cliente.
 */

import type { Order } from '@/repositories/OrderRepository'
import { formatCurrency } from './format'

function escapeCell(value: string | number | null | undefined): string {
  const str = value == null ? '' : String(value)
  // Escapar aspas duplas e envolver em aspas se necessário
  if (str.includes(',') || str.includes('"') || str.includes('\n')) {
    return `"${str.replace(/"/g, '""')}"`
  }
  return str
}

function row(cells: (string | number | null | undefined)[]): string {
  return cells.map(escapeCell).join(',')
}

export function generateOrdersCSV(orders: Order[]): string {
  const headers = [
    'ID',
    'Nome',
    'E-mail',
    'WhatsApp',
    'CPF',
    'Lote',
    'Quantidade',
    'Subtotal',
    'Total',
    'Método',
    'Status',
    'Data',
  ]

  const lines = [
    row(headers),
    ...orders.map((o) =>
      row([
        o.id,
        o.buyer_name,
        o.buyer_email,
        o.buyer_whatsapp,
        o.buyer_cpf,
        o.ticket_lot_id,
        o.ticket_quantity,
        formatCurrency(o.subtotal),
        formatCurrency(o.total),
        o.payment_method,
        o.payment_status,
        new Date(o.created_at).toLocaleString('pt-BR'),
      ]),
    ),
  ]

  return lines.join('\r\n')
}
