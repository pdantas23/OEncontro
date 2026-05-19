'use client'

/**
 * ScheduleList — CRUD + drag-and-drop de reordenação.
 * Usa @dnd-kit/sortable com DragHandle do M2.
 */

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
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
import { Pencil, Trash2, Plus } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Modal, ModalContent, ModalHeader, ModalTitle, ModalBody } from '@/components/ui/Modal'
import { Input } from '@/components/ui/Input'
import { Textarea } from '@/components/ui/Textarea'
import { Alert } from '@/components/ui/Alert'
import { DragHandle } from '@/components/ui/DragHandle'
import {
  createScheduleItemAction,
  updateScheduleItemAction,
  deleteScheduleItemAction,
  reorderScheduleAction,
} from '@/app/admin/programacao/actions'
import { formatTime } from '@/utils/format'
import type { ScheduleItemWithSpeaker } from '@/repositories/ScheduleRepository'
import type { Speaker } from '@/repositories/SpeakerRepository'

// ---------------------------------------------------------------------------
// Form
// ---------------------------------------------------------------------------

function ScheduleForm({
  item,
  speakers,
  nextOrder,
  onClose,
}: {
  item?: ScheduleItemWithSpeaker
  speakers: Speaker[]
  nextOrder?: number
  onClose: () => void
}) {
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setError(null)
    const data = Object.fromEntries(new FormData(e.currentTarget))
    startTransition(async () => {
      const result = item
        ? await updateScheduleItemAction(item.id, data)
        : await createScheduleItemAction(data)
      if (!result.success) { setError(result.error ?? 'Erro'); return }
      window.location.reload()
      onClose()
    })
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && <Alert variant="destructive">{error}</Alert>}
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="mb-1.5 block text-sm font-medium text-foreground">Dia</label>
          <Input name="day" type="number" min="1" defaultValue={item?.day ?? 1} required />
        </div>
        <div>
          <label className="mb-1.5 block text-sm font-medium text-foreground">Ordem</label>
          <Input name="display_order" type="number" min="0" defaultValue={item?.display_order ?? nextOrder ?? 0} required />
        </div>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="mb-1.5 block text-sm font-medium text-foreground">Início</label>
          <Input name="start_time" type="time" defaultValue={item?.start_time ?? ''} required />
        </div>
        <div>
          <label className="mb-1.5 block text-sm font-medium text-foreground">Fim (opcional)</label>
          <Input name="end_time" type="time" defaultValue={item?.end_time ?? ''} />
        </div>
      </div>
      <div>
        <label className="mb-1.5 block text-sm font-medium text-foreground">Título da palestra</label>
        <Input name="talk_title" defaultValue={item?.talk_title ?? ''} required />
      </div>
      <div>
        <label className="mb-1.5 block text-sm font-medium text-foreground">Palestrante (opcional)</label>
        <select name="speaker_id" defaultValue={item?.speaker_id ?? ''} className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
          <option value="">— Sem palestrante —</option>
          {speakers.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
        </select>
      </div>
      <div>
        <label className="mb-1.5 block text-sm font-medium text-foreground">Descrição (opcional)</label>
        <Textarea name="description" defaultValue={item?.description ?? ''} rows={2} />
      </div>
      <div className="flex gap-3 pt-2">
        <Button type="button" variant="outline" onClick={onClose} className="flex-1" disabled={isPending}>Cancelar</Button>
        <Button type="submit" loading={isPending} className="flex-1">{item ? 'Salvar' : 'Criar'}</Button>
      </div>
    </form>
  )
}

// ---------------------------------------------------------------------------
// Sortable row
// ---------------------------------------------------------------------------

function SortableRow({
  item,
  onEdit,
  onDelete,
}: {
  item: ScheduleItemWithSpeaker
  onEdit: () => void
  onDelete: () => void
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
    useSortable({ id: item.id })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  }

  return (
    <div ref={setNodeRef} style={style} className="flex items-center gap-3 rounded-lg border border-border bg-card p-4">
      <DragHandle {...attributes} {...listeners} />
      <div className="min-w-0 flex-1">
        <p className="text-xs font-medium text-primary">
          Dia {item.day} · {formatTime(item.start_time)}
          {item.end_time && ` – ${formatTime(item.end_time)}`}
        </p>
        <p className="font-medium text-foreground">{item.talk_title}</p>
        {item.speaker && <p className="text-sm text-muted-foreground">{item.speaker.name}</p>}
      </div>
      <div className="flex shrink-0 gap-2">
        <Button variant="ghost" size="sm" onClick={onEdit} aria-label="Editar"><Pencil className="h-4 w-4" /></Button>
        <Button variant="ghost" size="sm" onClick={onDelete} className="text-destructive hover:text-destructive" aria-label="Excluir"><Trash2 className="h-4 w-4" /></Button>
      </div>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Main list
// ---------------------------------------------------------------------------

interface ScheduleListProps {
  items: ScheduleItemWithSpeaker[]
  speakers: Speaker[]
}

export function ScheduleList({ items: initialItems, speakers }: ScheduleListProps) {
  const [items, setItems] = useState(initialItems)
  const [creating, setCreating] = useState(false)
  const [editing, setEditing] = useState<ScheduleItemWithSpeaker | null>(null)
  const [deleting, setDeleting] = useState<ScheduleItemWithSpeaker | null>(null)
  const [isPending, startTransition] = useTransition()
  const router = useRouter()

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  )

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event
    if (!over || active.id === over.id) return

    const oldIndex = items.findIndex((i) => i.id === active.id)
    const newIndex = items.findIndex((i) => i.id === over.id)
    const reordered = arrayMove(items, oldIndex, newIndex)
    setItems(reordered)

    const updates = reordered.map((it, idx) => ({ id: it.id, display_order: idx }))
    // Ignorar o retorno — startTransition exige void
    startTransition(async () => { await reorderScheduleAction(updates) })
  }

  function handleDelete() {
    if (!deleting) return
    startTransition(async () => {
      await deleteScheduleItemAction(deleting.id)
      setDeleting(null)
      window.location.reload()
    })
  }

  return (
    <>
      <div className="flex items-center justify-between mb-4">
        <h1 className="font-display text-2xl font-bold text-foreground">Programação</h1>
        <Button size="sm" onClick={() => setCreating(true)}>
          <Plus className="mr-2 h-4 w-4" />Novo item
        </Button>
      </div>

      {items.length === 0 ? (
        <p className="py-8 text-center text-sm text-muted-foreground">Nenhum item cadastrado.</p>
      ) : (
        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
          <SortableContext items={items.map((i) => i.id)} strategy={verticalListSortingStrategy}>
            <div className="space-y-2">
              {items.map((item) => (
                <SortableRow key={item.id} item={item} onEdit={() => setEditing(item)} onDelete={() => setDeleting(item)} />
              ))}
            </div>
          </SortableContext>
        </DndContext>
      )}

      <Modal open={creating} onOpenChange={setCreating}>
        <ModalContent>
          <ModalHeader><ModalTitle>Novo item de programação</ModalTitle></ModalHeader>
          <ModalBody><ScheduleForm speakers={speakers} nextOrder={items.length} onClose={() => setCreating(false)} /></ModalBody>
        </ModalContent>
      </Modal>

      <Modal open={!!editing} onOpenChange={(o) => !o && setEditing(null)}>
        <ModalContent>
          <ModalHeader><ModalTitle>Editar item</ModalTitle></ModalHeader>
          <ModalBody>{editing && <ScheduleForm item={editing} speakers={speakers} onClose={() => setEditing(null)} />}</ModalBody>
        </ModalContent>
      </Modal>

      <Modal open={!!deleting} onOpenChange={(o) => !o && setDeleting(null)}>
        <ModalContent size="sm">
          <ModalHeader><ModalTitle>Excluir item</ModalTitle></ModalHeader>
          <ModalBody>
            <div className="space-y-4">
              <p className="text-sm text-muted-foreground">Excluir <strong className="text-foreground">{deleting?.talk_title}</strong>?</p>
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
