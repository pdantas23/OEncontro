'use client'

/**
 * QuestionShell — Moldura de uma pergunta.
 * Toda tela do questionário tem exatamente uma pergunta, e ela é sempre
 * apresentada aqui: enunciado, explicação opcional e o campo de resposta.
 */

import { cn } from '@/utils/cn'

export interface QuestionShellProps {
  question: string
  /** Explicação curta ou exemplo, quando o enunciado sozinho não basta */
  hint?: string
  optional?: boolean
  children: React.ReactNode
  className?: string
}

export function QuestionShell({
  question,
  hint,
  optional = false,
  children,
  className,
}: QuestionShellProps) {
  return (
    <div className={cn('space-y-6', className)}>
      <div>
        <div className="flex items-start justify-between gap-4">
          <h2 className="font-display text-2xl font-semibold leading-tight text-foreground">
            {question}
          </h2>
          {optional && (
            <span className="mt-1.5 shrink-0 font-detail text-xs uppercase tracking-wide text-muted-foreground">
              Opcional
            </span>
          )}
        </div>
        {hint && <p className="mt-2 text-sm text-muted-foreground">{hint}</p>}
      </div>

      {children}
    </div>
  )
}
