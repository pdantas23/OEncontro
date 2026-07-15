'use client'

import { useEffect, useState } from 'react'
import { useAdminAuth } from '@/hooks/useAdminAuth'
import { AdminLayout } from '@/components/layout/AdminLayout'
import { UserList } from '@/components/admin/usuarios/UserList'
import { listUsersAction, type AdminUserRow } from '@/app/admin/usuarios/actions'
import { Alert } from '@/components/ui/Alert'

export default function UsuariosPage() {
  const { user, loading: authLoading } = useAdminAuth()
  const [users, setUsers] = useState<AdminUserRow[]>([])
  const [error, setError] = useState<string | null>(null)
  const [dataLoading, setDataLoading] = useState(true)

  useEffect(() => {
    if (!user) return
    async function load() {
      const result = await listUsersAction()
      if (result.success) {
        setUsers(result.data)
      } else {
        setError(result.error)
      }
      setDataLoading(false)
    }
    load()
  }, [user])

  if (authLoading || dataLoading) {
    return <AdminLayout><div className="p-8 text-sm text-muted-foreground">Carregando…</div></AdminLayout>
  }

  return (
    <AdminLayout>
      <div className="p-6 lg:p-8">
        {error && <Alert variant="destructive" className="mb-4">{error}</Alert>}
        <UserList users={users} />
      </div>
    </AdminLayout>
  )
}
