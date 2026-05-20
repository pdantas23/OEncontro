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
        return prev
      }
      return next
    })
  }, [])

  // Carrega perfil do banco e atualiza session.
  // Separado para ser reutilizável sem bloquear o onAuthStateChange.
  const loadProfile = useCallback(
    (userId: string, email: string, name: string | undefined) => {
      const supabase = createClient()
      // Fire-and-forget — NÃO usar await aqui.
      // O onAuthStateChange do Supabase faz await de todos os listeners
      // antes de resolver signInWithPassword. Se este callback for async
      // e fizer await de uma query, causa deadlock.
      void (async () => {
        try {
          const { data: profile } = await supabase
            .from('profiles_encontro')
            .select('role')
            .eq('uuid', userId)
            .maybeSingle()

          if (profile && (profile.role === 'comercial' || profile.role === 'marketing')) {
            updateSession({
              userId,
              email,
              role: profile.role as AdminSession['role'],
              name,
            })
          } else {
            updateSession(null)
          }
        } catch {
          updateSession(null)
        }
      })()
    },
    [updateSession],
  )

  useEffect(() => {
    const supabase = createClient()

    async function loadSession() {
      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (user) {
        loadProfile(
          user.id,
          user.email ?? '',
          user.user_metadata?.name as string | undefined,
        )
      } else {
        updateSession(null)
      }

      setLoading(false)
    }

    loadSession()

    // onAuthStateChange NÃO pode ser async.
    // signInWithPassword faz await _notifyAllSubscribers() e espera
    // TODOS os listeners completarem antes de resolver. Se o listener
    // fizer await de uma query, o signIn trava (deadlock).
    // Solução: fire-and-forget via loadProfile (usa .then internamente).
    const { data: subscription } = supabase.auth.onAuthStateChange((_event, supabaseSession) => {
      if (supabaseSession?.user) {
        loadProfile(
          supabaseSession.user.id,
          supabaseSession.user.email ?? '',
          supabaseSession.user.user_metadata?.name as string | undefined,
        )
      } else {
        updateSession(null)
      }
    })

    return () => subscription.subscription.unsubscribe()
  }, [updateSession, loadProfile])

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
