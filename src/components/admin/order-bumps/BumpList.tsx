'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
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
  const router = useRouter()
  const isEditing = !!bump

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setError(null)
    const data = Object.fromEntries(new FormData(e.currentTarget))
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
        <Textarea name="description" defaultValue={bump?.description ?? ''} rows={2} />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="mb-1.5 block text-sm font-medium text-foreground">Preço (R$)</label>
          <Input name="price" type="number" step="0.01" min="0" defaultValue={bump ? (bump.price / 100).toFixed(2) : ''} required />
        </div>
        <div>
          <label className="mb-1.5 block text-sm font-medium text-foreground">Estoque (opcional)</label>
          <Input name="stock_limit" type="number" min="1" defaultValue={bump?.stock_limit ?? ''} />
        </div>
      </div>
      <div className="grid grid-cols-3 gap-3">
        <div>
          <label className="mb-1.5 block text-sm font-medium text-foreground">Ordem</label>
          <Input name="display_order" type="number" min="0" defaultValue={bump?.display_order ?? nextOrder ?? 0} required />
        </div>
        <div>
          <label className="mb-1.5 block text-sm font-medium text-foreground">Tamanhos?</label>
          <select name="has_sizes" defaultValue={bump?.has_sizes ? 'true' : 'false'} className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
            <option value="false">Não</option>
            <option value="true">Sim</option>
          </select>
        </div>
        <div>
          <label className="mb-1.5 block text-sm font-medium text-foreground">Ativo?</label>
          <select name="active" defaultValue={bump?.active !== false ? 'true' : 'false'} className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
            <option value="true">Sim</option>
            <option value="false">Não</option>
          </select>
        </div>
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
  const router = useRouter()

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
        <h1 className="font-display text-2xl font-bold text-foreground">Order Bumps</h1>
        <Button size="sm" onClick={() => setCreating(true)}>
          <Plus className="mr-2 h-4 w-4" />Novo
        </Button>
      </div>

      <div className="space-y-3">
        {bumps.length === 0 && (
          <p className="py-8 text-center text-sm text-muted-foreground">Nenhum order bump cadastrado.</p>
        )}
        {bumps.map((bump) => (
          <div key={bump.id} className="flex items-center gap-4 rounded-lg border border-border bg-card p-4">
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <p className="font-medium text-foreground">{bump.name}</p>
                <Badge variant={bump.active ? 'success' : 'secondary'}>{bump.active ? 'Ativo' : 'Inativo'}</Badge>
                {bump.has_sizes && <Badge variant="secondary">Tamanhos</Badge>}
              </div>
              <p className="mt-0.5 text-sm text-muted-foreground">
                {formatCurrency(bump.price)}
                {bump.stock_limit != null && ` · ${bump.sold_count}/${bump.stock_limit} vendidos`}
              </p>
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
          <ModalHeader><ModalTitle>Novo order bump</ModalTitle></ModalHeader>
          <ModalBody><BumpForm nextOrder={bumps.length} onClose={() => setCreating(false)} /></ModalBody>
        </ModalContent>
      </Modal>

      <Modal open={!!editing} onOpenChange={(o) => !o && setEditing(null)}>
        <ModalContent>
          <ModalHeader><ModalTitle>Editar order bump</ModalTitle></ModalHeader>
          <ModalBody>{editing && <BumpForm bump={editing} onClose={() => setEditing(null)} />}</ModalBody>
        </ModalContent>
      </Modal>

      <Modal open={!!deleting} onOpenChange={(o) => !o && setDeleting(null)}>
        <ModalContent size="sm">
          <ModalHeader><ModalTitle>Excluir order bump</ModalTitle></ModalHeader>
          <ModalBody>
            <div className="space-y-4">
              <p className="text-sm text-muted-foreground">
                Tem certeza que deseja excluir <strong className="text-foreground">{deleting?.name}</strong>?
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
