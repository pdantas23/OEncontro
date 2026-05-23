'use client'

import { useState, useTransition, useMemo } from 'react'
import { Input } from '@/components/ui/Input'
import { Button } from '@/components/ui/Button'
import { Alert } from '@/components/ui/Alert'
import { createComboAction, updateComboAction } from '@/app/admin/combos/actions'
import { formatCurrency } from '@/utils/format'
import type { TicketLot } from '@/repositories/TicketLotRepository'
import type { ComboWithLots } from './CombosList'

interface CombosFormProps {
  combo?: ComboWithLots
  lots: TicketLot[]
  nextOrder?: number
  onClose: () => void
}

function overlapsEventDays(a?: TicketLot | null, b?: TicketLot | null): boolean {
  if (!a?.event_days || !b?.event_days) return false
  return a.event_days.some((d) => b.event_days!.includes(d))
}

export function CombosForm({ combo, lots, nextOrder = 0, onClose }: CombosFormProps) {
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)
  const [principalId, setPrincipalId] = useState(combo?.principal_lot_id ?? '')
  const [offeredId, setOfferedId] = useState(combo?.offered_lot_id ?? '')
  const [hasDiscount, setHasDiscount] = useState(combo?.discount_type != null)
  const [discountType, setDiscountType] = useState<'percent' | 'fixed'>(combo?.discount_type ?? 'percent')
  const [discountValue, setDiscountValue] = useState(combo?.discount_value?.toString() ?? '')
  const [active, setActive] = useState(combo?.active ?? true)
  const isEditing = !!combo

  const principal = useMemo(() => lots.find((l) => l.id === principalId), [lots, principalId])
  const offered = useMemo(() => lots.find((l) => l.id === offeredId), [lots, offeredId])

  // Filtra opções de oferecido: exclui principal + lotes com overlap de event_days
  const offeredOptions = useMemo(() => {
    return lots.filter((l) => l.id !== principalId && !overlapsEventDays(principal, l))
  }, [lots, principalId, principal])

  const finalPrice = useMemo(() => {
    if (!offered) return null
    const base = offered.price
    if (!hasDiscount || discountValue === '') return base
    const v = parseFloat(discountValue)
    if (!Number.isFinite(v)) return base
    if (discountType === 'percent') return base * (1 - v / 100)
    return base - v
  }, [offered, hasDiscount, discountType, discountValue])

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setError(null)
    const data = {
      principal_lot_id: principalId,
      offered_lot_id: offeredId,
      discount_type: hasDiscount ? discountType : null,
      discount_value: hasDiscount ? parseFloat(discountValue) : null,
      display_order: combo?.display_order ?? nextOrder,
      active,
    }
    startTransition(async () => {
      const result = isEditing
        ? await updateComboAction(combo.id, data)
        : await createComboAction(data)
      if (!result.success) { setError(result.error); return }
      window.location.reload()
      onClose()
    })
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && <Alert variant="destructive"><div className="whitespace-pre-line">{error}</div></Alert>}

      <div>
        <label className="mb-1.5 block text-sm font-medium text-foreground">Ingresso principal</label>
        <select
          value={principalId}
          onChange={(e) => {
            setPrincipalId(e.target.value)
            if (offeredId === e.target.value) setOfferedId('')
          }}
          required
          className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
        >
          <option value="">— Selecione —</option>
          {lots.map((l) => (
            <option key={l.id} value={l.id}>{l.name}</option>
          ))}
        </select>
      </div>

      <div>
        <label className="mb-1.5 block text-sm font-medium text-foreground">Ingresso oferecido</label>
        <select
          value={offeredId}
          onChange={(e) => setOfferedId(e.target.value)}
          required
          disabled={!principalId}
          className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring disabled:opacity-50"
        >
          <option value="">— Selecione —</option>
          {offeredOptions.map((l) => (
            <option key={l.id} value={l.id}>{l.name}</option>
          ))}
        </select>
        {principalId && offeredOptions.length === 0 && (
          <p className="mt-1 text-xs text-amber-700">
            Nenhum lote elegível como oferecido (todos compartilham dias com o principal).
          </p>
        )}
      </div>

      <label className="flex cursor-pointer items-center gap-2">
        <button
          type="button"
          role="switch"
          aria-checked={hasDiscount}
          onClick={() => setHasDiscount((v) => !v)}
          className={`relative inline-flex h-5 w-9 shrink-0 items-center rounded-full transition-colors ${hasDiscount ? 'bg-primary' : 'bg-muted'}`}
        >
          <span className={`inline-block h-3.5 w-3.5 rounded-full bg-white shadow-sm transition-transform ${hasDiscount ? 'translate-x-[18px]' : 'translate-x-[3px]'}`} />
        </button>
        <span className="text-sm text-foreground">Aplicar promoção</span>
      </label>

      {hasDiscount && (
        <div className="space-y-3 rounded-md border border-border bg-secondary/30 p-3">
          <div>
            <label className="mb-1.5 block text-xs font-medium text-foreground">Tipo</label>
            <div className="flex gap-4">
              <label className="flex items-center gap-1.5 text-sm">
                <input
                  type="radio"
                  name="discount_type"
                  value="percent"
                  checked={discountType === 'percent'}
                  onChange={() => setDiscountType('percent')}
                />
                Percentual (%)
              </label>
              <label className="flex items-center gap-1.5 text-sm">
                <input
                  type="radio"
                  name="discount_type"
                  value="fixed"
                  checked={discountType === 'fixed'}
                  onChange={() => setDiscountType('fixed')}
                />
                Fixo (R$)
              </label>
            </div>
          </div>
          <div>
            <label className="mb-1.5 block text-xs font-medium text-foreground">
              Valor {discountType === 'percent' ? '(0 a 100)' : '(R$)'}
            </label>
            <Input
              type="number"
              step={discountType === 'percent' ? '1' : '0.01'}
              min="0"
              max={discountType === 'percent' ? '100' : undefined}
              value={discountValue}
              onChange={(e) => setDiscountValue(e.target.value)}
              required
            />
          </div>
        </div>
      )}

      {offered && (
        <div className="rounded-md border border-border bg-card p-3 text-sm">
          <div className="flex items-center justify-between text-muted-foreground">
            <span>Preço original:</span>
            <span>{formatCurrency(offered.price)}</span>
          </div>
          {hasDiscount && finalPrice != null && finalPrice !== offered.price && (
            <div className="mt-1 flex items-center justify-between font-medium text-foreground">
              <span>Preço final no combo:</span>
              <span>{formatCurrency(Math.max(0, finalPrice))}</span>
            </div>
          )}
        </div>
      )}

      <label className="flex cursor-pointer items-center gap-2">
        <button
          type="button"
          role="switch"
          aria-checked={active}
          onClick={() => setActive((v) => !v)}
          className={`relative inline-flex h-5 w-9 shrink-0 items-center rounded-full transition-colors ${active ? 'bg-primary' : 'bg-muted'}`}
        >
          <span className={`inline-block h-3.5 w-3.5 rounded-full bg-white shadow-sm transition-transform ${active ? 'translate-x-[18px]' : 'translate-x-[3px]'}`} />
        </button>
        <span className="text-sm text-foreground">Ativo no checkout</span>
      </label>

      <div className="flex gap-3 pt-2">
        <Button type="button" variant="outline" onClick={onClose} className="flex-1" disabled={isPending}>Cancelar</Button>
        <Button type="submit" loading={isPending} className="flex-1">{isEditing ? 'Salvar' : 'Criar combo'}</Button>
      </div>
    </form>
  )
}
