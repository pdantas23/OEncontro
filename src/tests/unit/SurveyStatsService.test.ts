/**
 * Testes da agregação dos resultados da pesquisa.
 */

import { describe, it, expect } from 'vitest'
import { computeSurveyStats, type SurveyResponseRow } from '@/services/SurveyStatsService'
import { EVENT_ASPECTS, SPEAKER_ASPECTS } from '@/config/survey'

function row(overrides: Partial<SurveyResponseRow> = {}): SurveyResponseRow {
  const base: Record<string, unknown> = {
    id: Math.random().toString(36).slice(2),
    created_at: '2026-08-20T12:00:00.000Z',
    survey_version: '2026.1',
    overall_rating: 5,
    content_relevance: 'muito_relevante',
    speaker_return: 'sim_com_certeza',
    highlight: 'experiencia',
    nps: 10,
    wanted_speakers: null,
    wanted_topics: null,
    improvement: null,
    one_word: null,
  }
  for (const aspect of EVENT_ASPECTS) base[`asp_${aspect.key}`] = 4
  for (const aspect of SPEAKER_ASPECTS) base[`spk_${aspect.key}`] = 4

  return { ...base, ...overrides } as SurveyResponseRow
}

describe('computeSurveyStats', () => {
  it('devolve zeros sem quebrar quando não há resposta', () => {
    const stats = computeSurveyStats([])
    expect(stats.total).toBe(0)
    expect(stats.overallAverage).toBe(0)
    expect(stats.npsScore).toBe(0)
    expect(stats.eventAverages).toHaveLength(EVENT_ASPECTS.length)
    expect(stats.openAnswers).toHaveLength(4)
  })

  it('calcula a média da nota geral', () => {
    const stats = computeSurveyStats([row({ overall_rating: 5 }), row({ overall_rating: 4 })])
    expect(stats.overallAverage).toBe(4.5)
  })

  it('classifica promotores, neutros e críticos pela nota de indicação', () => {
    const stats = computeSurveyStats([
      row({ nps: 10 }),
      row({ nps: 9 }),
      row({ nps: 8 }),
      row({ nps: 6 }),
    ])
    expect(stats.promoters).toBe(2)
    expect(stats.passives).toBe(1)
    expect(stats.detractors).toBe(1)
    // 50% promotores − 25% críticos
    expect(stats.npsScore).toBe(25)
  })

  it('ordena as médias do melhor para o pior item', () => {
    const stats = computeSurveyStats([
      row({ asp_alimentacao: 2, asp_organizacao: 5 } as Partial<SurveyResponseRow>),
    ])
    expect(stats.eventAverages[0].average).toBeGreaterThanOrEqual(
      stats.eventAverages[stats.eventAverages.length - 1].average,
    )
    expect(stats.eventAverages[stats.eventAverages.length - 1].key).toBe('alimentacao')
  })

  it('conta e percentua as opções de seleção', () => {
    const stats = computeSurveyStats([
      row({ content_relevance: 'muito_relevante' }),
      row({ content_relevance: 'muito_relevante' }),
      row({ content_relevance: 'relevante' }),
      row({ content_relevance: 'pouco_relevante' }),
    ])
    const muito = stats.relevance.find((r) => r.value === 'muito_relevante')
    expect(muito?.count).toBe(2)
    expect(muito?.percent).toBe(50)
  })

  it('ordena o ponto alto pelo mais citado', () => {
    const stats = computeSurveyStats([
      row({ highlight: 'networking' }),
      row({ highlight: 'networking' }),
      row({ highlight: 'palestra' }),
    ])
    expect(stats.highlight[0].value).toBe('networking')
    expect(stats.highlight[0].count).toBe(2)
  })

  it('ignora coluna aberta ausente sem quebrar', () => {
    // Uma linha vinda de um select parcial pode não trazer a coluna
    const partial = row()
    delete (partial as Record<string, unknown>).improvement
    expect(() => computeSurveyStats([partial])).not.toThrow()
    const group = computeSurveyStats([partial]).openAnswers.find((g) => g.key === 'improvement')
    expect(group?.answers).toHaveLength(0)
  })

  it('lista só as respostas abertas preenchidas', () => {
    const stats = computeSurveyStats([
      row({ improvement: 'Mais intervalo' }),
      row({ improvement: null }),
      row({ improvement: '   ' }),
    ])
    const group = stats.openAnswers.find((g) => g.key === 'improvement')
    expect(group?.answers).toHaveLength(1)
    expect(group?.answers[0].text).toBe('Mais intervalo')
  })
})
