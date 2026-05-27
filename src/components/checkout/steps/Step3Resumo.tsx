'use client'

/**
 * Step3Resumo — Resumo do pedido + aceites obrigatórios + botão de pagamento.
 * Etapa 3 (final) do checkout.
 * "Pagar" → dispara createOrderAction → redirect para Mercado Pago Checkout Pro.
 */

import { useState, useTransition, type Dispatch } from 'react'
import * as RadixCheckbox from '@radix-ui/react-checkbox'
import { Check } from 'lucide-react'
import { formatCurrency, formatPhone } from '@/utils/format'
import { cn } from '@/utils/cn'
import { Button } from '@/components/ui/Button'
import { Alert } from '@/components/ui/Alert'
import { TermsModal } from '@/components/checkout/TermsModal'
import {
  IMAGE_RIGHTS_TERMS,
  PURCHASE_TERMS,
  TERMS_VERSION,
} from '@/lib/legal/terms'
import { createOrderAction } from '@/app/checkout/actions'
import { trackCheckoutStep } from '@/utils/tracking'
import type { CheckoutState, CheckoutAction } from '@/types/checkout'

interface Step3ResumoProps {
  state: CheckoutState
  dispatch: Dispatch<CheckoutAction>
  onBack: () => void
}

export function Step3Resumo({ state, dispatch, onBack }: Step3ResumoProps) {
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)
  const [imageModalOpen, setImageModalOpen] = useState(false)
  const [termsModalOpen, setTermsModalOpen] = useState(false)

  const { buyer, bumps, lotName, lotPrice, quantity, acceptImageRights, acceptPurchaseTerms } = state

  const subtotal = lotPrice * quantity
  const bumpsTotal = bumps.reduce((acc, b) => acc + b.price, 0)
  const total = subtotal + bumpsTotal

  const canPay = acceptImageRights && acceptPurchaseTerms && !isPending

  function handlePay() {
    if (!acceptImageRights || !acceptPurchaseTerms) return
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
        // type SEMPRE enviado (fallback explícito a 'merchandise' — não envia
        // undefined). Sem isso, o servidor faria default merchandise e
        // buscaria UUID de combo na tabela errada.
        bumps: bumps.map((b) => ({ id: b.id, type: b.type ?? 'merchandise', size: b.size })),
        paymentMethod: 'mercadopago',
        acceptImageRights: true,
        acceptImageRightsVersion: TERMS_VERSION,
        acceptPurchaseTerms: true,
        acceptPurchaseTermsVersion: TERMS_VERSION,
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

        {/* Order bumps (merchandise + combos com badge e preço original riscado) */}
        {bumps.map((b) => (
          <div key={`${b.type ?? 'merchandise'}-${b.id}`} className="flex justify-between text-sm">
            <span className="text-muted-foreground">
              {b.name}
              {b.size && <span className="ml-1 text-xs">({b.size})</span>}
              {b.type === 'ticket_lot' && (
                <span className="ml-1.5 rounded bg-primary/10 px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-primary">
                  Combo
                </span>
              )}
            </span>
            <span className="flex items-baseline gap-1.5">
              {b.type === 'ticket_lot' && b.original_price && b.original_price > b.price && (
                <span className="text-xs text-muted-foreground line-through tabular-nums">
                  {formatCurrency(b.original_price)}
                </span>
              )}
              <span className="tabular-nums text-foreground">{formatCurrency(b.price)}</span>
            </span>
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
        <p className="text-sm text-muted-foreground">{buyer ? formatPhone(buyer.whatsapp) : ''}</p>
      </div>

      {/* Aceites obrigatórios */}
      <div className="space-y-3">
        <ConsentCheckbox
          id="accept-image-rights"
          checked={acceptImageRights}
          onCheckedChange={(v) =>
            dispatch({ type: 'SET_ACCEPT_IMAGE_RIGHTS', value: v })
          }
        >
          Li e concordo com o{' '}
          <button
            type="button"
            onClick={() => setImageModalOpen(true)}
            className="text-primary underline underline-offset-2 hover:text-primary/80"
          >
            termo de direito de imagem
          </button>
          .
        </ConsentCheckbox>

        <ConsentCheckbox
          id="accept-purchase-terms"
          checked={acceptPurchaseTerms}
          onCheckedChange={(v) =>
            dispatch({ type: 'SET_ACCEPT_PURCHASE_TERMS', value: v })
          }
        >
          Li e concordo com as{' '}
          <button
            type="button"
            onClick={() => setTermsModalOpen(true)}
            className="text-primary underline underline-offset-2 hover:text-primary/80"
          >
            regras de compra e política de cancelamento
          </button>
          .
        </ConsentCheckbox>
      </div>

      {/* Botão de pagamento */}
      <div className="space-y-3">
        <Button
          onClick={handlePay}
          loading={isPending}
          disabled={!canPay}
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

      <TermsModal
        open={imageModalOpen}
        onOpenChange={setImageModalOpen}
        title={IMAGE_RIGHTS_TERMS.title}
        body={IMAGE_RIGHTS_TERMS.body}
      />
      <TermsModal
        open={termsModalOpen}
        onOpenChange={setTermsModalOpen}
        title={PURCHASE_TERMS.title}
        body={PURCHASE_TERMS.body}
      />
    </div>
  )
}

interface ConsentCheckboxProps {
  id: string
  checked: boolean
  onCheckedChange: (value: boolean) => void
  children: React.ReactNode
}

function ConsentCheckbox({ id, checked, onCheckedChange, children }: ConsentCheckboxProps) {
  return (
    <div className="flex items-start gap-2">
      <RadixCheckbox.Root
        id={id}
        checked={checked}
        onCheckedChange={(v) => onCheckedChange(v === true)}
        className={cn(
          'peer mt-0.5 h-4 w-4 shrink-0 rounded-sm border border-border bg-input',
          'transition-colors duration-200',
          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background',
          'data-[state=checked]:bg-primary data-[state=checked]:border-primary data-[state=checked]:text-primary-foreground',
        )}
      >
        <RadixCheckbox.Indicator className="flex items-center justify-center text-current">
          <Check className="h-3 w-3" />
        </RadixCheckbox.Indicator>
      </RadixCheckbox.Root>
      <label
        htmlFor={id}
        className="text-sm text-foreground leading-relaxed cursor-pointer select-none"
      >
        {children}
      </label>
    </div>
  )
}
