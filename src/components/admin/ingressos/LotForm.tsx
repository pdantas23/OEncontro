'use client'

import { useRef, useState, useTransition } from 'react'
import Image from 'next/image'
import { Upload } from 'lucide-react'
import { Input } from '@/components/ui/Input'
import { Textarea } from '@/components/ui/Textarea'
import { Button } from '@/components/ui/Button'
import { Switch } from '@/components/ui/Switch'
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
  const [isActive, setIsActive] = useState(lot?.status === 'active' || !lot)
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
    const data = {
      ...Object.fromEntries(fd),
      status: isActive ? 'active' : 'inactive',
      display_order: lot?.display_order ?? nextOrder,
    }

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

      {/* Imagem — acima de tudo */}
      <div>
        <label className="mb-1.5 block text-sm font-medium text-foreground">Imagem do ingresso</label>
        {imageUrl ? (
          <div className="relative mb-2 h-40 overflow-hidden rounded-lg border border-border">
            <Image
              src={imageUrl}
              alt="Imagem do ingresso"
              fill
              className="object-cover"
              sizes="400px"
            />
            <button
              type="button"
              onClick={() => fileRef.current?.click()}
              className="absolute bottom-2 right-2 rounded-md bg-background/80 px-2 py-1 text-xs font-medium text-foreground backdrop-blur-sm hover:bg-background"
            >
              Trocar
            </button>
          </div>
        ) : (
          <button
            type="button"
            onClick={() => fileRef.current?.click()}
            disabled={!isEditing || uploading}
            className="flex w-full items-center justify-center gap-2 rounded-lg border-2 border-dashed border-border bg-secondary/50 px-4 py-6 text-sm text-muted-foreground transition-colors hover:border-accent/40 hover:bg-secondary disabled:opacity-50"
          >
            <Upload className="h-5 w-5" />
            {!isEditing ? 'Salve primeiro para adicionar imagem' : uploading ? 'Enviando...' : 'Enviar imagem'}
          </button>
        )}
        <input
          ref={fileRef}
          type="file"
          accept="image/jpeg,image/png,image/webp"
          className="hidden"
          onChange={handleImageUpload}
        />
      </div>

      {/* Campos em 2 colunas */}
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="mb-1.5 block text-sm font-medium text-foreground">Nome</label>
          <Input name="name" defaultValue={lot?.name ?? ''} required />
        </div>
        <div>
          <label className="mb-1.5 block text-sm font-medium text-foreground">Preço (R$)</label>
          <Input name="price" type="number" step="0.01" min="0" defaultValue={lot?.price ?? ''} required />
        </div>
      </div>

      {/* Descrição — largura total */}
      <div>
        <label className="mb-1.5 block text-sm font-medium text-foreground">Descrição</label>
        <Textarea name="description" defaultValue={lot?.description ?? ''} rows={3} />
      </div>

      {/* Switch ativo */}
      <Switch
        checked={isActive}
        onCheckedChange={setIsActive}
        label="Ativo no site"
        description="Quando desativado, o ingresso não aparece para os visitantes"
      />

      {/* Ações */}
      <div className="flex gap-3 pt-2">
        <Button type="button" variant="outline" onClick={onClose} className="flex-1" disabled={isPending}>
          Cancelar
        </Button>
        <Button type="submit" loading={isPending || uploading} className="flex-1">
          {isEditing ? 'Salvar' : 'Criar lote'}
        </Button>
      </div>
    </form>
  )
}
