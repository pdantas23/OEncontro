/**
 * @deprecated DEAD CODE — não usado em produção.
 *
 * Este arquivo faz parte da arquitetura ANTERIOR ao Mercado Pago Checkout Pro.
 * O fluxo atual de produção é: src/app/checkout/actions.ts → API Hono /create-order.
 *
 * Mantido temporariamente. Verificado em 2026-05-23 durante a Task 4 do projeto
 * de Order Bumps de Ingresso. Confirmado: zero imports em produção.
 *
 * TODO: deletar em task de limpeza dedicada (validar fanout completo antes).
 */

import { MockPaymentAdapter } from '@/adapters/MockPaymentAdapter'
import type { IPaymentAdapter } from '@/adapters/PaymentAdapter'

export function getPaymentAdapter(): IPaymentAdapter {
  // TODO TF08: condicional por env var quando o adapter real estiver disponível
  return new MockPaymentAdapter()
}
