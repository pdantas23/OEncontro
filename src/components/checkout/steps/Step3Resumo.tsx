'use client'

/**
 * Step3Resumo — Resumo do pedido + botão de pagamento.
 * Etapa 3 (final) do checkout.
 * "Pagar" → dispara createOrderAction → redirect para Mercado Pago Checkout Pro.
 */

import { useState, useTransition } from 'react'
import { formatCurrency } from '@/utils/format'
import { Button } from '@/components/ui/Button'
import { Alert } from '@/components/ui/Alert'
import { createOrderAction } from '@/app/checkout/actions'
import { trackCheckoutStep } from '@/utils/tracking'
import type { CheckoutState } from '@/types/checkout'

interface Step3ResumoProps {
  state: CheckoutState
  onBack: () => void
}

export function Step3Resumo({ state, onBack }: Step3ResumoProps) {
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)

  const { buyer, bumps, lotName, lotPrice, quantity } = state

  const subtotal = lotPrice * quantity
  const bumpsTotal = bumps.reduce((acc, b) => acc + b.price, 0)
  const total = subtotal + bumpsTotal

  function handlePay() {
    setError(null)
    trackCheckoutStep(3, 'Pagamento')

    startTransition(async () => {
      const result = await createOrderAction({
        lotId: state.lotId,
        quantity: state.quantity,
        buyerName: buyer!.name,
        buyerEmail: buyer!.email,
        buyerWhatsapp: buyer!.whatsapp,
        buyerCpf: buyer!.cpf ?? null,
        bumps: bumps.map((b) => ({ id: b.id, size: b.size })),
        paymentMethod: 'mercadopago',
      })

      if (!result.success) {
        setError(result.error)
      }
      // Se success, a action redireciona para o Mercado Pago — não retorna aqui
    })
  }

  return (
    <div className="space-y-6">
      {error && (
        <Alert variant="destructive">{error}</Alert>
      )}

      {/* Resumo */}
      <div className="rounded-lg border border-border bg-card p-5 space-y-3">
        <h3 className="font-display text-sm font-semibold text-foreground">Resumo do pedido</h3>

        {/* Ingresso */}
        <div className="flex justify-between text-sm">
          <span className="text-muted-foreground">
            {lotName} × {quantity}
          </span>
          <span className="tabular-nums text-foreground">{formatCurrency(subtotal)}</span>
        </div>

        {/* Order bumps */}
        {bumps.map((b) => (
          <div key={b.id} className="flex justify-between text-sm">
            <span className="text-muted-foreground">
              {b.name}
              {b.size && <span className="ml-1 text-xs">({b.size})</span>}
            </span>
            <span className="tabular-nums text-foreground">{formatCurrency(b.price)}</span>
          </div>
        ))}

        <div className="border-t border-border pt-3">
          <div className="flex justify-between">
            <span className="font-medium text-foreground">Total</span>
            <span className="font-semibold tabular-nums text-primary">{formatCurrency(total)}</span>
          </div>
        </div>
      </div>

      {/* Dados do comprador */}
      <div className="rounded-lg border border-border bg-card p-5 space-y-1">
        <h3 className="font-display text-sm font-semibold text-foreground">Seus dados</h3>
        <p className="text-sm text-muted-foreground">{buyer?.name}</p>
        <p className="text-sm text-muted-foreground">{buyer?.email}</p>
        <p className="text-sm text-muted-foreground">{buyer?.whatsapp}</p>
      </div>

      {/* Botão de pagamento */}
      <div className="space-y-3">
        <Button
          onClick={handlePay}
          loading={isPending}
          disabled={isPending}
          className="w-full"
        >
          {isPending ? 'Redirecionando para pagamento…' : 'Pagar com Mercado Pago'}
        </Button>

        <p className="text-xs text-center text-muted-foreground">
          Você será redirecionado para o Mercado Pago para finalizar o pagamento com segurança.
        </p>
      </div>

      <Button variant="ghost" onClick={onBack} disabled={isPending} className="w-full">
        Voltar
      </Button>
    </div>
  )
}
