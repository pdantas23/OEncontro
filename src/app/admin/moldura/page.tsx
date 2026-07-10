'use client'

import { useAdminAuth } from '@/hooks/useAdminAuth'
import { AdminLayout } from '@/components/layout/AdminLayout'
import { MolduraEditor } from '@/components/admin/moldura/MolduraEditor'

export default function MolduraPage() {
  const { user, loading } = useAdminAuth()

  if (loading || !user) {
    return (
      <AdminLayout>
        <div className="p-8 text-sm text-muted-foreground">Carregando…</div>
      </AdminLayout>
    )
  }

  return (
    <AdminLayout>
      <div className="p-6 lg:p-8">
        <MolduraEditor />
      </div>
    </AdminLayout>
  )
}
