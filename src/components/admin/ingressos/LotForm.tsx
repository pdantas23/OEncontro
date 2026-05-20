'use client'

import { useRef, useState, useTransition } from 'react'
import Image from 'next/image'
import { Upload } from 'lucide-react'
import { Input } from '@/components/ui/Input'
import { Textarea } from '@/components/ui/Textarea'
import { Button } from '@/components/ui/Button'
import { Alert } from '@/components/ui/Alert'
import { createLotAction, updateLotAction, uploadLotImageAction } from '@/app/admin/ingressos/actions'
import type { TicketLot } from '@/repositories/TicketLotRepository'

interface LotFormProps {
  lot?: TicketLot
  nextOrder?: number
  onClose: () => void
}

export function LotForm({ lot, nextOrder = 0, onClose }: LotFormProps) {
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)
  const [imageUrl, setImageUrl] = useState<string | null>(lot?.image_url ?? null)
  const [uploading, setUploading] = useState(false)
  const fileRef = useRef<HTMLInputElement>(null)
  const isEditing = !!lot

  async function handleImageUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return

    if (!isEditing || !lot) {
      setError('Salve o lote primeiro e depois adicione a imagem.')
      return
    }

    setUploading(true)
    setError(null)
    const result = await uploadLotImageAction(lot.id, file)
    setUploading(false)

    if (!result.success) {
      setError(result.error)
      return
    }

    setImageUrl(result.url)
  }

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setError(null)
    const fd = new FormData(e.currentTarget)
    const data = Object.fromEntries(fd)

    startTransition(async () => {
      const result = isEditing
        ? await updateLotAction(lot.id, { ...data, display_order: lot.display_order })
        : await createLotAction({ ...data, display_order: nextOrder })

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
          <Input name="price" type="number" step="0.01" min="0" defaultValue={lot?.price ?? ''} required />
          <p className="mt-1 text-xs text-muted-foreground">Em reais — ex: 197.00</p>
        </div>
        <div>
          <label className="mb-1.5 block text-sm font-medium text-foreground">Limite total</label>
          <Input name="total_limit" type="number" min="1" defaultValue={lot?.total_limit ?? ''} required />
        </div>
      </div>

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

      {/* Upload de imagem do ingresso */}
      <div>
        <label className="mb-1.5 block text-sm font-medium text-foreground">Imagem do ingresso</label>
        {imageUrl ? (
          <div className="relative mb-2 overflow-hidden rounded-lg border border-border">
            <Image
              src={imageUrl}
              alt="Imagem do ingresso"
              width={400}
              height={200}
              className="h-auto w-full object-cover"
            />
            <button
              type="button"
              onClick={() => fileRef.current?.click()}
              className="absolute bottom-2 right-2 rounded-md bg-background/80 px-2 py-1 text-xs font-medium text-foreground backdrop-blur-sm hover:bg-background"
            >
              Trocar imagem
            </button>
          </div>
        ) : (
          <button
            type="button"
            onClick={() => fileRef.current?.click()}
            disabled={!isEditing || uploading}
            className="flex w-full items-center justify-center gap-2 rounded-lg border-2 border-dashed border-border bg-secondary/50 px-4 py-8 text-sm text-muted-foreground transition-colors hover:border-accent/40 hover:bg-secondary disabled:opacity-50"
          >
            <Upload className="h-5 w-5" />
            {!isEditing ? 'Salve o lote primeiro para adicionar imagem' : uploading ? 'Enviando...' : 'Clique para enviar imagem'}
          </button>
        )}
        <input
          ref={fileRef}
          type="file"
          accept="image/jpeg,image/png,image/webp"
          className="hidden"
          onChange={handleImageUpload}
        />
        <p className="mt-1 text-xs text-muted-foreground">JPG, PNG ou WebP. Máximo 5MB.</p>
      </div>

      <div className="flex gap-3 pt-2">
        <Button type="button" variant="outline" onClick={onClose} className="flex-1" disabled={isPending}>
          Cancelar
        </Button>
        <Button type="submit" loading={isPending || uploading} className="flex-1">
          {isEditing ? 'Salvar alterações' : 'Criar lote'}
        </Button>
      </div>
    </form>
  )
}
