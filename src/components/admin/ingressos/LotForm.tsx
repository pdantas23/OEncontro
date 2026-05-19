'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { Input } from '@/components/ui/Input'
import { Textarea } from '@/components/ui/Textarea'
import { Button } from '@/components/ui/Button'
import { Alert } from '@/components/ui/Alert'
import { createLotAction, updateLotAction } from '@/app/admin/ingressos/actions'
import type { TicketLot } from '@/repositories/TicketLotRepository'

interface LotFormProps {
  lot?: TicketLot
  nextOrder?: number
  onClose: () => void
}

export function LotForm({ lot, nextOrder = 0, onClose }: LotFormProps) {
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()
  const isEditing = !!lot

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setError(null)
    const fd = new FormData(e.currentTarget)
    const data = Object.fromEntries(fd)

    startTransition(async () => {
      const result = isEditing
        ? await updateLotAction(lot.id, data)
        : await createLotAction(data)

      if (!result.success) {
        setError(result.error ?? 'Erro desconhecido')
        return
      }
      window.location.reload()
      onClose()
    })
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && <Alert variant="destructive">{error}</Alert>}

      <div>
        <label className="mb-1.5 block text-sm font-medium text-foreground">Nome do lote</label>
        <Input name="name" defaultValue={lot?.name ?? ''} required />
      </div>

      <div>
        <label className="mb-1.5 block text-sm font-medium text-foreground">Descrição</label>
        <Textarea name="description" defaultValue={lot?.description ?? ''} rows={2} />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="mb-1.5 block text-sm font-medium text-foreground">Preço (R$)</label>
          <Input name="price" type="number" step="0.01" min="0" defaultValue={lot ? (lot.price / 100).toFixed(2) : ''} required />
          <p className="mt-1 text-xs text-muted-foreground">Em reais — ex: 197.00</p>
        </div>
        <div>
          <label className="mb-1.5 block text-sm font-medium text-foreground">Limite total</label>
          <Input name="total_limit" type="number" min="1" defaultValue={lot?.total_limit ?? ''} required />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="mb-1.5 block text-sm font-medium text-foreground">Status</label>
          <select
            name="status"
            defaultValue={lot?.status ?? 'active'}
            className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            <option value="active">Ativo</option>
            <option value="inactive">Inativo</option>
            <option value="sold_out">Esgotado</option>
          </select>
        </div>
        <div>
          <label className="mb-1.5 block text-sm font-medium text-foreground">Ordem</label>
          <Input name="display_order" type="number" min="0" defaultValue={lot?.display_order ?? nextOrder} required />
        </div>
      </div>

      <div className="flex gap-3 pt-2">
        <Button type="button" variant="outline" onClick={onClose} className="flex-1" disabled={isPending}>
          Cancelar
        </Button>
        <Button type="submit" loading={isPending} className="flex-1">
          {isEditing ? 'Salvar alterações' : 'Criar lote'}
        </Button>
      </div>
    </form>
  )
}
