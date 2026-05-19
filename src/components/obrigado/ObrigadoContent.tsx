'use client'

/**
 * ObrigadoContent — Conteúdo da página /obrigado.
 * Client Component: gerencia o polling de status.
 *
 * Estados:
 *   pending       → Aguardando confirmação (polling do webhook)
 *   paid          → Mensagem de sucesso
 *   expired       → Pagamento expirado
 *   failed        → Pagamento recusado
 *   isTimeout     → Polling esgotou (60 tentativas)
 */

import { useEffect, useRef } from 'react'
import { CheckCircle, XCircle, Clock } from 'lucide-react'
import { Spinner } from '@/components/ui/Spinner'
import { Button } from '@/components/ui/Button'
import { usePaymentStatus } from '@/hooks/usePaymentStatus'
import { formatCurrency } from '@/utils/format'
import { trackPurchase } from '@/utils/tracking'
import type { PaymentMethod, OrderStatus, OrderSummary } from '@/types/checkout'

interface ObrigadoContentProps {
  order: OrderSummary
}

export function ObrigadoContent({ order }: ObrigadoContentProps) {
  const { status, isPolling, isTimeout } = usePaymentStatus({
    orderId: order.id,
    paymentMethod: (order.payment_method as PaymentMethod) ?? 'mercadopago',
    initialStatus: order.payment_status as OrderStatus,
  })

  // T103 — purchase: disparar quando status for 'paid' (uma única vez)
  const purchaseTracked = useRef(false)
  useEffect(() => {
    if (status === 'paid' && !purchaseTracked.current) {
      purchaseTracked.current = true
      trackPurchase({
        orderId: order.id,
        value: order.total,
        paymentMethod: order.payment_method,
      })
    }
  }, [status, order.id, order.total, order.payment_method])

  // ── Pago ───────────────────────────────────────────────────────────────────
  if (status === 'paid') {
    return (
      <div className="flex flex-col items-center text-center space-y-4">
        <div className="flex h-16 w-16 items-center justify-center rounded-full bg-emerald-500/10">
          <CheckCircle className="h-8 w-8 text-emerald-500" />
        </div>
        <div>
          <h1 className="font-display text-2xl font-bold text-foreground">
            Pagamento confirmado!
          </h1>
          <p className="mt-2 text-muted-foreground">
            Parabéns, <strong className="text-foreground">{order.buyer_name}</strong>! Sua participação
            no evento está garantida.
          </p>
        </div>
        <div className="rounded-lg border border-border bg-card p-5 w-full max-w-sm text-left space-y-2">
          <p className="text-xs text-muted-foreground">Resumo</p>
          <p className="text-sm font-medium text-foreground">Pedido #{order.id.slice(0, 8).toUpperCase()}</p>
          <p className="text-sm text-muted-foreground">{order.buyer_name}</p>
          <p className="text-lg font-semibold text-primary tabular-nums">
            {formatCurrency(order.total)}
          </p>
        </div>
        <p className="text-xs text-muted-foreground">
          Enviamos um e-mail de confirmação para <strong className="text-foreground">{order.buyer_email}</strong>.
          Confira sua caixa de entrada (e a pasta de spam).
        </p>
      </div>
    )
  }

  // ── Falha / Cancelado ──────────────────────────────────────────────────────
  if (status === 'failed' || status === 'canceled') {
    return (
      <div className="flex flex-col items-center text-center space-y-4">
        <div className="flex h-16 w-16 items-center justify-center rounded-full bg-destructive/10">
          <XCircle className="h-8 w-8 text-destructive" />
        </div>
        <div>
          <h1 className="font-display text-2xl font-bold text-foreground">
            Pagamento não aprovado
          </h1>
          <p className="mt-2 text-muted-foreground">
            {status === 'canceled'
              ? 'Seu pagamento foi cancelado.'
              : 'Houve um problema com seu pagamento. Por favor, tente novamente.'}
          </p>
        </div>
        <Button asChild className="w-full max-w-xs">
          <a href="/#ingressos">Tentar novamente</a>
        </Button>
      </div>
    )
  }

  // ── Expirado ───────────────────────────────────────────────────────────────
  if (status === 'expired') {
    return (
      <div className="flex flex-col items-center text-center space-y-4">
        <div className="flex h-16 w-16 items-center justify-center rounded-full bg-amber-500/10">
          <Clock className="h-8 w-8 text-amber-500" />
        </div>
        <div>
          <h1 className="font-display text-2xl font-bold text-foreground">
            Pagamento expirado
          </h1>
          <p className="mt-2 text-muted-foreground">
            O tempo para pagamento foi encerrado. Tente novamente para garantir seu ingresso.
          </p>
        </div>
        <Button asChild className="w-full max-w-xs">
          <a href="/#ingressos">Comprar novamente</a>
        </Button>
      </div>
    )
  }

  // ── Pendente — aguardando confirmação via webhook ─────────────────────────
  return (
    <div className="flex flex-col items-center text-center space-y-6">
      <div>
        <h1 className="font-display text-2xl font-bold text-foreground">
          Processando seu pagamento…
        </h1>
        <p className="mt-2 text-muted-foreground">
          Estamos confirmando seu pagamento. Isso pode levar alguns instantes.
        </p>
      </div>

      <div className="rounded-lg border border-border bg-card p-5 w-full max-w-sm text-left space-y-2">
        <p className="text-xs text-muted-foreground">Resumo</p>
        <p className="text-sm font-medium text-foreground">Pedido #{order.id.slice(0, 8).toUpperCase()}</p>
        <p className="text-sm text-muted-foreground">{order.buyer_name}</p>
        <p className="text-lg font-semibold text-primary tabular-nums">
          {formatCurrency(order.total)}
        </p>
      </div>

      {isTimeout ? (
        <div className="space-y-2">
          <p className="text-sm text-muted-foreground">
            A confirmação está demorando mais que o esperado.
          </p>
          <p className="text-sm text-muted-foreground">
            Fique tranquilo — você receberá um e-mail em{' '}
            <strong className="text-foreground">{order.buyer_email}</strong>{' '}
            assim que o pagamento for confirmado.
          </p>
        </div>
      ) : isPolling ? (
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Spinner size="sm" />
          <span>Aguardando confirmação do pagamento…</span>
        </div>
      ) : (
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Spinner size="sm" />
          <span>Verificando status…</span>
        </div>
      )}

      <p className="text-xs text-muted-foreground">
        Pedido #{order.id.slice(0, 8).toUpperCase()} · {order.buyer_email}
      </p>
    </div>
  )
}
