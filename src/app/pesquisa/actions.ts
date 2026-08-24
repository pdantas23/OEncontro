// Client-side — sem 'use server' (o projeto usa output: 'export')
import { createClient } from '@/lib/supabase/client'
import { surveyAnswersSchema } from '@/lib/validations/survey'
import { SURVEY_VERSION } from '@/config/survey'
import type { Database } from '@/types/database'
import type { SubmitSurveyResult } from '@/types/survey'

type SurveyInsert = Database['public']['Tables']['survey_responses_encontro']['Insert']

export async function submitSurveyAction(input: unknown): Promise<SubmitSurveyResult> {
  const parsed = surveyAnswersSchema.safeParse(input)
  if (!parsed.success) {
    return { success: false, error: 'Faltou responder alguma pergunta. Confira as etapas anteriores.' }
  }

  const a = parsed.data

  const row: SurveyInsert = {
    survey_version: SURVEY_VERSION,

    overall_rating: a.overall,

    asp_organizacao: a.eventAspects.organizacao,
    asp_credenciamento: a.eventAspects.credenciamento,
    asp_local: a.eventAspects.local,
    asp_alimentacao: a.eventAspects.alimentacao,
    asp_programacao: a.eventAspects.programacao,
    asp_pontualidade: a.eventAspects.pontualidade,
    asp_experiencia: a.eventAspects.experiencia,
    asp_comunicacao: a.eventAspects.comunicacao,
    asp_networking: a.eventAspects.networking,
    asp_equipe: a.eventAspects.equipe,

    content_relevance: a.contentRelevance,

    spk_qualidade: a.speakerAspects.qualidade,
    spk_relevancia: a.speakerAspects.relevancia,
    spk_aplicabilidade: a.speakerAspects.aplicabilidade,
    spk_didatica: a.speakerAspects.didatica,
    spk_dominio: a.speakerAspects.dominio,
    spk_inspiracao: a.speakerAspects.inspiracao,
    spk_experiencia: a.speakerAspects.experiencia,

    speaker_return: a.speakerReturn,
    highlight: a.highlight,
    nps: a.nps,

    wanted_speakers: a.wantedSpeakers ?? null,
    wanted_topics: a.wantedTopics ?? null,
    improvement: a.improvement ?? null,
    one_word: a.oneWord ?? null,
  }

  try {
    const supabase = createClient()
    const { error } = await supabase.from('survey_responses_encontro').insert(row)

    if (error) {
      console.error('[submitSurveyAction]', error.message)
      return { success: false, error: 'Não conseguimos enviar sua resposta. Tente novamente.' }
    }

    return { success: true }
  } catch (err) {
    console.error('[submitSurveyAction] Unexpected error:', err)
    return { success: false, error: 'Não conseguimos enviar sua resposta. Tente novamente.' }
  }
}
