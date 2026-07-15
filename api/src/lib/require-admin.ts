/**
 * api/src/lib/require-admin.ts
 *
 * Middleware Hono: valida o Bearer token do admin logado e garante
 * que o profile correspondente tem role comercial/marketing.
 *
 * getSupabase() é singleton com service role (ver lib/supabase.ts).
 * NUNCA chamar setSession()/signInWithPassword nesse client — sempre
 * auth.getUser(token) passando o token por chamada, senão a sessão de
 * um admin vaza pra outras requisições concorrentes no mesmo processo.
 */

import type { MiddlewareHandler } from 'hono'
import { getSupabase } from './supabase.js'

export interface AdminContext {
  uuid: string
  email: string
  role: string
}

export type AdminEnv = { Variables: { admin: AdminContext } }

export const requireAdmin: MiddlewareHandler<AdminEnv> = async (c, next) => {
  const authHeader = c.req.header('Authorization') ?? ''
  const token = authHeader.startsWith('Bearer ') ? authHeader.slice('Bearer '.length) : null

  if (!token) {
    return c.json({ success: false, error: 'Não autenticado' }, 401)
  }

  const supabase = getSupabase()
  const { data: { user }, error: userError } = await supabase.auth.getUser(token)

  if (userError || !user) {
    return c.json({ success: false, error: 'Sessão inválida ou expirada' }, 401)
  }

  const { data: profile, error: profileError } = await supabase
    .from('profiles_encontro')
    .select('uuid, email, role')
    .eq('uuid', user.id)
    .maybeSingle()

  if (profileError) {
    console.error('[require-admin] Erro ao buscar profile:', profileError.message)
    return c.json({ success: false, error: 'Erro ao validar acesso' }, 500)
  }

  if (!profile || (profile.role !== 'comercial' && profile.role !== 'marketing')) {
    return c.json({ success: false, error: 'Acesso negado' }, 403)
  }

  c.set('admin', profile as AdminContext)
  await next()
}
