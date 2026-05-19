'use client'

import { createContext, useContext, useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { AdminSession } from '@/types/auth'

// ---------------------------------------------------------------------------
// Context
// ---------------------------------------------------------------------------

interface AuthContextValue {
  session: AdminSession | null
  loading: boolean
  signOut: () => Promise<void>
}

const AuthContext = createContext<AuthContextValue | null>(null)

// ---------------------------------------------------------------------------
// Provider
// ---------------------------------------------------------------------------

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<AdminSession | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const supabase = createClient()

    async function loadSession() {
      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (user) {
        const { data: profile } = await supabase
          .from('profiles_encontro')
          .select('role')
          .eq('uuid', user.id)
          .maybeSingle()

        if (profile && (profile.role === 'comercial' || profile.role === 'marketing')) {
          setSession({
            userId: user.id,
            email: user.email ?? '',
            role: profile.role as AdminSession['role'],
            name: user.user_metadata?.name as string | undefined,
          })
        } else {
          setSession(null)
        }
      } else {
        setSession(null)
      }

      setLoading(false)
    }

    loadSession()

    // Ouvir mudanças de sessão (login/logout em outras abas)
    const { data: subscription } = supabase.auth.onAuthStateChange(async (_event, supabaseSession) => {
      if (supabaseSession?.user) {
        const { data: profile } = await supabase
          .from('profiles_encontro')
          .select('role')
          .eq('uuid', supabaseSession.user.id)
          .maybeSingle()

        if (profile && (profile.role === 'comercial' || profile.role === 'marketing')) {
          setSession({
            userId: supabaseSession.user.id,
            email: supabaseSession.user.email ?? '',
            role: profile.role as AdminSession['role'],
            name: supabaseSession.user.user_metadata?.name as string | undefined,
          })
        } else {
          setSession(null)
        }
      } else {
        setSession(null)
      }
    })

    return () => subscription.subscription.unsubscribe()
  }, [])

  async function signOut() {
    const supabase = createClient()
    await supabase.auth.signOut()
    setSession(null)
  }

  return (
    <AuthContext.Provider value={{ session, loading, signOut }}>
      {children}
    </AuthContext.Provider>
  )
}

// ---------------------------------------------------------------------------
// Hook público
// ---------------------------------------------------------------------------

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext)

  if (!ctx) {
    throw new Error('useAuth deve ser usado dentro de <AuthProvider>')
  }

  return ctx
}
