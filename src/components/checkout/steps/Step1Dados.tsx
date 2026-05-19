'use client'

/**
 * Step1Dados — Dados pessoais do comprador.
 * Etapa 1 do checkout.
 */

import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { step1Schema, type Step1Values } from '@/lib/validations/checkout'
import { Input } from '@/components/ui/Input'
import { Button } from '@/components/ui/Button'
import type { BuyerData } from '@/types/checkout'

interface Step1DadosProps {
  defaultValues?: Partial<BuyerData>
  onNext: (data: BuyerData) => void
}

export function Step1Dados({ defaultValues, onNext }: Step1DadosProps) {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<Step1Values>({
    resolver: zodResolver(step1Schema),
    defaultValues: {
      name: defaultValues?.name ?? '',
      email: defaultValues?.email ?? '',
      whatsapp: defaultValues?.whatsapp ?? '',
      cpf: defaultValues?.cpf ?? '',
    },
  })

  function onSubmit(data: Step1Values) {
    onNext({
      name: data.name,
      email: data.email,
      whatsapp: data.whatsapp,
      cpf: data.cpf || undefined,
    })
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-5">
      <div>
        <label htmlFor="name" className="mb-1.5 block text-sm font-medium text-foreground">
          Nome completo <span aria-hidden="true" className="text-destructive">*</span>
        </label>
        <Input
          id="name"
          autoComplete="name"
          placeholder="Seu nome completo"
          error={!!errors.name}
          aria-describedby={errors.name ? 'name-error' : undefined}
          {...register('name')}
        />
        {errors.name && (
          <p id="name-error" role="alert" className="mt-1 text-xs text-destructive">
            {errors.name.message}
          </p>
        )}
      </div>

      <div>
        <label htmlFor="email" className="mb-1.5 block text-sm font-medium text-foreground">
          E-mail <span aria-hidden="true" className="text-destructive">*</span>
        </label>
        <Input
          id="email"
          type="email"
          autoComplete="email"
          placeholder="seu@email.com"
          error={!!errors.email}
          aria-describedby={errors.email ? 'email-error' : undefined}
          {...register('email')}
        />
        {errors.email ? (
          <p id="email-error" role="alert" className="mt-1 text-xs text-destructive">
            {errors.email.message}
          </p>
        ) : (
          <p className="mt-1 text-xs text-muted-foreground">
            O ingresso será enviado para este e-mail.
          </p>
        )}
      </div>

      <div>
        <label htmlFor="whatsapp" className="mb-1.5 block text-sm font-medium text-foreground">
          WhatsApp <span aria-hidden="true" className="text-destructive">*</span>
        </label>
        <Input
          id="whatsapp"
          type="tel"
          autoComplete="tel"
          placeholder="(11) 99999-9999"
          error={!!errors.whatsapp}
          aria-describedby={errors.whatsapp ? 'whatsapp-error' : undefined}
          {...register('whatsapp')}
        />
        {errors.whatsapp && (
          <p id="whatsapp-error" role="alert" className="mt-1 text-xs text-destructive">
            {errors.whatsapp.message}
          </p>
        )}
      </div>

      <div>
        <label htmlFor="cpf" className="mb-1.5 block text-sm font-medium text-foreground">
          CPF <span className="text-xs text-muted-foreground">(opcional)</span>
        </label>
        <Input
          id="cpf"
          autoComplete="off"
          placeholder="000.000.000-00"
          error={!!errors.cpf}
          aria-describedby={errors.cpf ? 'cpf-error' : undefined}
          {...register('cpf')}
        />
        {errors.cpf && (
          <p id="cpf-error" role="alert" className="mt-1 text-xs text-destructive">
            {errors.cpf.message}
          </p>
        )}
      </div>

      <Button type="submit" className="w-full">
        Continuar
      </Button>
    </form>
  )
}
