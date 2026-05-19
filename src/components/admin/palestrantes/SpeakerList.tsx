'use client'

import { useState, useTransition, useRef } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import { Pencil, Trash2, Plus, Camera } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Modal, ModalContent, ModalHeader, ModalTitle, ModalBody } from '@/components/ui/Modal'
import { Input } from '@/components/ui/Input'
import { Textarea } from '@/components/ui/Textarea'
import { Alert } from '@/components/ui/Alert'
import { Avatar } from '@/components/ui/Avatar'
import {
  createSpeakerAction,
  updateSpeakerAction,
  deleteSpeakerAction,
  uploadSpeakerPhotoAction,
} from '@/app/admin/palestrantes/actions'
import { getInitials } from '@/utils/format'
import type { Speaker } from '@/repositories/SpeakerRepository'

// ---------------------------------------------------------------------------
// Form
// ---------------------------------------------------------------------------

function SpeakerForm({
  speaker,
  nextOrder,
  onClose,
}: {
  speaker?: Speaker
  nextOrder?: number
  onClose: () => void
}) {
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)
  const [photoFile, setPhotoFile] = useState<File | null>(null)
  const [previewUrl, setPreviewUrl] = useState<string | null>(speaker?.photo_url ?? null)
  const inputRef = useRef<HTMLInputElement>(null)
  const router = useRouter()
  const isEditing = !!speaker

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setPhotoFile(file)
    setPreviewUrl(URL.createObjectURL(file))
  }

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setError(null)
    const data = Object.fromEntries(new FormData(e.currentTarget))

    startTransition(async () => {
      if (isEditing) {
        // Faz upload da foto nova antes de salvar, se houver
        if (photoFile) {
          const fd = new FormData()
          fd.append('photo', photoFile)
          const uploadResult = await uploadSpeakerPhotoAction(speaker.id, fd)
          if (!uploadResult.success) {
            setError(uploadResult.error)
            return
          }
        }
        const result = await updateSpeakerAction(speaker.id, data)
        if (!result.success) { setError(result.error ?? 'Erro'); return }
      } else {
        // Cria o palestrante, depois faz upload da foto se houver
        const result = await createSpeakerAction(data)
        if (!result.success) { setError(result.error ?? 'Erro'); return }
        if (photoFile && result.id) {
          const fd = new FormData()
          fd.append('photo', photoFile)
          await uploadSpeakerPhotoAction(result.id, fd)
        }
      }

      window.location.reload()
      onClose()
    })
  }

  const displayName = speaker?.name ?? 'Novo'

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && <Alert variant="destructive">{error}</Alert>}

      {/* Foto */}
      <div className="flex flex-col items-center gap-3">
        <div className="relative h-24 w-24 overflow-hidden rounded-full border-2 border-border bg-muted">
          {previewUrl ? (
            <Image src={previewUrl} alt={displayName} fill className="object-cover" sizes="96px" />
          ) : (
            <Avatar fallback={getInitials(displayName)} size="lg" className="h-24 w-24" />
          )}
        </div>
        <input
          ref={inputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp"
          className="sr-only"
          onChange={handleFileChange}
          aria-label="Escolher foto do palestrante"
        />
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => inputRef.current?.click()}
        >
          <Camera className="mr-2 h-4 w-4" />
          {previewUrl ? 'Trocar foto' : 'Adicionar foto'}
        </Button>
        <p className="text-xs text-muted-foreground">JPEG, PNG ou WebP · máx. 5 MB</p>
      </div>

      <div>
        <label className="mb-1.5 block text-sm font-medium text-foreground">Nome</label>
        <Input name="name" defaultValue={speaker?.name ?? ''} required />
      </div>
      <div>
        <label className="mb-1.5 block text-sm font-medium text-foreground">Cargo / Título</label>
        <Input name="role" defaultValue={speaker?.role ?? ''} placeholder="Ex: Cerimonialista" />
      </div>
      <div>
        <label className="mb-1.5 block text-sm font-medium text-foreground">Bio</label>
        <Textarea name="bio" defaultValue={speaker?.bio ?? ''} rows={3} placeholder="Breve descrição…" />
      </div>
      <div>
        <label className="mb-1.5 block text-sm font-medium text-foreground">Ordem de exibição</label>
        <Input
          name="display_order"
          type="number"
          min="0"
          defaultValue={speaker?.display_order ?? nextOrder ?? 0}
          required
        />
      </div>

      <div className="flex gap-3 pt-2">
        <Button type="button" variant="outline" onClick={onClose} className="flex-1" disabled={isPending}>
          Cancelar
        </Button>
        <Button type="submit" loading={isPending} className="flex-1">
          {isEditing ? 'Salvar' : 'Criar'}
        </Button>
      </div>
    </form>
  )
}

// ---------------------------------------------------------------------------
// List
// ---------------------------------------------------------------------------

interface SpeakerListProps {
  speakers: Speaker[]
}

export function SpeakerList({ speakers }: SpeakerListProps) {
  const [creating, setCreating] = useState(false)
  const [editing, setEditing] = useState<Speaker | null>(null)
  const [deleting, setDeleting] = useState<Speaker | null>(null)
  const [isPending, startTransition] = useTransition()
  const router = useRouter()

  function handleDelete() {
    if (!deleting) return
    startTransition(async () => {
      await deleteSpeakerAction(deleting.id)
      setDeleting(null)
      window.location.reload()
    })
  }

  return (
    <>
      <div className="mb-4 flex items-center justify-between">
        <h1 className="font-display text-2xl font-bold text-foreground">Palestrantes</h1>
        <Button size="sm" onClick={() => setCreating(true)}>
          <Plus className="mr-2 h-4 w-4" />Novo
        </Button>
      </div>

      <div className="space-y-3">
        {speakers.length === 0 && (
          <p className="py-8 text-center text-sm text-muted-foreground">
            Nenhum palestrante cadastrado.
          </p>
        )}
        {speakers.map((speaker) => (
          <div
            key={speaker.id}
            className="flex items-center gap-4 rounded-lg border border-border bg-card p-4"
          >
            <div className="relative h-10 w-10 shrink-0 overflow-hidden rounded-full border border-border">
              {speaker.photo_url ? (
                <Image
                  src={speaker.photo_url}
                  alt={speaker.name}
                  fill
                  className="object-cover"
                  sizes="40px"
                />
              ) : (
                <Avatar fallback={getInitials(speaker.name)} size="sm" />
              )}
            </div>
            <div className="min-w-0 flex-1">
              <p className="font-medium text-foreground">{speaker.name}</p>
              {speaker.role && (
                <p className="text-sm text-muted-foreground">{speaker.role}</p>
              )}
            </div>
            <div className="flex shrink-0 gap-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setEditing(speaker)}
                aria-label="Editar"
              >
                <Pencil className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setDeleting(speaker)}
                className="text-destructive hover:text-destructive"
                aria-label="Excluir"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          </div>
        ))}
      </div>

      {/* Modal: criar */}
      <Modal open={creating} onOpenChange={setCreating}>
        <ModalContent>
          <ModalHeader><ModalTitle>Novo palestrante</ModalTitle></ModalHeader>
          <ModalBody>
            <SpeakerForm nextOrder={speakers.length} onClose={() => setCreating(false)} />
          </ModalBody>
        </ModalContent>
      </Modal>

      {/* Modal: editar */}
      <Modal open={!!editing} onOpenChange={(o) => !o && setEditing(null)}>
        <ModalContent>
          <ModalHeader><ModalTitle>Editar palestrante</ModalTitle></ModalHeader>
          <ModalBody>
            {editing && <SpeakerForm speaker={editing} onClose={() => setEditing(null)} />}
          </ModalBody>
        </ModalContent>
      </Modal>

      {/* Modal: confirmar exclusão */}
      <Modal open={!!deleting} onOpenChange={(o) => !o && setDeleting(null)}>
        <ModalContent size="sm">
          <ModalHeader><ModalTitle>Excluir palestrante</ModalTitle></ModalHeader>
          <ModalBody>
            <div className="space-y-4">
              <p className="text-sm text-muted-foreground">
                Excluir <strong className="text-foreground">{deleting?.name}</strong>?
                A foto também será removida.
              </p>
              <div className="flex gap-3">
                <Button variant="outline" onClick={() => setDeleting(null)} className="flex-1">
                  Cancelar
                </Button>
                <Button
                  variant="destructive"
                  onClick={handleDelete}
                  loading={isPending}
                  className="flex-1"
                >
                  Excluir
                </Button>
              </div>
            </div>
          </ModalBody>
        </ModalContent>
      </Modal>
    </>
  )
}
