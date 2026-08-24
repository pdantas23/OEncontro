/**
 * src/services/SurveyStatsService.ts
 *
 * Agrega as respostas da pesquisa de satisfação em números prontos para a tela.
 * Função pura — recebe as linhas do Supabase e devolve as médias, as contagens
 * e as respostas abertas. Nenhum acesso a rede aqui, o que deixa a conta testável.
 */

import {
  EVENT_ASPECTS,
  HIGHLIGHT_OPTIONS,
  RELEVANCE_OPTIONS,
  SPEAKER_ASPECTS,
  SPEAKER_RETURN_OPTIONS,
  type ChoiceOption,
  type RatingItem,
} from '@/config/survey'
import type { Database } from '@/types/database'

export type SurveyResponseRow = Database['public']['Tables']['survey_responses_encontro']['Row']

export interface AverageItem {
  key: string
  label: string
  average: number
}

export interface BreakdownItem {
  value: string
  label: string
  count: number
  percent: number
}

export interface OpenAnswer {
  id: string
  createdAt: string
  text: string
}

export interface OpenAnswerGroup {
  key: string
  question: string
  answers: OpenAnswer[]
}

export interface SurveyStats {
  total: number
  /** Média da Q1 (1–5) */
  overallAverage: number
  /** Média da Q10 (0–10) */
  npsAverage: number
  promoters: number
  passives: number
  detractors: number
  /** % promotores − % detratores, de −100 a 100 */
  npsScore: number
  eventAverages: AverageItem[]
  speakerAverages: AverageItem[]
  relevance: BreakdownItem[]
  speakerReturn: BreakdownItem[]
  highlight: BreakdownItem[]
  openAnswers: OpenAnswerGroup[]
}

function round(value: number, decimals = 1): number {
  const factor = 10 ** decimals
  return Math.round(value * factor) / factor
}

function average(values: number[]): number {
  if (values.length === 0) return 0
  return round(values.reduce((sum, v) => sum + v, 0) / values.length, 2)
}

function averagesFor(
  rows: SurveyResponseRow[],
  items: RatingItem[],
  prefix: 'asp_' | 'spk_',
): AverageItem[] {
  return items
    .map((item) => {
      const column = `${prefix}${item.key}` as keyof SurveyResponseRow
      const values = rows
        .map((row) => row[column])
        .filter((v): v is number => typeof v === 'number')

      return { key: item.key, label: item.label, average: average(values) }
    })
    .sort((a, b) => b.average - a.average)
}

function breakdownFor(
  rows: SurveyResponseRow[],
  column: 'content_relevance' | 'speaker_return' | 'highlight',
  options: ChoiceOption[],
  sortByCount = false,
): BreakdownItem[] {
  const items = options.map((option) => {
    const count = rows.filter((row) => row[column] === option.value).length
    return {
      value: option.value,
      label: option.label,
      count,
      percent: rows.length > 0 ? round((count / rows.length) * 100) : 0,
    }
  })

  return sortByCount ? items.sort((a, b) => b.count - a.count) : items
}

function openAnswersFor(
  rows: SurveyResponseRow[],
  column: 'wanted_speakers' | 'wanted_topics' | 'improvement' | 'one_word',
): OpenAnswer[] {
  return rows
    .map((row) => ({
      id: row.id,
      createdAt: row.created_at,
      text: typeof row[column] === 'string' ? row[column].trim() : '',
    }))
    .filter((answer) => answer.text !== '')
}

export function computeSurveyStats(rows: SurveyResponseRow[]): SurveyStats {
  const total = rows.length
  const npsValues = rows.map((row) => row.nps).filter((v): v is number => typeof v === 'number')

  const promoters = npsValues.filter((v) => v >= 9).length
  const passives = npsValues.filter((v) => v >= 7 && v <= 8).length
  const detractors = npsValues.filter((v) => v <= 6).length

  return {
    total,
    overallAverage: average(rows.map((row) => row.overall_rating)),
    npsAverage: average(npsValues),
    promoters,
    passives,
    detractors,
    npsScore:
      npsValues.length > 0
        ? Math.round((promoters / npsValues.length) * 100 - (detractors / npsValues.length) * 100)
        : 0,
    eventAverages: averagesFor(rows, EVENT_ASPECTS, 'asp_'),
    speakerAverages: averagesFor(rows, SPEAKER_ASPECTS, 'spk_'),
    relevance: breakdownFor(rows, 'content_relevance', RELEVANCE_OPTIONS),
    speakerReturn: breakdownFor(rows, 'speaker_return', SPEAKER_RETURN_OPTIONS),
    highlight: breakdownFor(rows, 'highlight', HIGHLIGHT_OPTIONS, true),
    openAnswers: [
      {
        key: 'improvement',
        question: 'O que mudaria ou acrescentaria na próxima edição',
        answers: openAnswersFor(rows, 'improvement'),
      },
      {
        key: 'wanted_speakers',
        question: 'Quem gostaria de ver nas próximas edições',
        answers: openAnswersFor(rows, 'wanted_speakers'),
      },
      {
        key: 'wanted_topics',
        question: 'Assuntos que gostaria de ver',
        answers: openAnswersFor(rows, 'wanted_topics'),
      },
      {
        key: 'one_word',
        question: 'O que o O ENCONTRO representou, em uma palavra',
        answers: openAnswersFor(rows, 'one_word'),
      },
    ],
  }
}
