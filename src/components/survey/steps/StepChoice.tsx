'use client'

/**
 * StepChoice — Pergunta de seleção única em cards grandes (Q3, Q5, Q8).
 */

import { QuestionShell } from '../QuestionShell'
import { OptionCard } from '../OptionCard'
import { StepNav } from '../StepNav'
import { cn } from '@/utils/cn'
import type { ChoiceOption } from '@/config/survey'

interface StepChoiceProps {
  question: string
  hint?: string
  options: ChoiceOption[]
  value: string | null
  onAnswer: (value: string) => void
  onBack: () => void
  onNext: () => void
  /** Listas longas ganham duas colunas em telas maiores */
  twoColumns?: boolean
}

export function StepChoice({
  question,
  hint,
  options,
  value,
  onAnswer,
  onBack,
  onNext,
  twoColumns = false,
}: StepChoiceProps) {
  return (
    <QuestionShell question={question} hint={hint}>
      <div className={cn('grid gap-2.5', twoColumns && 'sm:grid-cols-2')}>
        {options.map((option) => (
          <OptionCard
            key={option.value}
            label={option.label}
            description={option.description}
            selected={value === option.value}
            onSelect={() => onAnswer(option.value)}
          />
        ))}
      </div>

      <StepNav onBack={onBack} onNext={onNext} nextDisabled={!value} />
    </QuestionShell>
  )
}
