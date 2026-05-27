'use client'

/**
 * Step1Dados — Dados pessoais do comprador.
 * Etapa 1 do checkout.
 *
 * WhatsApp e CPF usam máscara progressiva no input (visual), mas o valor
 * persistido no estado do wizard é só dígitos — mais limpo no banco e
 * compatível com a validação `length === 11` do CPF no servidor.
 */

import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { step1Schema, type Step1Values } from '@/lib/validations/checkout'
import { Input } from '@/components/ui/Input'
import { Button } from '@/components/ui/Button'
import {
  maskPhoneProgressive,
  maskCpfProgressive,
  formatPhone,
  formatCPF,
} from '@/utils/format'
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
      // Defaults vêm com dígitos puros (caso o usuário tenha voltado do Step 2).
      // Formatamos só para o input refletir a máscara desde o primeiro render.
      whatsapp: defaultValues?.whatsapp ? formatPhone(defaultValues.whatsapp) : '',
      cpf: defaultValues?.cpf ? formatCPF(defaultValues.cpf) : '',
    },
  })

  const whatsappReg = register('whatsapp')
  const cpfReg = register('cpf')

  function onSubmit(data: Step1Values) {
    onNext({
      name: data.name,
      email: data.email,
      whatsapp: data.whatsapp.replace(/\D/g, ''),
      cpf: data.cpf ? data.cpf.replace(/\D/g, '') : undefined,
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
          inputMode="numeric"
          autoComplete="tel"
          placeholder="(11) 99999-9999"
          maxLength={15}
          error={!!errors.whatsapp}
          aria-describedby={errors.whatsapp ? 'whatsapp-error' : undefined}
          {...whatsappReg}
          onChange={(e) => {
            e.target.value = maskPhoneProgressive(e.target.value)
            whatsappReg.onChange(e)
          }}
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
          inputMode="numeric"
          autoComplete="off"
          placeholder="000.000.000-00"
          maxLength={14}
          error={!!errors.cpf}
          aria-describedby={errors.cpf ? 'cpf-error' : undefined}
          {...cpfReg}
          onChange={(e) => {
            e.target.value = maskCpfProgressive(e.target.value)
            cpfReg.onChange(e)
          }}
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
