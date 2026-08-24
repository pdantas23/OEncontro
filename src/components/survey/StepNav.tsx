'use client'

/**
 * StepNav — Rodapé padrão das etapas: voltar e avançar.
 * A ação principal fica sempre à direita e em destaque.
 */

import { Button } from '@/components/ui/Button'

export interface StepNavProps {
  onBack: () => void
  onNext: () => void
  nextLabel?: string
  nextDisabled?: boolean
  /** Some com o botão voltar na primeira etapa */
  hideBack?: boolean
  helper?: string
}

export function StepNav({
  onBack,
  onNext,
  nextLabel = 'Continuar',
  nextDisabled = false,
  hideBack = false,
  helper,
}: StepNavProps) {
  return (
    <div className="space-y-3">
      <div className="flex gap-3">
        {!hideBack && (
          <Button variant="outline" onClick={onBack} className="flex-1">
            Voltar
          </Button>
        )}
        <Button onClick={onNext} disabled={nextDisabled} className="flex-1">
          {nextLabel}
        </Button>
      </div>

      {helper && (
        <p className="text-center font-detail text-xs text-muted-foreground">{helper}</p>
      )}
    </div>
  )
}
