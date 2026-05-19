/**
 * src/lib/paymentAdapter.ts
 *
 * Factory do adapter de pagamento.
 * Retorna MockPaymentAdapter em desenvolvimento/testes.
 *
 * TODO TF08: substituir por adapter real (Stripe / Pagar.me / Asaas / Mercado Pago)
 *   import { RealPaymentAdapter } from '@/adapters/RealPaymentAdapter'
 *   if (process.env.NODE_ENV === 'production') return new RealPaymentAdapter()
 */

import { MockPaymentAdapter } from '@/adapters/MockPaymentAdapter'
import type { IPaymentAdapter } from '@/adapters/PaymentAdapter'

export function getPaymentAdapter(): IPaymentAdapter {
  // TODO TF08: condicional por env var quando o adapter real estiver disponível
  return new MockPaymentAdapter()
}
