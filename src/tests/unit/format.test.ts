/**
 * src/tests/unit/format.test.ts
 *
 * Cobre apenas formatEventDaysLabel — demais formatters de format.ts
 * ainda sem cobertura (tarefa de outra task).
 */

import { describe, it, expect } from 'vitest'
import { formatEventDaysLabel } from '@/utils/format'

describe('formatEventDaysLabel', () => {
  it('retorna string vazia para null', () => {
    expect(formatEventDaysLabel(null)).toBe('')
  })

  it('retorna string vazia para undefined', () => {
    expect(formatEventDaysLabel(undefined)).toBe('')
  })

  it('retorna string vazia para array vazio', () => {
    expect(formatEventDaysLabel([])).toBe('')
  })

  it('formata um único dia', () => {
    expect(formatEventDaysLabel([17])).toBe('Dia 17')
  })

  it('formata dois dias', () => {
    expect(formatEventDaysLabel([18, 19])).toBe('Dias 18 e 19')
  })

  it('formata três dias', () => {
    expect(formatEventDaysLabel([17, 18, 19])).toBe('Dias 17, 18 e 19')
  })

  it('ordena array desordenado em ASC', () => {
    expect(formatEventDaysLabel([19, 17, 18])).toBe('Dias 17, 18 e 19')
  })

  it('deduplica valores repetidos (único restante)', () => {
    expect(formatEventDaysLabel([17, 17])).toBe('Dia 17')
  })

  it('deduplica preservando múltiplos únicos', () => {
    expect(formatEventDaysLabel([17, 17, 18])).toBe('Dias 17 e 18')
  })

  // --- Edge cases (Ajuste B) ---

  it('lida com dia único de número alto (sem hardcode de range)', () => {
    expect(formatEventDaysLabel([99])).toBe('Dia 99')
  })

  it('combina ordenação e dedup defensivos num único caso', () => {
    expect(formatEventDaysLabel([19, 18, 19, 17, 18])).toBe('Dias 17, 18 e 19')
  })

  it('formata quatro ou mais dias (funciona pra qualquer N)', () => {
    expect(formatEventDaysLabel([15, 16, 17, 18])).toBe('Dias 15, 16, 17 e 18')
  })
})
