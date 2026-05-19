// Client-side auth — não usa 'use server'
import { createClient } from '@/lib/supabase/client'
import type { AdminLoginInput } from '@/lib/validations/auth'
import type { AuthResult } from '@/types/auth'

export async function adminSignInAction(input: AdminLoginInput): Promise<AuthResult> {
  const supabase = createClient()

  const { data, error } = await supabase.auth.signInWithPassword({
    email: input.email,
    password: input.password,
  })

  if (error || !data.user) {
    return { success: false, error: 'E-mail ou senha incorretos.' }
  }

  const { data: profile } = await supabase
    .from('profiles_encontro')
    .select('role')
    .eq('uuid', data.user.id)
    .maybeSingle()

  if (!profile || (profile.role !== 'comercial' && profile.role !== 'marketing')) {
    await supabase.auth.signOut()
    return { success: false, error: 'Acesso não autorizado.' }
  }

  return { success: true }
}
