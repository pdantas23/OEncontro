'use client'

/**
 * StepStars — Pergunta respondida em estrelas (Q1).
 */

import { OVERALL_OPTIONS } from '@/config/survey'
import { QuestionShell } from '../QuestionShell'
import { StarSelect } from '../StarSelect'
import { StepNav } from '../StepNav'

interface StepStarsProps {
  value: number | null
  onAnswer: (value: number) => void
  onBack: () => void
  onNext: () => void
  isFirst?: boolean
}

export function StepStars({ value, onAnswer, onBack, onNext, isFirst = false }: StepStarsProps) {
  return (
    <QuestionShell question="De modo geral, como foi a sua experiência na Imersão O ENCONTRO?">
      <div className="py-4">
        <StarSelect
          value={value ?? undefined}
          onChange={onAnswer}
          options={OVERALL_OPTIONS}
          ariaLabel="Nota geral da imersão, de 1 a 5 estrelas"
        />
      </div>

      <StepNav
        hideBack={isFirst}
        onBack={onBack}
        onNext={onNext}
        nextDisabled={value === null}
        helper={isFirst ? 'Leva menos de 3 minutos.' : undefined}
      />
    </QuestionShell>
  )
}
