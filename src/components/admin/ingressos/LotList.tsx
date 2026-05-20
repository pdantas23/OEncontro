'use client'

import { useState, useTransition } from 'react'
import Image from 'next/image'
import { Pencil, Trash2, Plus, ImageIcon } from 'lucide-react'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { Modal, ModalContent, ModalHeader, ModalTitle, ModalBody } from '@/components/ui/Modal'
import { LotForm } from './LotForm'
import { deleteLotAction } from '@/app/admin/ingressos/actions'
import { formatCurrency } from '@/utils/format'
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

export function LotList({ lots }: LotListProps) {
  const [creating, setCreating] = useState(false)
  const [editing, setEditing] = useState<TicketLot | null>(null)
  const [deleting, setDeleting] = useState<TicketLot | null>(null)
  const [isPending, startTransition] = useTransition()

  function handleDelete() {
    if (!deleting) return
    startTransition(async () => {
      await deleteLotAction(deleting.id)
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

      <div className="space-y-3">
        {lots.length === 0 && (
          <p className="py-8 text-center text-sm text-muted-foreground">Nenhum lote cadastrado.</p>
        )}
        {lots.map((lot) => (
          <div
            key={lot.id}
            className="flex items-center gap-4 rounded-lg border border-border bg-card p-4"
          >
            {/* Thumbnail */}
            {lot.image_url ? (
              <div className="relative h-14 w-14 shrink-0 overflow-hidden rounded-md border border-border">
                <Image
                  src={lot.image_url}
                  alt={lot.name}
                  fill
                  className="object-cover"
                  sizes="56px"
                />
              </div>
            ) : (
              <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-md border border-dashed border-border bg-secondary">
                <ImageIcon className="h-5 w-5 text-muted-foreground" />
              </div>
            )}

            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <p className="font-medium text-foreground">{lot.name}</p>
                <Badge variant={STATUS_VARIANT[lot.status] ?? 'secondary'}>
                  {STATUS_LABEL[lot.status] ?? lot.status}
                </Badge>
              </div>
              <p className="mt-0.5 text-sm text-muted-foreground">
                {formatCurrency(lot.price)} · {lot.sold_count} vendidos
              </p>
            </div>
            <div className="flex shrink-0 gap-2">
              <Button variant="ghost" size="sm" onClick={() => setEditing(lot)} aria-label={`Editar ${lot.name}`}>
                <Pencil className="h-4 w-4" />
              </Button>
              <Button variant="ghost" size="sm" onClick={() => setDeleting(lot)} aria-label={`Excluir ${lot.name}`} className="text-destructive hover:text-destructive">
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          </div>
        ))}
      </div>

      {/* Modal criar */}
      <Modal open={creating} onOpenChange={setCreating}>
        <ModalContent>
          <ModalHeader><ModalTitle>Novo lote de ingressos</ModalTitle></ModalHeader>
          <ModalBody>
            <LotForm nextOrder={lots.length} onClose={() => setCreating(false)} />
          </ModalBody>
        </ModalContent>
      </Modal>

      {/* Modal editar */}
      <Modal open={!!editing} onOpenChange={(open) => !open && setEditing(null)}>
        <ModalContent>
          <ModalHeader><ModalTitle>Editar lote</ModalTitle></ModalHeader>
          <ModalBody>
            {editing && <LotForm lot={editing} onClose={() => setEditing(null)} />}
          </ModalBody>
        </ModalContent>
      </Modal>

      {/* Modal confirmar exclusão */}
      <Modal open={!!deleting} onOpenChange={(open) => !open && setDeleting(null)}>
        <ModalContent size="sm">
          <ModalHeader><ModalTitle>Excluir lote</ModalTitle></ModalHeader>
          <ModalBody>
            <div className="space-y-4">
              <p className="text-sm text-muted-foreground">
                Tem certeza que deseja excluir o lote{' '}
                <strong className="text-foreground">{deleting?.name}</strong>?
                Esta ação não pode ser desfeita.
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
