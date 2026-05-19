/**
 * src/lib/validations/checkout.ts
 *
 * Schemas Zod para cada etapa do checkout.
 * Usados tanto no cliente (react-hook-form) quanto no servidor (Server Actions).
 * A validação do servidor é SEMPRE executada, independente da validação client-side.
 */

import { z } from 'zod'

// ---------------------------------------------------------------------------
// Step 1 — Dados do comprador
// ---------------------------------------------------------------------------

export const step1Schema = z.object({
  name: z
    .string()
    .min(3, 'Nome deve ter pelo menos 3 caracteres')
    .max(120, 'Nome muito longo'),
  email: z.string().email('E-mail inválido'),
  whatsapp: z
    .string()
    .min(10, 'WhatsApp inválido — inclua o DDD')
    .max(15, 'WhatsApp inválido'),
  cpf: z
    .string()
    .optional()
    .refine(
      (v) => !v || v.replace(/\D/g, '').length === 11,
      'CPF inválido — informe apenas os 11 dígitos',
    ),
})

export type Step1Values = z.infer<typeof step1Schema>

// ---------------------------------------------------------------------------
// Step 2 — Order bumps
// ---------------------------------------------------------------------------

export const selectedBumpSchema = z.object({
  id: z.string().uuid(),
  size: z.string().optional(),
})

export const step2Schema = z.object({
  bumps: z.array(selectedBumpSchema),
})

export type Step2Values = z.infer<typeof step2Schema>

// ---------------------------------------------------------------------------
// Step 4 — Dados do cartão
// ---------------------------------------------------------------------------

export const cardSchema = z.object({
  number: z
    .string()
    .min(13, 'Número do cartão inválido')
    .max(19, 'Número do cartão inválido')
    .transform((v) => v.replace(/\s/g, '')),
  holderName: z
    .string()
    .min(3, 'Nome do titular inválido')
    .max(80),
  expirationMonth: z
    .string()
    .length(2, 'Mês inválido')
    .refine((v) => {
      const m = parseInt(v, 10)
      return m >= 1 && m <= 12
    }, 'Mês inválido'),
  expirationYear: z
    .string()
    .length(4, 'Ano inválido')
    .refine((v) => parseInt(v, 10) >= new Date().getFullYear(), 'Cartão expirado'),
  cvv: z
    .string()
    .min(3, 'CVV inválido')
    .max(4, 'CVV inválido'),
})

export type CardValues = z.infer<typeof cardSchema>

// ---------------------------------------------------------------------------
// Action schema — criação de pedido (Server Action, validação server-side)
// ---------------------------------------------------------------------------

export const createOrderSchema = z.object({
  lotId: z.string().uuid('ID do lote inválido'),
  quantity: z.number().int().min(1, 'Quantidade mínima: 1').max(10, 'Quantidade máxima: 10'),
  buyerName: z.string().min(3),
  buyerEmail: z.string().email(),
  buyerWhatsapp: z.string().min(10).max(15),
  buyerCpf: z.string().length(11).optional().nullable(),
  bumps: z.array(selectedBumpSchema),
  paymentMethod: z.enum(['pix', 'card', 'mercadopago']),
  card: cardSchema.optional(),
})
  .refine(
    (data) => data.paymentMethod !== 'card' || data.card !== undefined,
    { message: 'Dados do cartão obrigatórios para pagamento com cartão', path: ['card'] },
  )

export type CreateOrderValues = z.infer<typeof createOrderSchema>
