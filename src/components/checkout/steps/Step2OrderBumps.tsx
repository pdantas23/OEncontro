'use client'

/**
 * Step2OrderBumps — Produtos adicionais (order bumps).
 * Etapa 2 do checkout.
 */

import { useState } from 'react'
import { formatCurrency } from '@/utils/format'
import { Button } from '@/components/ui/Button'
import { cn } from '@/utils/cn'
import type { OrderBump } from '@/repositories/OrderBumpRepository'
import type { SelectedBump } from '@/types/checkout'

interface Step2OrderBumpsProps {
  bumps: OrderBump[]
  defaultSelected?: SelectedBump[]
  onNext: (selected: SelectedBump[]) => void
  onBack: () => void
}

const SIZES = ['PP', 'P', 'M', 'G', 'GG', 'XGG']

export function Step2OrderBumps({ bumps, defaultSelected = [], onNext, onBack }: Step2OrderBumpsProps) {
  const [selected, setSelected] = useState<SelectedBump[]>(defaultSelected)

  function toggle(bump: OrderBump) {
    setSelected((prev) => {
      const exists = prev.find((s) => s.id === bump.id)
      if (exists) return prev.filter((s) => s.id !== bump.id)
      return [...prev, { id: bump.id, name: bump.name, price: bump.price }]
    })
  }

  function setSize(bumpId: string, size: string) {
    setSelected((prev) =>
      prev.map((s) => (s.id === bumpId ? { ...s, size } : s)),
    )
  }

  function isSelected(id: string) {
    return selected.some((s) => s.id === id)
  }

  function getSelectedSize(id: string) {
    return selected.find((s) => s.id === id)?.size
  }

  if (bumps.length === 0) {
    return (
      <div className="space-y-6">
        <p className="text-sm text-muted-foreground">Nenhum item adicional disponível.</p>
        <div className="flex gap-3">
          <Button variant="outline" onClick={onBack} className="flex-1">
            Voltar
          </Button>
          <Button onClick={() => onNext([])} className="flex-1">
            Continuar
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <p className="text-sm text-muted-foreground">
        Adicione itens ao seu pedido antes de finalizar.
      </p>

      <ul className="space-y-3">
        {bumps.map((bump) => {
          const sel = isSelected(bump.id)
          return (
            <li key={bump.id}>
              <button
                type="button"
                onClick={() => toggle(bump)}
                className={cn(
                  'w-full rounded-lg border p-4 text-left transition-colors duration-150',
                  sel
                    ? 'border-primary bg-primary/5'
                    : 'border-border bg-card hover:border-primary/40',
                )}
                aria-pressed={sel}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <p className="font-medium text-foreground">{bump.name}</p>
                    {bump.description && (
                      <p className="mt-0.5 text-sm text-muted-foreground line-clamp-2">
                        {bump.description}
                      </p>
                    )}
                  </div>
                  <div className="flex shrink-0 items-center gap-2">
                    <span className="text-sm font-semibold text-primary">
                      + {formatCurrency(bump.price)}
                    </span>
                    <div
                      className={cn(
                        'flex h-5 w-5 items-center justify-center rounded border text-xs transition-colors',
                        sel ? 'border-primary bg-primary text-primary-foreground' : 'border-border',
                      )}
                      aria-hidden="true"
                    >
                      {sel && '✓'}
                    </div>
                  </div>
                </div>
              </button>

              {/* Seletor de tamanho */}
              {sel && bump.has_sizes && (
                <div className="mt-2 px-1">
                  <p className="mb-1.5 text-xs font-medium text-foreground">Escolha o tamanho:</p>
                  <div className="flex flex-wrap gap-2">
                    {SIZES.map((size) => (
                      <button
                        key={size}
                        type="button"
                        onClick={() => setSize(bump.id, size)}
                        className={cn(
                          'rounded border px-3 py-1 text-xs transition-colors',
                          getSelectedSize(bump.id) === size
                            ? 'border-primary bg-primary text-primary-foreground'
                            : 'border-border text-muted-foreground hover:border-primary/40',
                        )}
                      >
                        {size}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </li>
          )
        })}
      </ul>

      <div className="flex gap-3">
        <Button variant="outline" onClick={onBack} className="flex-1">
          Voltar
        </Button>
        <Button onClick={() => onNext(selected)} className="flex-1">
          Continuar
        </Button>
      </div>
    </div>
  )
}
