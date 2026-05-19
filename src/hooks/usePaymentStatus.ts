'use client'

/**
 * src/hooks/usePaymentStatus.ts
 *
 * Polling de status de pagamento para a página /obrigado.
 * Consulta diretamente o Supabase (static export — sem API routes).
 *
 * Intervalo: 5 segundos (POLL_INTERVAL)
 * Máximo de tentativas: 60 (5 minutos de polling ativo)
 * Parada: paid | canceled | expired | após MAX_ATTEMPTS tentativas
 *
 * Após timeout: isTimeout = true → UI exibe "Verifique seu e-mail".
 */

import { useState, useEffect, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { PaymentMethod, OrderStatus } from '@/types/checkout'

const POLL_INTERVAL = 5_000
const MAX_ATTEMPTS = 60

interface UsePaymentStatusOptions {
  orderId: string
  paymentMethod: PaymentMethod
  initialStatus: OrderStatus
}

interface UsePaymentStatusResult {
  status: OrderStatus
  isPolling: boolean
  isTimeout: boolean
}

const TERMINAL_STATUSES: OrderStatus[] = ['paid', 'canceled', 'expired', 'refunded', 'failed']

export function usePaymentStatus({
  orderId,
  paymentMethod,
  initialStatus,
}: UsePaymentStatusOptions): UsePaymentStatusResult {
  const [status, setStatus] = useState<OrderStatus>(initialStatus)
  const [attempts, setAttempts] = useState(0)
  const [isTimeout, setIsTimeout] = useState(false)

  // Faz polling para pagamentos pendentes (Pix, Mercado Pago)
  const shouldPoll =
    (paymentMethod === 'pix' || paymentMethod === 'mercadopago') &&
    !TERMINAL_STATUSES.includes(status) &&
    !isTimeout

  // Usar ref para acessar status atual dentro do timeout callback sem stale closure
  const statusRef = useRef(status)
  useEffect(() => { statusRef.current = status }, [status])

  useEffect(() => {
    if (!shouldPoll) return

    if (attempts >= MAX_ATTEMPTS) {
      setIsTimeout(true)
      return
    }

    const timer = setTimeout(async () => {
      try {
        const supabase = createClient()
        // Usa RPC get_order_status — SECURITY DEFINER, não depende de
        // policy SELECT da tabela. Retorna apenas colunas não-sensíveis.
        const { data } = await supabase
          .rpc('get_order_status', { p_order_id: orderId })
          .maybeSingle()

        if (data?.payment_status) {
          setStatus(data.payment_status as OrderStatus)
        }
      } catch {
        // Falha de rede — incrementar tentativa e continuar
      } finally {
        setAttempts((prev) => prev + 1)
      }
    }, POLL_INTERVAL)

    return () => clearTimeout(timer)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [orderId, attempts, shouldPoll])

  const isPolling = shouldPoll && attempts < MAX_ATTEMPTS

  return { status, isPolling, isTimeout }
}
