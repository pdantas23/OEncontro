/**
 * Testes do schema da pesquisa de satisfação.
 *
 * Garante que o questionário só é aceito completo e que as quatro perguntas
 * abertas continuam opcionais.
 */

import { describe, it, expect } from 'vitest'
import { surveyAnswersSchema } from '@/lib/validations/survey'
import {
  EVENT_ASPECTS,
  HIGHLIGHT_OPTIONS,
  RELEVANCE_OPTIONS,
  SPEAKER_ASPECTS,
  SPEAKER_RETURN_OPTIONS,
  TEXT_LIMITS,
} from '@/config/survey'

function fill(keys: string[], value = 4): Record<string, number> {
  return Object.fromEntries(keys.map((k) => [k, value]))
}

const valid = {
  overall: 5,
  eventAspects: fill(EVENT_ASPECTS.map((a) => a.key)),
  contentRelevance: 'muito_relevante',
  speakerAspects: fill(SPEAKER_ASPECTS.map((a) => a.key)),
  speakerReturn: 'sim_com_certeza',
  highlight: 'experiencia',
  nps: 10,
}

describe('surveyAnswersSchema', () => {
  it('aceita o questionário completo sem nenhuma resposta aberta', () => {
    expect(surveyAnswersSchema.safeParse(valid).success).toBe(true)
  })

  it('aceita as quatro respostas abertas preenchidas', () => {
    const result = surveyAnswersSchema.safeParse({
      ...valid,
      wantedSpeakers: 'Fulano de Tal',
      wantedTopics: 'Precificação',
      improvement: 'Mais tempo de intervalo',
      oneWord: 'Virada de chave',
    })
    expect(result.success).toBe(true)
  })

  it('rejeita quando falta um aspecto do evento', () => {
    const incomplete = { ...valid.eventAspects }
    delete incomplete[EVENT_ASPECTS[0].key]
    const result = surveyAnswersSchema.safeParse({ ...valid, eventAspects: incomplete })
    expect(result.success).toBe(false)
  })

  it('rejeita quando falta um item da palestra', () => {
    const incomplete = { ...valid.speakerAspects }
    delete incomplete[SPEAKER_ASPECTS[0].key]
    const result = surveyAnswersSchema.safeParse({ ...valid, speakerAspects: incomplete })
    expect(result.success).toBe(false)
  })

  it('rejeita nota fora da escala de 1 a 5', () => {
    expect(surveyAnswersSchema.safeParse({ ...valid, overall: 6 }).success).toBe(false)
    expect(surveyAnswersSchema.safeParse({ ...valid, overall: 0 }).success).toBe(false)
  })

  it('rejeita nota de indicação fora de 0 a 10', () => {
    expect(surveyAnswersSchema.safeParse({ ...valid, nps: 11 }).success).toBe(false)
    expect(surveyAnswersSchema.safeParse({ ...valid, nps: -1 }).success).toBe(false)
  })

  it('rejeita opção que não existe no questionário', () => {
    expect(surveyAnswersSchema.safeParse({ ...valid, highlight: 'buffet' }).success).toBe(false)
    expect(surveyAnswersSchema.safeParse({ ...valid, contentRelevance: 'talvez' }).success).toBe(false)
    expect(surveyAnswersSchema.safeParse({ ...valid, speakerReturn: 'sim' }).success).toBe(false)
  })

  it('rejeita resposta aberta acima do limite de caracteres', () => {
    const result = surveyAnswersSchema.safeParse({
      ...valid,
      oneWord: 'a'.repeat(TEXT_LIMITS.oneWord + 1),
    })
    expect(result.success).toBe(false)
  })

  it('transforma resposta aberta vazia em undefined', () => {
    const result = surveyAnswersSchema.safeParse({ ...valid, improvement: '   ' })
    expect(result.success).toBe(true)
    if (result.success) expect(result.data.improvement).toBeUndefined()
  })

  it('mantém as opções da UI em sincronia com os valores aceitos', () => {
    for (const option of RELEVANCE_OPTIONS) {
      expect(
        surveyAnswersSchema.safeParse({ ...valid, contentRelevance: option.value }).success,
      ).toBe(true)
    }
    for (const option of SPEAKER_RETURN_OPTIONS) {
      expect(
        surveyAnswersSchema.safeParse({ ...valid, speakerReturn: option.value }).success,
      ).toBe(true)
    }
    for (const option of HIGHLIGHT_OPTIONS) {
      expect(surveyAnswersSchema.safeParse({ ...valid, highlight: option.value }).success).toBe(true)
    }
  })
})
