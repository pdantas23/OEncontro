'use client'

import { useState, useTransition } from 'react'
import Image from 'next/image'
import { Pencil, Trash2, Plus, ImageIcon } from 'lucide-react'
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from '@dnd-kit/core'
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { Alert } from '@/components/ui/Alert'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { DragHandle } from '@/components/ui/DragHandle'
import { Modal, ModalContent, ModalHeader, ModalTitle, ModalBody } from '@/components/ui/Modal'
import { LotForm } from './LotForm'
import { deleteLotAction, reorderLotsAction } from '@/app/admin/ingressos/actions'
import { formatCurrency, formatEventDaysLabel } from '@/utils/format'
import type { TicketLot } from '@/repositories/TicketLotRepository'

interface LotListProps {
  lots: TicketLot[]
}

const STATUS_VARIANT: Record<string, 'success' | 'secondary' | 'destructive'> = {
  active: 'success',
  inactive: 'secondary',
  sold_out: 'destructive',
}

const STATUS_LABEL: Record<string, string> = {
  active: 'Ativo',
  inactive: 'Inativo',
  sold_out: 'Esgotado',
}

const POSITION_LABEL: Record<number, string> = {
  0: 'Centro — destaque',
  1: 'Esquerda',
  2: 'Direita',
}

// ---------------------------------------------------------------------------
// Sortable row
// ---------------------------------------------------------------------------

function SortableRow({
  lot,
  index,
  onEdit,
  onDelete,
}: {
  lot: TicketLot
  index: number
  onEdit: () => void
  onDelete: () => void
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
    useSortable({ id: lot.id })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  }

  return (
    <div ref={setNodeRef} style={style} className="flex items-center gap-4 rounded-lg border border-border bg-card p-3">
      <DragHandle {...attributes} {...listeners} />

      {lot.image_url ? (
        <div className="relative h-20 w-32 shrink-0 overflow-hidden rounded-md border border-border">
          <Image src={lot.image_url} alt={lot.name} fill className="object-cover" sizes="128px" />
        </div>
      ) : (
        <div className="flex h-20 w-32 shrink-0 items-center justify-center rounded-md border border-dashed border-border bg-secondary">
          <ImageIcon className="h-6 w-6 text-muted-foreground" />
        </div>
      )}

      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <p className="font-medium text-foreground">{lot.name}</p>
          <Badge variant={STATUS_VARIANT[lot.status] ?? 'secondary'}>
            {STATUS_LABEL[lot.status] ?? lot.status}
          </Badge>
        </div>
        <p className="mt-0.5 text-sm text-muted-foreground">{formatCurrency(lot.price)}</p>
        {(formatEventDaysLabel(lot.event_days) || lot.label) && (
          <p className="mt-0.5 text-xs text-muted-foreground">
            {formatEventDaysLabel(lot.event_days) || lot.label}
          </p>
        )}
        <p className="mt-0.5 text-xs text-accent">
          {POSITION_LABEL[index] ?? `Posição ${index + 1}`}
        </p>
      </div>

      <div className="flex shrink-0 gap-2">
        <Button variant="ghost" size="sm" onClick={onEdit} aria-label={`Editar ${lot.name}`}>
          <Pencil className="h-4 w-4" />
        </Button>
        <Button variant="ghost" size="sm" onClick={onDelete} aria-label={`Excluir ${lot.name}`} className="text-destructive hover:text-destructive">
          <Trash2 className="h-4 w-4" />
        </Button>
      </div>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Main list com drag-and-drop
// ---------------------------------------------------------------------------

export function LotList({ lots: initialLots }: LotListProps) {
  const [lots, setLots] = useState(initialLots)
  const [creating, setCreating] = useState(false)
  const [editing, setEditing] = useState<TicketLot | null>(null)
  const [deleting, setDeleting] = useState<TicketLot | null>(null)
  const [isPending, startTransition] = useTransition()
  const [deleteError, setDeleteError] = useState<string | null>(null)

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  )

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event
    if (!over || active.id === over.id) return

    const oldIndex = lots.findIndex((l) => l.id === active.id)
    const newIndex = lots.findIndex((l) => l.id === over.id)
    const reordered = arrayMove(lots, oldIndex, newIndex)
    setLots(reordered)

    const updates = reordered.map((l, idx) => ({ id: l.id, display_order: idx }))
    startTransition(async () => { await reorderLotsAction(updates) })
  }

  function handleDelete() {
    if (!deleting) return
    setDeleteError(null)
    startTransition(async () => {
      const result = await deleteLotAction(deleting.id)
      if (!result.success) {
        setDeleteError(result.error)
        return
      }
      setDeleting(null)
      window.location.reload()
    })
  }

  return (
    <>
      <div className="flex items-center justify-between mb-4">
        <h1 className="font-display text-2xl font-bold text-foreground">Ingressos</h1>
        <Button size="sm" onClick={() => setCreating(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Novo lote
        </Button>
      </div>

      <p className="mb-3 text-xs text-muted-foreground">
        Arraste para reordenar. O 1.° lote aparece em destaque na home, os demais ficam à direita.
      </p>

      {lots.length === 0 ? (
        <p className="py-8 text-center text-sm text-muted-foreground">Nenhum lote cadastrado.</p>
      ) : (
        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
          <SortableContext items={lots.map((l) => l.id)} strategy={verticalListSortingStrategy}>
            <div className="space-y-3">
              {lots.map((lot, index) => (
                <SortableRow
                  key={lot.id}
                  lot={lot}
                  index={index}
                  onEdit={() => setEditing(lot)}
                  onDelete={() => setDeleting(lot)}
                />
              ))}
            </div>
          </SortableContext>
        </DndContext>
      )}

      <Modal open={creating} onOpenChange={setCreating}>
        <ModalContent>
          <ModalHeader><ModalTitle>Novo lote de ingressos</ModalTitle></ModalHeader>
          <ModalBody>
            <LotForm nextOrder={lots.length} onClose={() => setCreating(false)} />
          </ModalBody>
        </ModalContent>
      </Modal>

      <Modal open={!!editing} onOpenChange={(open) => !open && setEditing(null)}>
        <ModalContent>
          <ModalHeader><ModalTitle>Editar lote</ModalTitle></ModalHeader>
          <ModalBody>
            {editing && <LotForm lot={editing} onClose={() => setEditing(null)} />}
          </ModalBody>
        </ModalContent>
      </Modal>

      <Modal open={!!deleting} onOpenChange={(open) => !open && setDeleting(null)}>
        <ModalContent size="sm">
          <ModalHeader><ModalTitle>Excluir lote</ModalTitle></ModalHeader>
          <ModalBody>
            <div className="space-y-4">
              {deleteError && <Alert variant="destructive">{deleteError}</Alert>}
              <p className="text-sm text-muted-foreground">
                Tem certeza que deseja excluir o lote{' '}
                <strong className="text-foreground">{deleting?.name}</strong>?
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
