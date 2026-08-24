'use client'

/**
 * SurveyHeader — Cabeçalho da pesquisa.
 * Na primeira etapa apresenta a pesquisa por inteiro; a partir da segunda
 * encolhe para uma linha, liberando a tela para a pergunta.
 */

import { cn } from '@/utils/cn'

export interface SurveyHeaderProps {
  compact: boolean
}

export function SurveyHeader({ compact }: SurveyHeaderProps) {
  return (
    <header className={cn('text-center', compact ? 'mb-6' : 'mb-10')}>
      <p className="font-detail text-xs font-medium uppercase tracking-[0.2em] text-accent">
        O ENCONTRO
      </p>

      <h1
        className={cn(
          'mt-2 font-display font-bold leading-tight text-foreground transition-all',
          compact ? 'text-xl' : 'text-3xl sm:text-4xl',
        )}
      >
        Queremos ouvir você
      </h1>

      {!compact && (
        <p className="mx-auto mt-3 max-w-md text-sm text-muted-foreground">
          Sua opinião é o que constrói a próxima edição. São perguntas curtas,
          uma tela de cada vez — responda com sinceridade.
        </p>
      )}
    </header>
  )
}
