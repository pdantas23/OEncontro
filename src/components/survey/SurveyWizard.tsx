'use client'

/**
 * SurveyWizard — Conduz o questionário em 12 etapas, UMA PERGUNTA POR TELA.
 *
 * Ordem idêntica à do questionário original:
 *   1. Q1  nota geral (estrelas)       7. Q7  assuntos (aberta)
 *   2. Q2  o evento, 10 itens          8. Q8  ponto alto
 *   3. Q3  o conteúdo                  9. Q9  o que melhorar (aberta)
 *   4. Q4  a palestra, 7 itens        10. Q10 indicação de 0 a 10
 *   5. Q5  rever o palestrante        11. Q11 em uma palavra (aberta)
 *   6. Q6  quem ver (aberta)          12. revisão e envio
 *
 * Perguntas de escolha avançam sozinhas depois da resposta (ver autoAdvance
 * em SURVEY_STEPS) — quem volta para editar usa o botão Continuar.
 * Todo o estado vive no reducer, então navegar nunca perde resposta.
 */

import { useEffect, useReducer, useRef, useState } from 'react'
import {
  HIGHLIGHT_OPTIONS,
  RELEVANCE_OPTIONS,
  SPEAKER_ASPECTS,
  SPEAKER_NAME,
  SPEAKER_RETURN_OPTIONS,
  EVENT_ASPECTS,
  SURVEY_STEPS,
  TEXT_LIMITS,
  TOTAL_STEPS,
} from '@/config/survey'
import { ProgressBar } from '@/components/ui/ProgressBar'
import { SurveyHeader } from './SurveyHeader'
import { submitSurveyAction } from '@/app/pesquisa/actions'
import { StepStars } from './steps/StepStars'
import { StepDeck } from './steps/StepDeck'
import { StepChoice } from './steps/StepChoice'
import { StepOpenText } from './steps/StepOpenText'
import { StepNps } from './steps/StepNps'
import { StepReview } from './steps/StepReview'
import { SurveySuccess } from './SurveySuccess'
import type { SurveyAction, SurveyState } from '@/types/survey'

/** Tempo entre a escolha e a próxima pergunta — dá para ver a resposta marcada */
const AUTO_ADVANCE_MS = 450

// ---------------------------------------------------------------------------
// Reducer
// ---------------------------------------------------------------------------

const initialState: SurveyState = {
  step: 1,
  overall: null,
  eventAspects: {},
  contentRelevance: null,
  speakerAspects: {},
  speakerReturn: null,
  highlight: null,
  improvement: '',
  wantedSpeakers: '',
  wantedTopics: '',
  nps: null,
  oneWord: '',
}

function surveyReducer(state: SurveyState, action: SurveyAction): SurveyState {
  switch (action.type) {
    case 'SET_OVERALL':
      return { ...state, overall: action.value }
    case 'SET_EVENT_ASPECT':
      return { ...state, eventAspects: { ...state.eventAspects, [action.key]: action.value } }
    case 'SET_CONTENT_RELEVANCE':
      return { ...state, contentRelevance: action.value }
    case 'SET_SPEAKER_ASPECT':
      return { ...state, speakerAspects: { ...state.speakerAspects, [action.key]: action.value } }
    case 'SET_SPEAKER_RETURN':
      return { ...state, speakerReturn: action.value }
    case 'SET_HIGHLIGHT':
      return { ...state, highlight: action.value }
    case 'SET_NPS':
      return { ...state, nps: action.value }
    case 'SET_TEXT':
      return { ...state, [action.field]: action.value }
    case 'NEXT_STEP':
      return { ...state, step: Math.min(state.step + 1, TOTAL_STEPS) }
    case 'PREV_STEP':
      return { ...state, step: Math.max(state.step - 1, 1) }
    case 'GO_TO_STEP':
      return { ...state, step: Math.min(Math.max(action.step, 1), TOTAL_STEPS) }
    default:
      return state
  }
}

// ---------------------------------------------------------------------------
// Componente
// ---------------------------------------------------------------------------

export function SurveyWizard() {
  const [state, dispatch] = useReducer(surveyReducer, initialState)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [sent, setSent] = useState(false)

  const advanceTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    return () => {
      if (advanceTimer.current) clearTimeout(advanceTimer.current)
    }
  }, [])

  const stepMeta = SURVEY_STEPS[state.step - 1]
  const progress = ((state.step - 1) / (TOTAL_STEPS - 1)) * 100

  function cancelAdvance() {
    if (advanceTimer.current) clearTimeout(advanceTimer.current)
    advanceTimer.current = null
  }

  function scrollUp() {
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  function next() {
    cancelAdvance()
    dispatch({ type: 'NEXT_STEP' })
    scrollUp()
  }

  function prev() {
    cancelAdvance()
    dispatch({ type: 'PREV_STEP' })
    scrollUp()
  }

  function goTo(step: number) {
    cancelAdvance()
    dispatch({ type: 'GO_TO_STEP', step })
    scrollUp()
  }

  /** Registra a resposta e, nas etapas de escolha, segue sozinho para a próxima */
  function answer(action: SurveyAction) {
    dispatch(action)
    if (!stepMeta.autoAdvance) return
    cancelAdvance()
    advanceTimer.current = setTimeout(() => {
      dispatch({ type: 'NEXT_STEP' })
      scrollUp()
    }, AUTO_ADVANCE_MS)
  }

  async function handleSubmit() {
    setSubmitting(true)
    setError(null)

    const result = await submitSurveyAction({
      overall: state.overall,
      eventAspects: state.eventAspects,
      contentRelevance: state.contentRelevance,
      speakerAspects: state.speakerAspects,
      speakerReturn: state.speakerReturn,
      highlight: state.highlight,
      nps: state.nps,
      wantedSpeakers: state.wantedSpeakers,
      wantedTopics: state.wantedTopics,
      improvement: state.improvement,
      oneWord: state.oneWord,
    })

    setSubmitting(false)

    if (!result.success) {
      setError(result.error)
      return
    }

    setSent(true)
    scrollUp()
  }

  if (sent) {
    return (
      <div className="mx-auto w-full max-w-xl">
        <SurveyHeader compact />
        <SurveySuccess />
      </div>
    )
  }

  return (
    <div className="mx-auto w-full max-w-xl">
      <SurveyHeader compact={state.step > 1} />

      {/* Progresso */}
      <div className="mb-8">
        <div className="mb-2 flex items-baseline justify-between gap-4">
          <span className="font-detail text-xs font-medium uppercase tracking-wide text-primary">
            Pergunta {state.step} de {TOTAL_STEPS}
          </span>
          <span className="font-detail text-xs tabular-nums text-muted-foreground">
            {stepMeta.section}
          </span>
        </div>

        <ProgressBar value={progress} label={`Pergunta ${state.step} de ${TOTAL_STEPS}`} />
      </div>

      {/* Pergunta atual */}
      <div key={state.step} className="animate-slide-in-up">
        {state.step === 1 && (
          <StepStars
            isFirst
            value={state.overall}
            onAnswer={(value) => answer({ type: 'SET_OVERALL', value })}
            onBack={prev}
            onNext={next}
          />
        )}

        {state.step === 2 && (
          <StepDeck
            question="Dê uma nota de 1 a 5 para cada parte do evento"
            items={EVENT_ASPECTS}
            values={state.eventAspects}
            onChange={(key, value) => dispatch({ type: 'SET_EVENT_ASPECT', key, value })}
            onBack={prev}
            onNext={next}
          />
        )}

        {state.step === 3 && (
          <StepChoice
            question="O que foi apresentado na Imersão serve para o seu trabalho?"
            options={RELEVANCE_OPTIONS}
            value={state.contentRelevance}
            onAnswer={(value) => answer({ type: 'SET_CONTENT_RELEVANCE', value })}
            onBack={prev}
            onNext={next}
          />
        )}

        {state.step === 4 && (
          <StepDeck
            question={`Dê uma nota de 1 a 5 para a palestra de ${SPEAKER_NAME}`}
            items={SPEAKER_ASPECTS}
            values={state.speakerAspects}
            onChange={(key, value) => dispatch({ type: 'SET_SPEAKER_ASPECT', key, value })}
            onBack={prev}
            onNext={next}
          />
        )}

        {state.step === 5 && (
          <StepChoice
            question={`Você gostaria de ver ${SPEAKER_NAME} de novo em outras edições?`}
            options={SPEAKER_RETURN_OPTIONS}
            value={state.speakerReturn}
            onAnswer={(value) => answer({ type: 'SET_SPEAKER_RETURN', value })}
            onBack={prev}
            onNext={next}
          />
        )}

        {state.step === 6 && (
          <StepOpenText
            question="Quem você gostaria de ver nas próximas edições?"
            hint="Pode citar nomes."
            placeholder="Ex.: nome do profissional"
            value={state.wantedSpeakers}
            onChange={(value) => dispatch({ type: 'SET_TEXT', field: 'wantedSpeakers', value })}
            maxLength={TEXT_LIMITS.wantedSpeakers}
            onBack={prev}
            onNext={next}
          />
        )}

        {state.step === 7 && (
          <StepOpenText
            multiline
            question="E sobre quais assuntos?"
            hint="Temas que você quer ver na programação."
            placeholder="Ex.: precificação, contratos, atendimento ao cliente"
            value={state.wantedTopics}
            onChange={(value) => dispatch({ type: 'SET_TEXT', field: 'wantedTopics', value })}
            maxLength={TEXT_LIMITS.wantedTopics}
            onBack={prev}
            onNext={next}
          />
        )}

        {state.step === 8 && (
          <StepChoice
            twoColumns
            question="O que foi o ponto alto desta edição para você?"
            hint="Escolha o que mais se destacou."
            options={HIGHLIGHT_OPTIONS}
            value={state.highlight}
            onAnswer={(value) => answer({ type: 'SET_HIGHLIGHT', value })}
            onBack={prev}
            onNext={next}
          />
        )}

        {state.step === 9 && (
          <StepOpenText
            multiline
            question="O que você mudaria ou acrescentaria na próxima edição?"
            hint="Uma sugestão objetiva já ajuda muito."
            placeholder="Ex.: mais tempo para conversar entre os participantes"
            value={state.improvement}
            onChange={(value) => dispatch({ type: 'SET_TEXT', field: 'improvement', value })}
            maxLength={TEXT_LIMITS.improvement}
            onBack={prev}
            onNext={next}
          />
        )}

        {state.step === 10 && (
          <StepNps
            value={state.nps}
            onAnswer={(value) => answer({ type: 'SET_NPS', value })}
            onBack={prev}
            onNext={next}
          />
        )}

        {state.step === 11 && (
          <StepOpenText
            question="Em uma palavra ou frase: o que o O ENCONTRO foi para você?"
            placeholder="Ex.: virada de chave"
            value={state.oneWord}
            onChange={(value) => dispatch({ type: 'SET_TEXT', field: 'oneWord', value })}
            maxLength={TEXT_LIMITS.oneWord}
            onBack={prev}
            onNext={next}
          />
        )}

        {state.step === 12 && (
          <StepReview
            answers={state}
            onEdit={goTo}
            onBack={prev}
            onSubmit={handleSubmit}
            submitting={submitting}
            error={error}
          />
        )}
      </div>
    </div>
  )
}
