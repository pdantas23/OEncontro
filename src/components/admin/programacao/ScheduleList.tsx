'use client'

/**
 * ScheduleList — CRUD + drag-and-drop.
 * Ao reordenar, os horários acompanham o slot/posição (não o palestrante).
 */

import { useState, useTransition } from 'react'
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
import { Select } from '@/components/ui/Select'
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
// Form — sem campo Ordem (gerenciado automaticamente pelo drag)
// ---------------------------------------------------------------------------

function timeToMinutes(t: string): number {
  const [h, m] = t.split(':').map(Number)
  return h * 60 + m
}

function checkOverlap(
  day: number,
  startTime: string,
  endTime: string | null,
  allItems: ScheduleItemWithSpeaker[],
  excludeId?: string,
): string | null {
  const newStart = timeToMinutes(startTime)
  const newEnd = endTime ? timeToMinutes(endTime) : newStart + 30 // default 30min se sem fim

  for (const existing of allItems) {
    if (existing.id === excludeId) continue
    if (existing.day !== day) continue

    const exStart = timeToMinutes(existing.start_time)
    const exEnd = existing.end_time ? timeToMinutes(existing.end_time) : exStart + 30

    if (newStart < exEnd && newEnd > exStart) {
      const speaker = existing.speaker?.name ?? existing.talk_title
      return `Conflito de horário com "${speaker}" (${existing.start_time}${existing.end_time ? '–' + existing.end_time : ''}). Ajuste o horário para evitar sobreposição.`
    }
  }
  return null
}

function ScheduleForm({
  item,
  speakers,
  allItems,
  nextOrder,
  onClose,
}: {
  item?: ScheduleItemWithSpeaker
  speakers: Speaker[]
  allItems: ScheduleItemWithSpeaker[]
  nextOrder?: number
  onClose: () => void
}) {
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)
  const [itemType, setItemType] = useState(item?.item_type ?? 'palestra')
  const [speakerId, setSpeakerId] = useState(item?.speaker_id ?? '')

  const ITEM_TYPES = [
    { value: 'palestra', label: 'Palestra' },
    { value: 'almoco', label: 'Almoço' },
    { value: 'coffee_break', label: 'Coffee Break' },
    { value: 'abertura', label: 'Abertura' },
    { value: 'encerramento', label: 'Encerramento' },
    { value: 'networking', label: 'Networking' },
    { value: 'outro', label: 'Outro' },
  ]

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setError(null)
    const fd = new FormData(e.currentTarget)
    const raw = Object.fromEntries(fd)

    // Validar sobreposição de horários
    const day = Number(raw.day)
    const startTime = raw.start_time as string
    const endTime = (raw.end_time as string) || null

    const overlap = checkOverlap(day, startTime, endTime, allItems, item?.id)
    if (overlap) {
      setError(overlap)
      return
    }

    const data = {
      ...raw,
      display_order: item?.display_order ?? nextOrder ?? 0,
    }
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

      <div>
        <label className="mb-1.5 block text-sm font-medium text-foreground">Título</label>
        <Input name="talk_title" defaultValue={item?.talk_title ?? ''} required />
      </div>

      <div>
        <label className="mb-1.5 block text-sm font-medium text-foreground">Tipo</label>
        <input type="hidden" name="item_type" value={itemType} />
        <Select
          options={ITEM_TYPES}
          value={itemType}
          onValueChange={setItemType}
        />
      </div>

      {itemType === 'palestra' && (
        <div>
          <label className="mb-1.5 block text-sm font-medium text-foreground">Palestrante (opcional)</label>
          <input type="hidden" name="speaker_id" value={speakerId === '__none__' ? '' : speakerId} />
          <Select
            options={[
              { value: '__none__', label: '— Sem palestrante —' },
              ...speakers.map((s) => ({ value: s.id, label: s.name })),
            ]}
            value={speakerId || '__none__'}
            onValueChange={setSpeakerId}
            placeholder="Selecionar palestrante..."
          />
        </div>
      )}

      <div className="grid grid-cols-3 gap-3">
        <div>
          <label className="mb-1.5 block text-sm font-medium text-foreground">Dia</label>
          <Input name="day" type="number" min="1" defaultValue={item?.day ?? 1} required />
        </div>
        <div>
          <label className="mb-1.5 block text-sm font-medium text-foreground">Início</label>
          <Input name="start_time" type="time" defaultValue={item?.start_time ?? ''} required />
        </div>
        <div>
          <label className="mb-1.5 block text-sm font-medium text-foreground">Fim</label>
          <Input name="end_time" type="time" defaultValue={item?.end_time ?? ''} />
        </div>
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
          {item.item_type && item.item_type !== 'palestra' && (
            <span className="ml-2 rounded bg-muted px-1.5 py-0.5 text-[10px] uppercase text-muted-foreground">
              {item.item_type.replace('_', ' ')}
            </span>
          )}
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
// Main list — ao reordenar, horários acompanham a posição
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

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  )

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event
    if (!over || active.id === over.id) return

    const oldIndex = items.findIndex((i) => i.id === active.id)
    const newIndex = items.findIndex((i) => i.id === over.id)

    // Captura horários originais antes do swap
    const times = items.map((i) => ({
      start_time: i.start_time,
      end_time: i.end_time,
    }))

    // Reordena os items (conteúdo move, horários ficam no slot)
    const reordered = arrayMove(items, oldIndex, newIndex).map((item, idx) => ({
      ...item,
      start_time: times[idx].start_time,
      end_time: times[idx].end_time,
      display_order: idx,
    }))

    setItems(reordered)

    // Persiste ordem + horários
    const updates = reordered.map((it, idx) => ({ id: it.id, display_order: idx }))
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
          <ModalBody><ScheduleForm speakers={speakers} allItems={items} nextOrder={items.length} onClose={() => setCreating(false)} /></ModalBody>
        </ModalContent>
      </Modal>

      <Modal open={!!editing} onOpenChange={(o) => !o && setEditing(null)}>
        <ModalContent>
          <ModalHeader><ModalTitle>Editar item</ModalTitle></ModalHeader>
          <ModalBody>{editing && <ScheduleForm item={editing} speakers={speakers} allItems={items} onClose={() => setEditing(null)} />}</ModalBody>
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
