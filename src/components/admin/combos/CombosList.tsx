'use client'

import { useState, useTransition } from 'react'
import { Pencil, Trash2, Plus } from 'lucide-react'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { Alert } from '@/components/ui/Alert'
import { Modal, ModalContent, ModalHeader, ModalTitle, ModalBody } from '@/components/ui/Modal'
import { CombosForm } from './CombosForm'
import { deleteComboAction } from '@/app/admin/combos/actions'
import { formatCurrency } from '@/utils/format'
import type { Database } from '@/types/database'
import type { TicketLot } from '@/repositories/TicketLotRepository'

export type ComboWithLots = Database['public']['Tables']['ticket_lot_bumps_encontro']['Row'] & {
  principal: TicketLot | null
  offered: TicketLot | null
}

interface CombosListProps {
  combos: ComboWithLots[]
  lots: TicketLot[]
}

function calcFinalPrice(combo: ComboWithLots): number {
  const base = combo.offered?.price ?? 0
  if (combo.discount_type === 'percent' && combo.discount_value != null) {
    return base * (1 - combo.discount_value / 100)
  }
  if (combo.discount_type === 'fixed' && combo.discount_value != null) {
    return base - combo.discount_value
  }
  return base
}

function formatDiscount(combo: ComboWithLots): string {
  if (combo.discount_type === 'percent' && combo.discount_value != null) return `−${combo.discount_value}%`
  if (combo.discount_type === 'fixed' && combo.discount_value != null) return `−${formatCurrency(combo.discount_value)}`
  return '—'
}

export function CombosList({ combos, lots }: CombosListProps) {
  const [creating, setCreating] = useState(false)
  const [editing, setEditing] = useState<ComboWithLots | null>(null)
  const [deleting, setDeleting] = useState<ComboWithLots | null>(null)
  const [deleteError, setDeleteError] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  function handleDelete() {
    if (!deleting) return
    setDeleteError(null)
    // TODO (Task 9): após Task 9 ligar combo_id a orders, mostrar warning
    // distinto se o combo tem vendas e oferecer "Desativar" como alternativa.
    startTransition(async () => {
      const result = await deleteComboAction(deleting.id)
      if (!result.success) { setDeleteError(result.error); return }
      window.location.reload()
    })
  }

  return (
    <>
      <div className="flex items-center justify-between mb-4">
        <h1 className="font-display text-2xl font-bold text-foreground">Combos</h1>
        <Button size="sm" onClick={() => setCreating(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Novo combo
        </Button>
      </div>

      <p className="mb-3 text-xs text-muted-foreground">
        Combos oferecem um lote de ingresso como upsell no checkout de outro, com promoção opcional.
        Só lotes com dias do evento distintos podem formar combo.
      </p>

      {combos.length === 0 ? (
        <p className="py-8 text-center text-sm text-muted-foreground">Nenhum combo cadastrado.</p>
      ) : (
        <div className="overflow-x-auto rounded-lg border border-border">
          <table className="w-full text-sm">
            <thead className="bg-secondary/50 text-xs uppercase text-muted-foreground">
              <tr>
                <th className="px-3 py-2 text-left font-medium">Principal</th>
                <th className="px-3 py-2 text-left font-medium">Oferecido</th>
                <th className="px-3 py-2 text-right font-medium">Original</th>
                <th className="px-3 py-2 text-right font-medium">Desconto</th>
                <th className="px-3 py-2 text-right font-medium">Final</th>
                <th className="px-3 py-2 text-left font-medium">Status</th>
                <th className="px-3 py-2 text-right font-medium">Ações</th>
              </tr>
            </thead>
            <tbody>
              {combos.map((c) => (
                <tr key={c.id} className="border-t border-border">
                  <td className="px-3 py-2 text-foreground">{c.principal?.name ?? '—'}</td>
                  <td className="px-3 py-2 text-foreground">{c.offered?.name ?? '—'}</td>
                  <td className="px-3 py-2 text-right text-muted-foreground">{formatCurrency(c.offered?.price ?? 0)}</td>
                  <td className="px-3 py-2 text-right text-amber-700">{formatDiscount(c)}</td>
                  <td className="px-3 py-2 text-right font-medium text-foreground">{formatCurrency(calcFinalPrice(c))}</td>
                  <td className="px-3 py-2">
                    <Badge variant={c.active ? 'success' : 'secondary'}>{c.active ? 'Ativo' : 'Inativo'}</Badge>
                  </td>
                  <td className="px-3 py-2">
                    <div className="flex justify-end gap-1">
                      <Button variant="ghost" size="sm" onClick={() => setEditing(c)} aria-label="Editar combo"><Pencil className="h-4 w-4" /></Button>
                      <Button variant="ghost" size="sm" onClick={() => setDeleting(c)} className="text-destructive hover:text-destructive" aria-label="Excluir combo"><Trash2 className="h-4 w-4" /></Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <Modal open={creating} onOpenChange={setCreating}>
        <ModalContent>
          <ModalHeader><ModalTitle>Novo combo</ModalTitle></ModalHeader>
          <ModalBody>
            <CombosForm lots={lots} nextOrder={combos.length} onClose={() => setCreating(false)} />
          </ModalBody>
        </ModalContent>
      </Modal>

      <Modal open={!!editing} onOpenChange={(o) => !o && setEditing(null)}>
        <ModalContent>
          <ModalHeader><ModalTitle>Editar combo</ModalTitle></ModalHeader>
          <ModalBody>
            {editing && <CombosForm combo={editing} lots={lots} onClose={() => setEditing(null)} />}
          </ModalBody>
        </ModalContent>
      </Modal>

      <Modal open={!!deleting} onOpenChange={(o) => !o && setDeleting(null)}>
        <ModalContent size="sm">
          <ModalHeader><ModalTitle>Excluir combo</ModalTitle></ModalHeader>
          <ModalBody>
            <div className="space-y-4">
              {deleteError && <Alert variant="destructive">{deleteError}</Alert>}
              <p className="text-sm text-muted-foreground">
                Excluir o combo{' '}
                <strong className="text-foreground">
                  {deleting?.principal?.name ?? '?'} → {deleting?.offered?.name ?? '?'}
                </strong>
                ? Considere desativar via toggle se quiser preservar o histórico.
              </p>
              <div className="flex gap-3">
                <Button variant="outline" onClick={() => setDeleting(null)} className="flex-1">Cancelar</Button>
                <Button variant="destructive" onClick={handleDelete} loading={isPending} className="flex-1">Excluir</Button>
              </div>
            </div>
          </ModalBody>
        </ModalContent>
      </Modal>
    </>
  )
}
