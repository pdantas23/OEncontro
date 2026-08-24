/**
 * src/lib/validations/survey.ts
 *
 * Schema Zod da pesquisa de satisfação.
 * Espelha os CHECK constraints da migration 20240016_survey_responses.sql —
 * as listas de valores válidos são derivadas de @/config/survey para que
 * schema, UI e banco nunca saiam de sincronia.
 */

import { z } from 'zod'
import {
  EVENT_ASPECTS,
  HIGHLIGHT_OPTIONS,
  NPS_MAX,
  NPS_MIN,
  RELEVANCE_OPTIONS,
  SPEAKER_ASPECTS,
  SPEAKER_RETURN_OPTIONS,
  TEXT_LIMITS,
} from '@/config/survey'

const rating = z.number().int().min(1).max(5)

/** Record<key, 1..5> que exige exatamente as chaves informadas */
function aspectsSchema(keys: string[], label: string) {
  return z.record(z.string(), rating).refine(
    (value) => keys.every((k) => typeof value[k] === 'number'),
    { message: `Responda todos os itens de ${label}` },
  )
}

const valuesOf = (options: ReadonlyArray<{ value: string }>) =>
  options.map((o) => o.value) as [string, ...string[]]

/** Campo aberto opcional: vazio vira undefined, com limite curto de caracteres */
const openText = (max: number) =>
  z
    .string()
    .trim()
    .max(max, `Use no máximo ${max} caracteres`)
    .optional()
    .transform((v) => (v ? v : undefined))

export const surveyAnswersSchema = z.object({
  overall: rating,
  eventAspects: aspectsSchema(
    EVENT_ASPECTS.map((a) => a.key),
    'Como foi o evento',
  ),
  contentRelevance: z.enum(valuesOf(RELEVANCE_OPTIONS)),
  speakerAspects: aspectsSchema(
    SPEAKER_ASPECTS.map((a) => a.key),
    'A palestra',
  ),
  speakerReturn: z.enum(valuesOf(SPEAKER_RETURN_OPTIONS)),
  highlight: z.enum(valuesOf(HIGHLIGHT_OPTIONS)),
  nps: z.number().int().min(NPS_MIN).max(NPS_MAX),

  // Abertas — opcionais
  wantedSpeakers: openText(TEXT_LIMITS.wantedSpeakers),
  wantedTopics: openText(TEXT_LIMITS.wantedTopics),
  improvement: openText(TEXT_LIMITS.improvement),
  oneWord: openText(TEXT_LIMITS.oneWord),
})

export type SurveyAnswersValues = z.infer<typeof surveyAnswersSchema>
