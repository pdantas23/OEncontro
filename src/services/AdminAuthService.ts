/**
 * src/services/AdminAuthService.ts
 *
 * Regras de negócio de autenticação do painel administrativo.
 * Autenticação: Supabase Auth (e-mail + senha, sem OAuth, sem magic link).
 * Autorização: role lida de profiles_encontro — fonte de verdade única.
 */

import { createClient } from '@/lib/supabase/server'
import type { AdminSession, AuthResult } from '@/types/auth'

export const AdminAuthService = {
  /**
   * Autentica o usuário com e-mail e senha.
   * Busca a role em profiles_encontro — sem app_metadata.
   */
  async signIn(email: string, password: string): Promise<AuthResult & { session?: AdminSession }> {
    const supabase = await createClient()

    const { data, error } = await supabase.auth.signInWithPassword({ email, password })

    if (error) {
      return { success: false, error: 'E-mail ou senha incorretos.' }
    }

    // Busca perfil e role na tabela — sem depender de app_metadata
    const { data: profile } = await supabase
      .from('profiles_encontro')
      .select('role')
      .eq('uuid', data.user.id)
      .maybeSingle()

    if (!profile || (profile.role !== 'comercial' && profile.role !== 'marketing')) {
      await supabase.auth.signOut()
      return { success: false, error: 'Acesso não autorizado.' }
    }

    return {
      success: true,
      session: {
        userId: data.user.id,
        email: data.user.email ?? email,
        role: profile.role as AdminSession['role'],
        name: data.user.user_metadata?.name as string | undefined,
      },
    }
  },

  /**
   * Encerra a sessão.
   */
  async signOut(): Promise<AuthResult> {
    const supabase = await createClient()
    const { error } = await supabase.auth.signOut()

    if (error) {
      return { success: false, error: 'Erro ao encerrar sessão.' }
    }

    return { success: true }
  },

  /**
   * Retorna a sessão atual buscando a role em profiles_encontro.
   */
  async getSession(): Promise<AdminSession | null> {
    const supabase = await createClient()

    const {
      data: { user },
      error,
    } = await supabase.auth.getUser()

    if (error || !user) return null

    const { data: profile } = await supabase
      .from('profiles_encontro')
      .select('role')
      .eq('uuid', user.id)
      .maybeSingle()

    if (!profile || (profile.role !== 'comercial' && profile.role !== 'marketing')) return null

    return {
      userId: user.id,
      email: user.email ?? '',
      role: profile.role as AdminSession['role'],
      name: user.user_metadata?.name as string | undefined,
    }
  },

  /**
   * Verifica se há sessão ativa com perfil válido em profiles_encontro.
   */
  async isAuthenticated(): Promise<boolean> {
    const session = await this.getSession()
    return session !== null
  },
}
