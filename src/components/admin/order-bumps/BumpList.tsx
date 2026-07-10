'use client'

import { useState, useTransition, useRef } from 'react'
import Image from 'next/image'
import { Pencil, Trash2, Plus, ImageIcon, Upload } from 'lucide-react'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { Modal, ModalContent, ModalHeader, ModalTitle, ModalBody } from '@/components/ui/Modal'
import { Input } from '@/components/ui/Input'
import { Textarea } from '@/components/ui/Textarea'
import { Alert } from '@/components/ui/Alert'
import { createBumpAction, updateBumpAction, deleteBumpAction, uploadBumpImageAction } from '@/app/admin/order-bumps/actions'
import { formatCurrency } from '@/utils/format'
import type { OrderBump } from '@/repositories/OrderBumpRepository'

interface BumpListProps {
  bumps: OrderBump[]
}

function BumpForm({ bump, nextOrder, onClose }: { bump?: OrderBump; nextOrder?: number; onClose: () => void }) {
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)
  const [imageUrl, setImageUrl] = useState(bump?.image_url ?? '')
  const [imagePreview, setImagePreview] = useState<string | null>(null)
  const [pendingFile, setPendingFile] = useState<File | null>(null)
  const [uploading, setUploading] = useState(false)
  const fileRef = useRef<HTMLInputElement>(null)
  const isEditing = !!bump

  function handleFileSelect(file: File) {
    if (isEditing) {
      // Upload direto na edição
      handleImageUpload(file, bump.id)
    } else {
      // Guardar para upload após criação
      setPendingFile(file)
      setImagePreview(URL.createObjectURL(file))
    }
  }

  async function handleImageUpload(file: File, id: string) {
    setUploading(true)
    const result = await uploadBumpImageAction(id, file)
    setUploading(false)
    if (result.success) {
      setImageUrl(result.url)
    } else {
      setError(result.error)
    }
  }

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
      if (isEditing) {
        const result = await updateBumpAction(bump.id, data)
        if (!result.success) { setError(result.error ?? 'Erro'); return }
      } else {
        const result = await createBumpAction(data)
        if (!result.success) { setError(result.error ?? 'Erro'); return }
        // Upload da imagem pendente com o ID recém-criado
        if (pendingFile && result.id) {
          await handleImageUpload(pendingFile, result.id)
        }
      }
      window.location.reload()
      onClose()
    })
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && <Alert variant="destructive">{error}</Alert>}

      <div>
        <label className="mb-1.5 block text-sm font-medium text-foreground">Foto do produto</label>
        {(imageUrl || imagePreview) ? (
          <div className="relative aspect-[16/9] w-full overflow-hidden rounded-lg border border-border">
            <Image src={imageUrl || imagePreview!} alt="Preview" fill className="object-cover" sizes="400px" />
            <Button
              type="button"
              size="sm"
              variant="secondary"
              className="absolute bottom-2 right-2 bg-background/80 backdrop-blur-sm"
              onClick={() => fileRef.current?.click()}
              disabled={uploading}
            >
              {uploading ? 'Enviando...' : 'Trocar'}
            </Button>
          </div>
        ) : (
          <button
            type="button"
            onClick={() => fileRef.current?.click()}
            disabled={uploading}
            className="flex aspect-[16/9] w-full items-center justify-center rounded-lg border-2 border-dashed border-border bg-secondary transition-colors hover:border-accent/40"
          >
            <div className="flex flex-col items-center gap-2 text-muted-foreground">
              <Upload className="h-6 w-6" />
              <span className="text-xs">{uploading ? 'Enviando...' : 'Enviar imagem'}</span>
            </div>
          </button>
        )}
        <input
          ref={fileRef}
          type="file"
          accept="image/jpeg,image/png,image/webp"
          className="hidden"
          onChange={(e) => {
            const file = e.target.files?.[0]
            if (file) handleFileSelect(file)
          }}
        />
      </div>

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
          <div key={bump.id} className="flex items-center gap-4 rounded-lg border border-border bg-card p-3">
            {/* Thumbnail */}
            {bump.image_url ? (
              <div className="relative h-20 w-32 shrink-0 overflow-hidden rounded-md border border-border">
                <Image
                  src={bump.image_url}
                  alt={bump.name}
                  fill
                  unoptimized
                  className="object-cover"
                  sizes="128px"
                />
              </div>
            ) : (
              <div className="flex h-20 w-32 shrink-0 items-center justify-center rounded-md border border-dashed border-border bg-secondary">
                <ImageIcon className="h-6 w-6 text-muted-foreground" />
              </div>
            )}

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
