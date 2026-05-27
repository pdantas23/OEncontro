/**
 * T122 — Zod schema tests
 *
 * Valida que os schemas rejeitam dados inválidos com a mensagem correta
 * e aceitam dados válidos sem erro.
 */

import { describe, it, expect } from 'vitest'
import { step1Schema, createOrderSchema, cardSchema } from '@/lib/validations/checkout'

// ---------------------------------------------------------------------------
// step1Schema
// ---------------------------------------------------------------------------

describe('step1Schema', () => {
  const valid = {
    name: 'Maria Silva',
    email: 'maria@example.com',
    whatsapp: '11999999999',
  }

  it('aceita dados válidos sem CPF', () => {
    const result = step1Schema.safeParse(valid)
    expect(result.success).toBe(true)
  })

  it('aceita dados válidos com CPF de 11 dígitos', () => {
    const result = step1Schema.safeParse({ ...valid, cpf: '12345678901' })
    expect(result.success).toBe(true)
  })

  it('rejeita nome com menos de 3 caracteres', () => {
    const result = step1Schema.safeParse({ ...valid, name: 'Jo' })
    expect(result.success).toBe(false)
    if (!result.success) {
      expect(result.error.issues[0].message).toMatch(/3 caracteres/)
    }
  })

  it('rejeita e-mail inválido', () => {
    const result = step1Schema.safeParse({ ...valid, email: 'nao-eh-email' })
    expect(result.success).toBe(false)
    if (!result.success) {
      const messages = result.error.issues.map((i) => i.message)
      expect(messages.some((m) => /e-mail|email|invalid/i.test(m))).toBe(true)
    }
  })

  it('rejeita WhatsApp com menos de 10 dígitos', () => {
    const result = step1Schema.safeParse({ ...valid, whatsapp: '119' })
    expect(result.success).toBe(false)
    if (!result.success) {
      expect(result.error.issues[0].message).toMatch(/WhatsApp|10/)
    }
  })

  it('rejeita CPF com formato inválido (menos de 11 dígitos)', () => {
    const result = step1Schema.safeParse({ ...valid, cpf: '1234567' })
    expect(result.success).toBe(false)
    if (!result.success) {
      expect(result.error.issues[0].message).toMatch(/CPF|11/)
    }
  })

  it('rejeita CPF com formato inválido (13 dígitos)', () => {
    const result = step1Schema.safeParse({ ...valid, cpf: '1234567890123' })
    expect(result.success).toBe(false)
  })

  it('aceita CPF vazio string como ausente', () => {
    // CPF string vazia — refine só aplica se !v falso e v presente
    const result = step1Schema.safeParse({ ...valid, cpf: '' })
    expect(result.success).toBe(true)
  })
})

// ---------------------------------------------------------------------------
// cardSchema
// ---------------------------------------------------------------------------

describe('cardSchema', () => {
  const valid = {
    number: '4111111111111111',
    holderName: 'MARIA SILVA',
    expirationMonth: '12',
    expirationYear: String(new Date().getFullYear() + 1),
    cvv: '123',
  }

  it('aceita cartão válido', () => {
    const result = cardSchema.safeParse(valid)
    expect(result.success).toBe(true)
  })

  it('rejeita número de cartão muito curto', () => {
    const result = cardSchema.safeParse({ ...valid, number: '123456789' })
    expect(result.success).toBe(false)
  })

  it('rejeita mês inválido (0)', () => {
    const result = cardSchema.safeParse({ ...valid, expirationMonth: '00' })
    expect(result.success).toBe(false)
  })

  it('rejeita mês inválido (13)', () => {
    const result = cardSchema.safeParse({ ...valid, expirationMonth: '13' })
    expect(result.success).toBe(false)
  })

  it('rejeita ano expirado', () => {
    const result = cardSchema.safeParse({ ...valid, expirationYear: '2000' })
    expect(result.success).toBe(false)
    if (!result.success) {
      expect(result.error.issues[0].message).toMatch(/expirado|Cartão/i)
    }
  })

  it('rejeita CVV muito curto', () => {
    const result = cardSchema.safeParse({ ...valid, cvv: '12' })
    expect(result.success).toBe(false)
  })
})

// ---------------------------------------------------------------------------
// createOrderSchema
// ---------------------------------------------------------------------------

describe('createOrderSchema', () => {
  const validPix = {
    lotId: 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
    quantity: 2,
    buyerName: 'João Pereira',
    buyerEmail: 'joao@example.com',
    buyerWhatsapp: '11988887777',
    buyerCpf: null,
    bumps: [],
    paymentMethod: 'pix' as const,
    acceptImageRights: true as const,
    acceptImageRightsVersion: 'v1-2026-05-27',
    acceptPurchaseTerms: true as const,
    acceptPurchaseTermsVersion: 'v1-2026-05-27',
  }

  it('aceita pedido Pix válido', () => {
    const result = createOrderSchema.safeParse(validPix)
    expect(result.success).toBe(true)
  })

  it('rejeita lotId inválido (não UUID)', () => {
    const result = createOrderSchema.safeParse({ ...validPix, lotId: 'nao-eh-uuid' })
    expect(result.success).toBe(false)
    if (!result.success) {
      expect(result.error.issues[0].path).toContain('lotId')
    }
  })

  it('rejeita quantity = 0', () => {
    const result = createOrderSchema.safeParse({ ...validPix, quantity: 0 })
    expect(result.success).toBe(false)
  })

  it('rejeita quantity > 10', () => {
    const result = createOrderSchema.safeParse({ ...validPix, quantity: 11 })
    expect(result.success).toBe(false)
  })

  it('rejeita paymentMethod = card sem dados do cartão', () => {
    const result = createOrderSchema.safeParse({ ...validPix, paymentMethod: 'card' })
    expect(result.success).toBe(false)
    if (!result.success) {
      const paths = result.error.issues.map((i) => i.path.join('.'))
      expect(paths).toContain('card')
    }
  })

  it('aceita paymentMethod = card com dados válidos do cartão', () => {
    const result = createOrderSchema.safeParse({
      ...validPix,
      paymentMethod: 'card',
      card: {
        number: '4111111111111111',
        holderName: 'JOAO PEREIRA',
        expirationMonth: '12',
        expirationYear: String(new Date().getFullYear() + 1),
        cvv: '123',
      },
    })
    expect(result.success).toBe(true)
  })

  it('rejeita acceptImageRights = false', () => {
    const result = createOrderSchema.safeParse({ ...validPix, acceptImageRights: false })
    expect(result.success).toBe(false)
    if (!result.success) {
      const paths = result.error.issues.map((i) => i.path.join('.'))
      expect(paths).toContain('acceptImageRights')
    }
  })

  it('rejeita acceptImageRights ausente', () => {
    const { acceptImageRights: _omit, ...rest } = validPix
    void _omit
    const result = createOrderSchema.safeParse(rest)
    expect(result.success).toBe(false)
  })

  it('rejeita acceptImageRightsVersion vazio', () => {
    const result = createOrderSchema.safeParse({ ...validPix, acceptImageRightsVersion: '' })
    expect(result.success).toBe(false)
  })

  it('rejeita acceptPurchaseTerms = false', () => {
    const result = createOrderSchema.safeParse({ ...validPix, acceptPurchaseTerms: false })
    expect(result.success).toBe(false)
    if (!result.success) {
      const paths = result.error.issues.map((i) => i.path.join('.'))
      expect(paths).toContain('acceptPurchaseTerms')
    }
  })

  it('rejeita acceptPurchaseTerms ausente', () => {
    const { acceptPurchaseTerms: _omit, ...rest } = validPix
    void _omit
    const result = createOrderSchema.safeParse(rest)
    expect(result.success).toBe(false)
  })

  it('rejeita acceptPurchaseTermsVersion vazio', () => {
    const result = createOrderSchema.safeParse({ ...validPix, acceptPurchaseTermsVersion: '' })
    expect(result.success).toBe(false)
  })
})
