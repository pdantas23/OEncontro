/**
 * src/adapters/PaymentAdapter.ts
 *
 * Interface genérica para a API de pagamento.
 * NENHUM componente, página ou service chama a API diretamente.
 * Toda comunicação com o provider passa por esta interface.
 *
 * Task Final TF08: substituir MockPaymentAdapter pelo adapter real
 * (Stripe / Pagar.me / Asaas / Mercado Pago)
 */

// ---------------------------------------------------------------------------
// Tipos de entrada
// ---------------------------------------------------------------------------

export interface PaymentCustomer {
  name: string
  email: string
  cpf?: string
  phone?: string
}

export interface PaymentItem {
  id: string
  name: string
  quantity: number
  unitPrice: number // em centavos
}

export interface CreatePixPaymentInput {
  orderId: string
  customer: PaymentCustomer
  items: PaymentItem[]
  totalAmount: number // em centavos
  expirationMinutes?: number
}

export interface CreateCardPaymentInput {
  orderId: string
  customer: PaymentCustomer
  items: PaymentItem[]
  totalAmount: number // em centavos
  card: {
    number: string
    holderName: string
    expirationMonth: string
    expirationYear: string
    cvv: string
    installments?: number
  }
}

// ---------------------------------------------------------------------------
// Tipos de retorno
// ---------------------------------------------------------------------------

export type PaymentStatus =
  | 'pending'
  | 'paid'
  | 'canceled'
  | 'expired'
  | 'refunded'
  | 'failed'

export interface PixPaymentResult {
  paymentId: string
  pixCode: string          // código copia e cola
  pixQrcodeUrl: string     // URL da imagem do QR Code
  expiresAt: Date
  status: PaymentStatus
}

export interface CardPaymentResult {
  paymentId: string
  status: PaymentStatus
  authorizationCode?: string
  errorMessage?: string
}

export interface PaymentStatusResult {
  paymentId: string
  status: PaymentStatus
  paidAt?: Date
}

export interface RefundResult {
  refundId: string
  status: 'success' | 'pending' | 'failed'
}

// ---------------------------------------------------------------------------
// Interface do adapter
// ---------------------------------------------------------------------------

export interface IPaymentAdapter {
  /**
   * Cria um pagamento via Pix.
   * Retorna o código Pix, QR Code e data de expiração.
   */
  createPixPayment(input: CreatePixPaymentInput): Promise<PixPaymentResult>

  /**
   * Cria um pagamento via cartão de crédito.
   * Retorna o status imediato da transação.
   */
  createCardPayment(input: CreateCardPaymentInput): Promise<CardPaymentResult>

  /**
   * Consulta o status de um pagamento pelo ID do provider.
   * Usado pelo polling da página /obrigado.
   */
  getPaymentStatus(paymentId: string): Promise<PaymentStatusResult>

  /**
   * Estorna um pagamento.
   */
  refundPayment(paymentId: string): Promise<RefundResult>

  /**
   * Verifica a assinatura de um webhook do provider.
   * Retorna o payload validado ou lança erro se a assinatura for inválida.
   */
  verifyWebhookSignature(payload: string, signature: string): unknown
}
