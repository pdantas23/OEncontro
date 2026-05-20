'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { AdminRole } from '@/types/auth'

const basePath = process.env.NEXT_PUBLIC_BASE_PATH ?? ''

export interface AdminUser {
  userId: string
  email: string
  role: AdminRole
}

export function useAdminAuth() {
  const [user, setUser] = useState<AdminUser | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function checkAuth() {
      const supabase = createClient()
      const { data: { user: authUser } } = await supabase.auth.getUser()

      if (!authUser) {
        // static export: window.location em vez de router.replace
        window.location.replace(`${basePath}/login`)
        return
      }

      const { data: profile } = await supabase
        .from('profiles_encontro')
        .select('role')
        .eq('uuid', authUser.id)
        .maybeSingle()

      if (!profile || (profile.role !== 'comercial' && profile.role !== 'marketing')) {
        window.location.replace(`${basePath}/login`)
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
  }, [])

  return { user, loading }
}
