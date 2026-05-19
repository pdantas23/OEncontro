/**
 * src/repositories/AdminUserRepository.ts
 *
 * Acesso à tabela profiles_encontro.
 * uuid é o PK e FK para auth.users (mesmo UUID do Supabase Auth).
 * Autorização (role) vive no JWT — não fazer query aqui para verificar permissão.
 */

import { createClient } from '@/lib/supabase/server'
import type { AdminUser } from '@/types/auth'
import type { Database } from '@/types/database'

type ProfileRow = Database['public']['Tables']['profiles_encontro']['Row']

function toAdminUser(row: ProfileRow): AdminUser {
  return {
    uuid: row.uuid,
    email: row.email,
    role: row.role as AdminUser['role'],
    createdAt: row.created_at,
  }
}

export const AdminUserRepository = {
  async findByUuid(uuid: string): Promise<AdminUser | null> {
    const supabase = await createClient()

    const { data, error } = await supabase
      .from('profiles_encontro')
      .select('*')
      .eq('uuid', uuid)
      .maybeSingle()

    if (error) {
      console.error('[AdminUserRepository.findByUuid]', error.message)
      return null
    }

    return data ? toAdminUser(data) : null
  },

  async findAll(): Promise<AdminUser[]> {
    const supabase = await createClient()

    const { data, error } = await supabase
      .from('profiles_encontro')
      .select('*')
      .order('created_at', { ascending: true })

    if (error) {
      console.error('[AdminUserRepository.findAll]', error.message)
      return []
    }

    return (data ?? []).map(toAdminUser)
  },

  async create(input: { uuid: string; email: string; role?: string }): Promise<AdminUser | null> {
    const supabase = await createClient()

    const { data, error } = await supabase
      .from('profiles_encontro')
      .insert({
        uuid: input.uuid,
        email: input.email,
        role: input.role ?? 'comercial',
      })
      .select()
      .single()

    if (error) {
      console.error('[AdminUserRepository.create]', error.message)
      return null
    }

    return data ? toAdminUser(data) : null
  },
}
