/**
 * src/types/survey.ts
 *
 * Estado e ações do wizard da pesquisa de satisfação.
 * As chaves de `eventAspects` / `speakerAspects` são as `key` definidas
 * em @/config/survey (EVENT_ASPECTS e SPEAKER_ASPECTS).
 */

export type TextField = 'wantedSpeakers' | 'wantedTopics' | 'improvement' | 'oneWord'

export interface SurveyAnswers {
  /** Q1 — 1 a 5 */
  overall: number | null
  /** Q2 — key do aspecto → 1 a 5 */
  eventAspects: Record<string, number>
  /** Q3 */
  contentRelevance: string | null
  /** Q4 — key do aspecto → 1 a 5 */
  speakerAspects: Record<string, number>
  /** Q5 */
  speakerReturn: string | null
  /** Q8 */
  highlight: string | null
  /** Q9 — aberta */
  improvement: string
  /** Q6 — aberta */
  wantedSpeakers: string
  /** Q7 — aberta */
  wantedTopics: string
  /** Q10 — 0 a 10 */
  nps: number | null
  /** Q11 — aberta */
  oneWord: string
}

export interface SurveyState extends SurveyAnswers {
  /** Etapa atual, base 1 */
  step: number
}

export type SurveyAction =
  | { type: 'SET_OVERALL'; value: number }
  | { type: 'SET_EVENT_ASPECT'; key: string; value: number }
  | { type: 'SET_CONTENT_RELEVANCE'; value: string }
  | { type: 'SET_SPEAKER_ASPECT'; key: string; value: number }
  | { type: 'SET_SPEAKER_RETURN'; value: string }
  | { type: 'SET_HIGHLIGHT'; value: string }
  | { type: 'SET_NPS'; value: number }
  | { type: 'SET_TEXT'; field: TextField; value: string }
  | { type: 'NEXT_STEP' }
  | { type: 'PREV_STEP' }
  | { type: 'GO_TO_STEP'; step: number }

export type SubmitSurveyResult =
  | { success: true }
  | { success: false; error: string }
