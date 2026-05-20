'use client'

import { createContext, useCallback, useContext, useEffect, useState } from 'react'
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

  // Atualiza session apenas se os dados realmente mudaram.
  // Evita re-render em cascata quando onAuthStateChange emite eventos
  // repetidos (INITIAL_SESSION, TOKEN_REFRESHED) com mesmos dados.
  const updateSession = useCallback((next: AdminSession | null) => {
    setSession((prev) => {
      if (prev === null && next === null) return prev
      if (prev === null || next === null) return next
      if (
        prev.userId === next.userId &&
        prev.email === next.email &&
        prev.role === next.role &&
        prev.name === next.name
      ) {
        return prev // mesma referência → sem re-render
      }
      return next
    })
  }, [])

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
          updateSession({
            userId: user.id,
            email: user.email ?? '',
            role: profile.role as AdminSession['role'],
            name: user.user_metadata?.name as string | undefined,
          })
        } else {
          updateSession(null)
        }
      } else {
        updateSession(null)
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
          updateSession({
            userId: supabaseSession.user.id,
            email: supabaseSession.user.email ?? '',
            role: profile.role as AdminSession['role'],
            name: supabaseSession.user.user_metadata?.name as string | undefined,
          })
        } else {
          updateSession(null)
        }
      } else {
        updateSession(null)
      }
    })

    return () => subscription.subscription.unsubscribe()
  }, [updateSession])

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
