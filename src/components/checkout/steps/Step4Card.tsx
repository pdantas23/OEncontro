'use client'

/**
 * Step4Card — Formulário de dados do cartão de crédito.
 * Etapa 4 do checkout (apenas para pagamento com cartão).
 */

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { cardSchema, type CardValues } from '@/lib/validations/checkout'
import { Input } from '@/components/ui/Input'
import { Button } from '@/components/ui/Button'
import { Alert } from '@/components/ui/Alert'
import { createOrderAction } from '@/app/checkout/actions'
import type { CheckoutState } from '@/types/checkout'

interface Step4CardProps {
  state: CheckoutState
  onBack: () => void
}

export function Step4Card({ state, onBack }: Step4CardProps) {
  const [isPending, startTransition] = useTransition()
  const [serverError, setServerError] = useState<string | null>(null)
  const router = useRouter()

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<CardValues>({
    resolver: zodResolver(cardSchema),
  })

  function onSubmit(cardData: CardValues) {
    setServerError(null)

    startTransition(async () => {
      const result = await createOrderAction({
        lotId: state.lotId,
        quantity: state.quantity,
        buyerName: state.buyer!.name,
        buyerEmail: state.buyer!.email,
        buyerWhatsapp: state.buyer!.whatsapp,
        buyerCpf: state.buyer!.cpf ?? null,
        bumps: state.bumps.map((b) => ({ id: b.id, size: b.size })),
        paymentMethod: 'card',
        card: cardData,
      })

      if (!result.success) {
        setServerError(result.error)
        return
      }

      // Cartão aprovado — redirecionar para /obrigado
      router.push(`/obrigado?order_id=${result.orderId}`)
    })
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-5">
      {serverError && (
        <Alert variant="destructive">
          {serverError}
        </Alert>
      )}

      <div>
        <label htmlFor="number" className="mb-1.5 block text-sm font-medium text-foreground">
          Número do cartão <span aria-hidden="true" className="text-destructive">*</span>
        </label>
        <Input
          id="number"
          autoComplete="cc-number"
          placeholder="0000 0000 0000 0000"
          inputMode="numeric"
          error={!!errors.number}
          {...register('number')}
        />
        {errors.number && (
          <p role="alert" className="mt-1 text-xs text-destructive">{errors.number.message}</p>
        )}
      </div>

      <div>
        <label htmlFor="holderName" className="mb-1.5 block text-sm font-medium text-foreground">
          Nome no cartão <span aria-hidden="true" className="text-destructive">*</span>
        </label>
        <Input
          id="holderName"
          autoComplete="cc-name"
          placeholder="NOME COMO NO CARTÃO"
          error={!!errors.holderName}
          {...register('holderName')}
        />
        {errors.holderName && (
          <p role="alert" className="mt-1 text-xs text-destructive">{errors.holderName.message}</p>
        )}
      </div>

      <div className="grid grid-cols-3 gap-3">
        <div>
          <label htmlFor="expirationMonth" className="mb-1.5 block text-sm font-medium text-foreground">
            Mês
          </label>
          <Input
            id="expirationMonth"
            autoComplete="cc-exp-month"
            placeholder="MM"
            inputMode="numeric"
            maxLength={2}
            error={!!errors.expirationMonth}
            {...register('expirationMonth')}
          />
          {errors.expirationMonth && (
            <p role="alert" className="mt-1 text-xs text-destructive">{errors.expirationMonth.message}</p>
          )}
        </div>

        <div>
          <label htmlFor="expirationYear" className="mb-1.5 block text-sm font-medium text-foreground">
            Ano
          </label>
          <Input
            id="expirationYear"
            autoComplete="cc-exp-year"
            placeholder="AAAA"
            inputMode="numeric"
            maxLength={4}
            error={!!errors.expirationYear}
            {...register('expirationYear')}
          />
          {errors.expirationYear && (
            <p role="alert" className="mt-1 text-xs text-destructive">{errors.expirationYear.message}</p>
          )}
        </div>

        <div>
          <label htmlFor="cvv" className="mb-1.5 block text-sm font-medium text-foreground">
            CVV
          </label>
          <Input
            id="cvv"
            autoComplete="cc-csc"
            placeholder="000"
            inputMode="numeric"
            maxLength={4}
            error={!!errors.cvv}
            {...register('cvv')}
          />
          {errors.cvv && (
            <p role="alert" className="mt-1 text-xs text-destructive">{errors.cvv.message}</p>
          )}
        </div>
      </div>

      <p className="text-xs text-muted-foreground">
        Seus dados de pagamento são processados com segurança e não ficam armazenados em nossos servidores.
      </p>

      <Button type="submit" loading={isPending} disabled={isPending} className="w-full">
        Finalizar pagamento
      </Button>

      <Button
        type="button"
        variant="ghost"
        onClick={onBack}
        disabled={isPending}
        className="w-full"
      >
        Voltar
      </Button>
    </form>
  )
}
