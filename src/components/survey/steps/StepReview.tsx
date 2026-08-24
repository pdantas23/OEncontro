'use client'

/**
 * StepReview — Confere tudo antes de enviar.
 *
 * Um bloco por pergunta, cada um com "Editar" apontando para a etapa
 * daquela pergunta (ver STEP_OF em @/config/survey). Voltar para ajustar
 * não perde nenhuma resposta.
 */

import { Pencil } from 'lucide-react'
import {
  STEP_OF,
  EVENT_ASPECTS,
  HIGHLIGHT_OPTIONS,
  RELEVANCE_OPTIONS,
  SPEAKER_ASPECTS,
  SPEAKER_NAME,
  SPEAKER_RETURN_OPTIONS,
  overallLabel,
  scaleLabel,
  type ChoiceOption,
} from '@/config/survey'
import { Button } from '@/components/ui/Button'
import { StarRating } from '@/components/ui/StarRating'
import type { SurveyAnswers } from '@/types/survey'

interface StepReviewProps {
  answers: SurveyAnswers
  onEdit: (step: number) => void
  onBack: () => void
  onSubmit: () => void
  submitting: boolean
  error: string | null
}

function optionLabel(options: ChoiceOption[], value: string | null): string {
  return options.find((o) => o.value === value)?.label ?? '—'
}

const NOT_ANSWERED = 'Não respondeu'

function Block({
  title,
  step,
  onEdit,
  children,
}: {
  title: string
  step: number
  onEdit: (step: number) => void
  children: React.ReactNode
}) {
  return (
    <section className="rounded-lg border border-border bg-secondary p-4">
      <div className="mb-2.5 flex items-start justify-between gap-3">
        <h3 className="font-display text-base font-semibold leading-snug text-foreground">
          {title}
        </h3>
        <button
          type="button"
          onClick={() => onEdit(step)}
          aria-label={`Editar: ${title}`}
          className="mt-0.5 inline-flex shrink-0 items-center gap-1 rounded font-detail text-xs font-medium text-primary transition-colors hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          <Pencil className="h-3 w-3" aria-hidden="true" />
          Editar
        </button>
      </div>
      {children}
    </section>
  )
}

/** Resposta única — vem em destaque, sem repetir a pergunta como rótulo */
function Answer({ children }: { children: React.ReactNode }) {
  return <p className="text-sm font-medium text-foreground">{children}</p>
}

/** Lista de itens avaliados (perguntas 2 e 4) */
function ItemList({
  items,
  values,
}: {
  items: { key: string; label: string }[]
  values: Record<string, number>
}) {
  return (
    <dl className="space-y-1.5">
      {items.map((item) => (
        <div key={item.key} className="flex items-baseline justify-between gap-4 text-sm">
          <dt className="min-w-0 text-muted-foreground">{item.label}</dt>
          <dd className="shrink-0 text-right font-medium text-foreground">
            {values[item.key] ? `${values[item.key]} · ${scaleLabel(values[item.key])}` : '—'}
          </dd>
        </div>
      ))}
    </dl>
  )
}

export function StepReview({
  answers,
  onEdit,
  onBack,
  onSubmit,
  submitting,
  error,
}: StepReviewProps) {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="font-display text-2xl font-semibold leading-tight text-foreground">
          Tudo certo?
        </h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Confira e ajuste o que quiser antes de enviar.
        </p>
      </div>

      <div className="space-y-3">
        <Block title="Sua experiência na Imersão" step={STEP_OF.overall} onEdit={onEdit}>
          <div className="flex items-center gap-2">
            <StarRating value={answers.overall ?? 0} size="sm" tone="accent" />
            <Answer>{answers.overall ? overallLabel(answers.overall) : '—'}</Answer>
          </div>
        </Block>

        <Block title="Como foi cada parte do evento" step={STEP_OF.eventAspects} onEdit={onEdit}>
          <ItemList items={EVENT_ASPECTS} values={answers.eventAspects} />
        </Block>

        <Block title="O conteúdo serve para o seu trabalho" step={STEP_OF.contentRelevance} onEdit={onEdit}>
          <Answer>{optionLabel(RELEVANCE_OPTIONS, answers.contentRelevance)}</Answer>
        </Block>

        <Block title={`A palestra do ${SPEAKER_NAME}`} step={STEP_OF.speakerAspects} onEdit={onEdit}>
          <ItemList items={SPEAKER_ASPECTS} values={answers.speakerAspects} />
        </Block>

        <Block title={`Ver ${SPEAKER_NAME} em outras edições`} step={STEP_OF.speakerReturn} onEdit={onEdit}>
          <Answer>{optionLabel(SPEAKER_RETURN_OPTIONS, answers.speakerReturn)}</Answer>
        </Block>

        <Block title="Quem você quer ver nas próximas edições" step={STEP_OF.wantedSpeakers} onEdit={onEdit}>
          <Answer>{answers.wantedSpeakers.trim() || NOT_ANSWERED}</Answer>
        </Block>

        <Block title="Assuntos para as próximas edições" step={STEP_OF.wantedTopics} onEdit={onEdit}>
          <Answer>{answers.wantedTopics.trim() || NOT_ANSWERED}</Answer>
        </Block>

        <Block title="O ponto alto desta edição" step={STEP_OF.highlight} onEdit={onEdit}>
          <Answer>{optionLabel(HIGHLIGHT_OPTIONS, answers.highlight)}</Answer>
        </Block>

        <Block title="O que mudaria na próxima edição" step={STEP_OF.improvement} onEdit={onEdit}>
          <Answer>{answers.improvement.trim() || NOT_ANSWERED}</Answer>
        </Block>

        <Block title="O quanto indicaria o O ENCONTRO" step={STEP_OF.nps} onEdit={onEdit}>
          <Answer>{answers.nps !== null ? `${answers.nps} de 10` : '—'}</Answer>
        </Block>

        <Block title="Em uma palavra" step={STEP_OF.oneWord} onEdit={onEdit}>
          <Answer>{answers.oneWord.trim() || NOT_ANSWERED}</Answer>
        </Block>
      </div>

      {error && (
        <p
          role="alert"
          className="rounded border border-destructive/40 bg-destructive/10 p-3 text-sm text-destructive"
        >
          {error}
        </p>
      )}

      <div className="flex gap-3">
        <Button variant="outline" onClick={onBack} disabled={submitting} className="flex-1">
          Voltar
        </Button>
        <Button onClick={onSubmit} loading={submitting} className="flex-1">
          Enviar respostas
        </Button>
      </div>
    </div>
  )
}
