// Client-side — sem 'use server'
import { z } from 'zod'
import { createClient } from '@/lib/supabase/client'
import { env } from '@/config/env'

export interface AdminUserRow {
  uuid: string
  email: string
  role: string
  created_at: string
}

type ActionResult<T> =
  | { success: true; data: T }
  | { success: false; error: string; fields?: Record<string, string[]> }

async function authHeader(): Promise<{ Authorization: string } | null> {
  const supabase = createClient()
  const { data: { session } } = await supabase.auth.getSession()
  if (!session) return null
  return { Authorization: `Bearer ${session.access_token}` }
}

function mapError(status: number, serverMessage?: string): string {
  if (status === 401) return 'Sessão expirada, faça login novamente.'
  if (status === 403) return 'Sem permissão para esta ação.'
  if (status === 409 || status === 400) return serverMessage ?? 'Dados inválidos.'
  return serverMessage ?? 'Erro ao processar solicitação. Tente novamente.'
}

export async function listUsersAction(): Promise<ActionResult<AdminUserRow[]>> {
  const headers = await authHeader()
  if (!headers) return { success: false, error: 'Sessão expirada, faça login novamente.' }

  const res = await fetch(`${env.NEXT_PUBLIC_API_URL}/admin/users`, { headers })
  const json = await res.json().catch(() => null)

  if (!res.ok || !json?.success) {
    return { success: false, error: mapError(res.status, json?.error) }
  }
  return { success: true, data: json.data as AdminUserRow[] }
}

const createUserSchema = z.object({
  email: z.string().email('E-mail inválido'),
  password: z.string().min(8, 'Senha deve ter no mínimo 8 caracteres').max(72, 'Senha muito longa'),
})

export async function createUserAction(input: unknown): Promise<ActionResult<AdminUserRow>> {
  const parsed = createUserSchema.safeParse(input)
  if (!parsed.success) {
    return { success: false, error: 'Dados inválidos', fields: parsed.error.flatten().fieldErrors }
  }

  const headers = await authHeader()
  if (!headers) return { success: false, error: 'Sessão expirada, faça login novamente.' }

  const res = await fetch(`${env.NEXT_PUBLIC_API_URL}/admin/users`, {
    method: 'POST',
    headers: { ...headers, 'Content-Type': 'application/json' },
    body: JSON.stringify(parsed.data),
  })
  const json = await res.json().catch(() => null)

  if (!res.ok || !json?.success) {
    return { success: false, error: mapError(res.status, json?.error), fields: json?.fields }
  }
  return { success: true, data: json.data as AdminUserRow }
}
