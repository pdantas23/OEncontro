'use client'

import { useState, useTransition } from 'react'
import { Pencil, Trash2, Plus } from 'lucide-react'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { Modal, ModalContent, ModalHeader, ModalTitle, ModalBody } from '@/components/ui/Modal'
import { Input } from '@/components/ui/Input'
import { Textarea } from '@/components/ui/Textarea'
import { Alert } from '@/components/ui/Alert'
import { createBumpAction, updateBumpAction, deleteBumpAction } from '@/app/admin/order-bumps/actions'
import { formatCurrency } from '@/utils/format'
import type { OrderBump } from '@/repositories/OrderBumpRepository'

interface BumpListProps {
  bumps: OrderBump[]
}

function BumpForm({ bump, nextOrder, onClose }: { bump?: OrderBump; nextOrder?: number; onClose: () => void }) {
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)
  const isEditing = !!bump

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setError(null)
    const fd = new FormData(e.currentTarget)
    const data = {
      ...Object.fromEntries(fd),
      has_sizes: bump?.has_sizes ? 'true' : 'false',
      active: 'true',
      display_order: bump?.display_order ?? nextOrder ?? 0,
    }
    startTransition(async () => {
      const result = isEditing ? await updateBumpAction(bump.id, data) : await createBumpAction(data)
      if (!result.success) { setError(result.error ?? 'Erro'); return }
      window.location.reload()
      onClose()
    })
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && <Alert variant="destructive">{error}</Alert>}

      <div>
        <label className="mb-1.5 block text-sm font-medium text-foreground">Nome</label>
        <Input name="name" defaultValue={bump?.name ?? ''} required />
      </div>

      <div>
        <label className="mb-1.5 block text-sm font-medium text-foreground">Descrição</label>
        <Textarea name="description" defaultValue={bump?.description ?? ''} rows={3} />
      </div>

      <div>
        <label className="mb-1.5 block text-sm font-medium text-foreground">Preço (R$)</label>
        <Input name="price" type="number" step="0.01" min="0" defaultValue={bump?.price ?? ''} required />
      </div>

      <div className="flex gap-3 pt-2">
        <Button type="button" variant="outline" onClick={onClose} className="flex-1" disabled={isPending}>Cancelar</Button>
        <Button type="submit" loading={isPending} className="flex-1">{isEditing ? 'Salvar' : 'Criar'}</Button>
      </div>
    </form>
  )
}

export function BumpList({ bumps }: BumpListProps) {
  const [creating, setCreating] = useState(false)
  const [editing, setEditing] = useState<OrderBump | null>(null)
  const [deleting, setDeleting] = useState<OrderBump | null>(null)
  const [isPending, startTransition] = useTransition()

  function handleDelete() {
    if (!deleting) return
    startTransition(async () => {
      await deleteBumpAction(deleting.id)
      setDeleting(null)
      window.location.reload()
    })
  }

  return (
    <>
      <div className="flex items-center justify-between mb-4">
        <h1 className="font-display text-2xl font-bold text-foreground">Mercadorias</h1>
        <Button size="sm" onClick={() => setCreating(true)}>
          <Plus className="mr-2 h-4 w-4" />Novo
        </Button>
      </div>

      <div className="space-y-3">
        {bumps.length === 0 && (
          <p className="py-8 text-center text-sm text-muted-foreground">Nenhum produto cadastrado.</p>
        )}
        {bumps.map((bump) => (
          <div key={bump.id} className="flex items-center gap-4 rounded-lg border border-border bg-card p-4">
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <p className="font-medium text-foreground">{bump.name}</p>
                <Badge variant={bump.active ? 'success' : 'secondary'}>{bump.active ? 'Ativo' : 'Inativo'}</Badge>
              </div>
              <p className="mt-0.5 text-sm text-muted-foreground">{formatCurrency(bump.price)}</p>
            </div>
            <div className="flex shrink-0 gap-2">
              <Button variant="ghost" size="sm" onClick={() => setEditing(bump)} aria-label={`Editar ${bump.name}`}><Pencil className="h-4 w-4" /></Button>
              <Button variant="ghost" size="sm" onClick={() => setDeleting(bump)} className="text-destructive hover:text-destructive" aria-label={`Excluir ${bump.name}`}><Trash2 className="h-4 w-4" /></Button>
            </div>
          </div>
        ))}
      </div>

      <Modal open={creating} onOpenChange={setCreating}>
        <ModalContent>
          <ModalHeader><ModalTitle>Novo produto</ModalTitle></ModalHeader>
          <ModalBody><BumpForm nextOrder={bumps.length} onClose={() => setCreating(false)} /></ModalBody>
        </ModalContent>
      </Modal>

      <Modal open={!!editing} onOpenChange={(o) => !o && setEditing(null)}>
        <ModalContent>
          <ModalHeader><ModalTitle>Editar produto</ModalTitle></ModalHeader>
          <ModalBody>{editing && <BumpForm bump={editing} onClose={() => setEditing(null)} />}</ModalBody>
        </ModalContent>
      </Modal>

      <Modal open={!!deleting} onOpenChange={(o) => !o && setDeleting(null)}>
        <ModalContent size="sm">
          <ModalHeader><ModalTitle>Excluir produto</ModalTitle></ModalHeader>
          <ModalBody>
            <div className="space-y-4">
              <p className="text-sm text-muted-foreground">
                Excluir <strong className="text-foreground">{deleting?.name}</strong>?
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
