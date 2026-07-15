'use client'

import { useState, useTransition } from 'react'
import { Plus, UserCircle } from 'lucide-react'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { Modal, ModalContent, ModalHeader, ModalTitle, ModalBody } from '@/components/ui/Modal'
import { Input } from '@/components/ui/Input'
import { Alert } from '@/components/ui/Alert'
import { createUserAction, type AdminUserRow } from '@/app/admin/usuarios/actions'
import { formatDate } from '@/utils/format'

function UserForm({ onClose }: { onClose: () => void }) {
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setError(null)
    const fd = new FormData(e.currentTarget)
    const email = String(fd.get('email') ?? '')
    const password = String(fd.get('password') ?? '')
    const confirmPassword = String(fd.get('confirmPassword') ?? '')

    if (password !== confirmPassword) {
      setError('As senhas não coincidem')
      return
    }

    startTransition(async () => {
      const result = await createUserAction({ email, password })
      if (!result.success) {
        setError(result.error)
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
        <label className="mb-1.5 block text-sm font-medium text-foreground">E-mail</label>
        <Input name="email" type="email" required />
      </div>
      <div>
        <label className="mb-1.5 block text-sm font-medium text-foreground">Senha</label>
        <Input name="password" type="password" minLength={8} maxLength={72} required />
      </div>
      <div>
        <label className="mb-1.5 block text-sm font-medium text-foreground">Confirmar senha</label>
        <Input name="confirmPassword" type="password" minLength={8} maxLength={72} required />
      </div>
      <p className="text-xs text-muted-foreground">
        A conta é criada com role fixa <strong className="text-foreground">Comercial</strong>.
      </p>

      <div className="flex gap-3 pt-2">
        <Button type="button" variant="outline" onClick={onClose} className="flex-1" disabled={isPending}>Cancelar</Button>
        <Button type="submit" loading={isPending} className="flex-1">Criar</Button>
      </div>
    </form>
  )
}

interface UserListProps {
  users: AdminUserRow[]
}

export function UserList({ users }: UserListProps) {
  const [creating, setCreating] = useState(false)

  return (
    <>
      <div className="mb-4 flex items-center justify-between">
        <h1 className="font-display text-2xl font-bold text-foreground">Usuários</h1>
        <Button size="sm" onClick={() => setCreating(true)}>
          <Plus className="mr-2 h-4 w-4" />Novo
        </Button>
      </div>

      {users.length === 0 ? (
        <p className="py-8 text-center text-sm text-muted-foreground">Nenhum usuário comercial cadastrado.</p>
      ) : (
        <div className="space-y-3">
          {users.map((u) => (
            <div key={u.uuid} className="flex items-center gap-4 rounded-lg border border-border bg-card p-4">
              <UserCircle className="h-8 w-8 shrink-0 text-muted-foreground" aria-hidden="true" />
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <p className="font-medium text-foreground">{u.email}</p>
                  <Badge variant="default">Comercial</Badge>
                </div>
                <p className="mt-0.5 text-sm text-muted-foreground">Criado em {formatDate(u.created_at)}</p>
              </div>
            </div>
          ))}
        </div>
      )}

      <Modal open={creating} onOpenChange={setCreating}>
        <ModalContent>
          <ModalHeader><ModalTitle>Novo usuário</ModalTitle></ModalHeader>
          <ModalBody><UserForm onClose={() => setCreating(false)} /></ModalBody>
        </ModalContent>
      </Modal>
    </>
  )
}
