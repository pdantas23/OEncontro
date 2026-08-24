'use client'

/**
 * StepOpenText — As quatro perguntas que não cabem em opção pronta
 * (Q6, Q7, Q9, Q11). Campo curto, limite visível, resposta opcional.
 */

import { useId } from 'react'
import { Input } from '@/components/ui/Input'
import { Textarea } from '@/components/ui/Textarea'
import { QuestionShell } from '../QuestionShell'
import { StepNav } from '../StepNav'
import { cn } from '@/utils/cn'

interface StepOpenTextProps {
  question: string
  hint?: string
  placeholder?: string
  value: string
  onChange: (value: string) => void
  maxLength: number
  multiline?: boolean
  onBack: () => void
  onNext: () => void
}

export function StepOpenText({
  question,
  hint,
  placeholder,
  value,
  onChange,
  maxLength,
  multiline = false,
  onBack,
  onNext,
}: StepOpenTextProps) {
  const id = useId()
  const remaining = maxLength - value.length
  const isEmpty = value.trim() === ''

  return (
    <QuestionShell question={question} hint={hint} optional>
      <div className="space-y-2">
        {multiline ? (
          <Textarea
            id={id}
            rows={3}
            maxLength={maxLength}
            placeholder={placeholder}
            value={value}
            onChange={(e) => onChange(e.target.value)}
            className="min-h-[76px] resize-none"
          />
        ) : (
          <Input
            id={id}
            maxLength={maxLength}
            placeholder={placeholder}
            value={value}
            onChange={(e) => onChange(e.target.value)}
          />
        )}

        <p
          className={cn(
            'text-right font-detail text-xs tabular-nums',
            remaining <= 20 ? 'text-warning' : 'text-muted-foreground',
          )}
        >
          {remaining} caracteres restantes
        </p>
      </div>

      <StepNav onBack={onBack} onNext={onNext} nextLabel={isEmpty ? 'Pular' : 'Continuar'} />
    </QuestionShell>
  )
}
