'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import type { AdminRole } from '@/types/auth'

export interface AdminUser {
  userId: string
  email: string
  role: AdminRole
}

export function useAdminAuth() {
  const router = useRouter()
  const [user, setUser] = useState<AdminUser | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function checkAuth() {
      const supabase = createClient()
      const { data: { user: authUser } } = await supabase.auth.getUser()

      if (!authUser) {
        router.replace('/login')
        return
      }

      const { data: profile } = await supabase
        .from('profiles_encontro')
        .select('role')
        .eq('uuid', authUser.id)
        .maybeSingle()

      if (!profile || (profile.role !== 'comercial' && profile.role !== 'marketing')) {
        router.replace('/login')
        return
      }

      setUser({
        userId: authUser.id,
        email: authUser.email ?? '',
        role: profile.role as AdminRole,
      })
      setLoading(false)
    }

    checkAuth()
  }, [router])

  return { user, loading }
}
