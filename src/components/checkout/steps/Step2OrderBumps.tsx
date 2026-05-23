'use client'

/**
 * Step2OrderBumps — Produtos adicionais (order bumps) + combos de ingresso.
 * Etapa 2 do checkout.
 */

import { useState } from 'react'
import Image from 'next/image'
import { formatCurrency, formatEventDaysLabel } from '@/utils/format'
import { Button } from '@/components/ui/Button'
import { cn } from '@/utils/cn'
import type { OrderBump } from '@/repositories/OrderBumpRepository'
import type { SelectedBump } from '@/types/checkout'
import type { EligibleBump } from '@/types/bumps'

interface Step2OrderBumpsProps {
  bumps: OrderBump[]
  /**
   * Combos elegíveis de `GET /lots/:id/bumps`. Opcional aqui pra permitir
   * que a Task 12 isole o componente — o wiring final (Task 13) popula
   * com dados reais do endpoint.
   */
  combos?: EligibleBump[]
  defaultSelected?: SelectedBump[]
  onNext: (selected: SelectedBump[]) => void
  onBack: () => void
}

const SIZES = ['PP', 'P', 'M', 'G', 'GG', 'XGG']
const LOW_STOCK_THRESHOLD = 10

export function Step2OrderBumps({ bumps, combos = [], defaultSelected = [], onNext, onBack }: Step2OrderBumpsProps) {
  const [selected, setSelected] = useState<SelectedBump[]>(defaultSelected)

  function toggleMerch(bump: OrderBump) {
    setSelected((prev) => {
      const exists = prev.find((s) => s.id === bump.id && s.type !== 'ticket_lot')
      if (exists) return prev.filter((s) => !(s.id === bump.id && s.type !== 'ticket_lot'))
      return [...prev, { type: 'merchandise', id: bump.id, name: bump.name, price: bump.price }]
    })
  }

  function toggleCombo(combo: EligibleBump) {
    setSelected((prev) => {
      const alreadyPicked = prev.find((s) => s.type === 'ticket_lot' && s.id === combo.id)
      if (alreadyPicked) {
        return prev.filter((s) => !(s.type === 'ticket_lot' && s.id === combo.id))
      }
      // Mutex silencioso: remove qualquer combo do mesmo exclusivity_group
      const conflictGroupIds = combos
        .filter((c) => c.exclusivity_group === combo.exclusivity_group && c.id !== combo.id)
        .map((c) => c.id)
      const filtered = prev.filter(
        (s) => !(s.type === 'ticket_lot' && conflictGroupIds.includes(s.id)),
      )
      return [
        ...filtered,
        {
          type: 'ticket_lot',
          id: combo.id,
          ticket_lot_id: combo.ticket_lot_id,
          name: combo.name,
          price: combo.final_price,
          original_price: combo.original_price,
        },
      ]
    })
  }

  function setSize(bumpId: string, size: string) {
    setSelected((prev) =>
      prev.map((s) => (s.id === bumpId && s.type !== 'ticket_lot' ? { ...s, size } : s)),
    )
  }

  function isMerchSelected(id: string) {
    return selected.some((s) => s.id === id && s.type !== 'ticket_lot')
  }
  function isComboSelected(id: string) {
    return selected.some((s) => s.type === 'ticket_lot' && s.id === id)
  }
  function getSelectedSize(id: string) {
    return selected.find((s) => s.id === id && s.type !== 'ticket_lot')?.size
  }

  const hasCombos = combos.length > 0
  const hasMerch = bumps.length > 0

  if (!hasCombos && !hasMerch) {
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

      {hasCombos && (
        <section className="space-y-3">
          <h3 className="font-display text-sm font-semibold text-foreground">Combos com desconto</h3>
          <ul className="space-y-3">
            {combos.map((combo) => {
              const sel = isComboSelected(combo.id)
              const daysLabel = formatEventDaysLabel(combo.event_days)
              const lowStock = combo.available <= LOW_STOCK_THRESHOLD
              return (
                <li key={combo.id}>
                  <button
                    type="button"
                    onClick={() => toggleCombo(combo)}
                    className={cn(
                      'w-full rounded-lg border p-4 text-left transition-colors duration-150',
                      sel
                        ? 'border-primary bg-primary/5'
                        : 'border-border bg-card hover:border-primary/40',
                    )}
                    aria-pressed={sel}
                  >
                    <div className="flex items-start gap-3">
                      {combo.image_url && (
                        <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-md border border-border">
                          <Image
                            src={combo.image_url}
                            alt={combo.name}
                            fill
                            className="object-cover"
                            sizes="64px"
                          />
                        </div>
                      )}
                      <div className="min-w-0 flex-1">
                        <p className="font-medium text-foreground">{combo.name}</p>
                        {combo.description && (
                          <p className="mt-0.5 text-sm text-muted-foreground line-clamp-2">
                            {combo.description}
                          </p>
                        )}
                        <div className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-0.5 text-xs">
                          {daysLabel && (
                            <span className="text-muted-foreground">{daysLabel}</span>
                          )}
                          {lowStock && (
                            <span className="font-medium text-amber-400">
                              · Últimas {combo.available} vagas
                            </span>
                          )}
                        </div>
                      </div>
                      <div className="flex shrink-0 flex-col items-end gap-1">
                        <div className="flex items-baseline gap-1.5">
                          <span className="text-xs text-muted-foreground line-through tabular-nums">
                            {formatCurrency(combo.original_price)}
                          </span>
                          <span className="text-sm font-semibold text-primary tabular-nums">
                            {formatCurrency(combo.final_price)}
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          {combo.discount && (
                            <span className="rounded bg-primary/10 px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-primary">
                              {combo.discount.label}
                            </span>
                          )}
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
                    </div>
                  </button>
                </li>
              )
            })}
          </ul>
        </section>
      )}

      {hasMerch && (
        <section className="space-y-3">
          {hasCombos && (
            <h3 className="font-display text-sm font-semibold text-foreground">Adicionais</h3>
          )}
          <ul className="space-y-3">
            {bumps.map((bump) => {
              const sel = isMerchSelected(bump.id)
              return (
                <li key={bump.id}>
                  <button
                    type="button"
                    onClick={() => toggleMerch(bump)}
                    className={cn(
                      'w-full rounded-lg border p-4 text-left transition-colors duration-150',
                      sel
                        ? 'border-primary bg-primary/5'
                        : 'border-border bg-card hover:border-primary/40',
                    )}
                    aria-pressed={sel}
                  >
                    <div className="flex items-start gap-3">
                      {bump.image_url && (
                        <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-md border border-border">
                          <Image
                            src={bump.image_url}
                            alt={bump.name}
                            fill
                            className="object-cover"
                            sizes="64px"
                          />
                        </div>
                      )}
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
        </section>
      )}

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
