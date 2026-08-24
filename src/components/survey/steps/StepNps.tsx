'use client'

/**
 * StepNps — A nota de indicação, de 0 a 10 (Q10).
 * Escala numérica em vez de estrelas: são onze valores e a pergunta
 * original é explicitamente de 0 a 10.
 */

import { QuestionShell } from '../QuestionShell'
import { NpsScale } from '../NpsScale'
import { StepNav } from '../StepNav'

interface StepNpsProps {
  value: number | null
  onAnswer: (value: number) => void
  onBack: () => void
  onNext: () => void
}

export function StepNps({ value, onAnswer, onBack, onNext }: StepNpsProps) {
  return (
    <QuestionShell
      question="De 0 a 10, o quanto você indicaria o O ENCONTRO para outro profissional de eventos?"
      hint="0 é não indicaria de jeito nenhum, 10 é indicaria com certeza."
    >
      <NpsScale value={value} onChange={onAnswer} ariaLabel="Nota de indicação de 0 a 10" />

      <StepNav onBack={onBack} onNext={onNext} nextDisabled={value === null} />
    </QuestionShell>
  )
}
