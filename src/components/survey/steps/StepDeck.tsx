'use client'

/**
 * StepDeck — Pergunta com vários itens para avaliar (Q2 e Q4).
 * Mesmo aqui é um item por tela: o deck cuida disso internamente.
 */

import { QuestionShell } from '../QuestionShell'
import { RatingDeck } from '../RatingDeck'
import type { RatingItem } from '@/config/survey'

interface StepDeckProps {
  question: string
  items: RatingItem[]
  values: Record<string, number>
  onChange: (key: string, value: number) => void
  onBack: () => void
  onNext: () => void
}

export function StepDeck({ question, items, values, onChange, onBack, onNext }: StepDeckProps) {
  return (
    <QuestionShell
      question={question}
      hint="Um item por vez. A tela avança sozinha depois da sua escolha."
    >
      <RatingDeck
        items={items}
        values={values}
        onChange={onChange}
        onExitBack={onBack}
        onComplete={onNext}
      />
    </QuestionShell>
  )
}
