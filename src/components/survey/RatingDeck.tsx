'use client'

/**
 * RatingDeck — Apresenta uma lista de itens para avaliar UM DE CADA VEZ.
 *
 * Evita o paredão de 10 (ou 7) linhas de nota na mesma tela: cada item vira
 * uma pergunta só, com avanço automático depois da escolha. Os pontinhos no
 * topo mostram o que já foi respondido e permitem voltar a qualquer item.
 */

import { useEffect, useRef, useState } from 'react'
import { Button } from '@/components/ui/Button'
import { StarSelect } from './StarSelect'
import { cn } from '@/utils/cn'
import { SCALE_OPTIONS, type RatingItem } from '@/config/survey'

const AUTO_ADVANCE_MS = 320

export interface RatingDeckProps {
  items: RatingItem[]
  values: Record<string, number>
  onChange: (key: string, value: number) => void
  /** Chamado quando o usuário pede para voltar já estando no primeiro item */
  onExitBack: () => void
  /** Chamado no "Continuar", com todos os itens respondidos */
  onComplete: () => void
}

export function RatingDeck({ items, values, onChange, onExitBack, onComplete }: RatingDeckProps) {
  // Retoma no primeiro item sem resposta — útil ao voltar de outra etapa
  const [index, setIndex] = useState(() => {
    const firstUnanswered = items.findIndex((item) => values[item.key] === undefined)
    return firstUnanswered === -1 ? 0 : firstUnanswered
  })

  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current)
    }
  }, [])

  const current = items[index]
  const answeredCount = items.filter((item) => values[item.key] !== undefined).length
  const allAnswered = answeredCount === items.length
  const isLast = index === items.length - 1

  function handleSelect(value: number) {
    onChange(current.key, value)

    if (isLast) return
    if (timerRef.current) clearTimeout(timerRef.current)
    timerRef.current = setTimeout(() => setIndex((i) => Math.min(i + 1, items.length - 1)), AUTO_ADVANCE_MS)
  }

  function handleBack() {
    if (timerRef.current) clearTimeout(timerRef.current)
    if (index === 0) {
      onExitBack()
      return
    }
    setIndex(index - 1)
  }

  function handleNext() {
    if (timerRef.current) clearTimeout(timerRef.current)
    if (allAnswered) {
      onComplete()
      return
    }
    const nextUnanswered = items.findIndex(
      (item, i) => i > index && values[item.key] === undefined,
    )
    setIndex(nextUnanswered === -1 ? Math.min(index + 1, items.length - 1) : nextUnanswered)
  }

  return (
    <div className="space-y-6">
      {/* Pontinhos — progresso dentro da etapa */}
      <div className="flex items-center gap-3">
        <div className="flex flex-1 flex-wrap gap-1.5">
          {items.map((item, i) => {
            const answered = values[item.key] !== undefined
            return (
              <button
                key={item.key}
                type="button"
                onClick={() => setIndex(i)}
                aria-label={`Ir para: ${item.label}`}
                aria-current={i === index ? 'true' : undefined}
                className={cn(
                  'h-2 flex-1 rounded-full transition-colors duration-200',
                  i === index
                    ? 'bg-primary ring-2 ring-primary/25'
                    : answered
                      ? 'bg-accent'
                      : 'bg-muted',
                )}
              />
            )
          })}
        </div>
        <span className="shrink-0 font-detail text-xs tabular-nums text-muted-foreground">
          {index + 1}/{items.length}
        </span>
      </div>

      {/* Item atual */}
      <div key={current.key} className="animate-slide-in-up">
        <h3 className="font-display text-xl font-semibold leading-tight text-foreground">
          {current.label}
        </h3>
        {current.hint && (
          <p className="mt-1 text-sm text-muted-foreground">{current.hint}</p>
        )}

        <div className="mt-6">
          <StarSelect
            value={values[current.key]}
            onChange={handleSelect}
            options={SCALE_OPTIONS}
            ariaLabel={`${current.label} — nota de 1 a 5 estrelas`}
          />
        </div>
      </div>

      <div className="flex gap-3">
        <Button variant="outline" onClick={handleBack} className="flex-1">
          Voltar
        </Button>
        <Button
          onClick={handleNext}
          disabled={!allAnswered && values[current.key] === undefined}
          className="flex-1"
        >
          {allAnswered ? 'Continuar' : 'Próximo'}
        </Button>
      </div>

      {!allAnswered && (
        <p className="text-center font-detail text-xs text-muted-foreground">
          {answeredCount} de {items.length} respondidos
        </p>
      )}
    </div>
  )
}
