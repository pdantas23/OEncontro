/**
 * src/lib/supabase/middleware.ts
 *
 * Helper para uso no src/middleware.ts.
 * Atualiza a sessão do usuário em cada request e retorna o user atual
 * junto com o cliente supabase para queries adicionais no middleware.
 */

import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'
import type { SupabaseClient, User } from '@supabase/supabase-js'
import type { Database } from '@/types/database'

interface UpdateSessionResult {
  response: NextResponse
  user: User | null
  supabase: SupabaseClient<Database>
}

export async function updateSession(request: NextRequest): Promise<UpdateSessionResult> {
  let response = NextResponse.next({ request })

  const supabase = createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
          response = NextResponse.next({ request })
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options),
          )
        },
      },
    },
  )

  // Atualiza sessão — não remover esta linha
  const {
    data: { user },
  } = await supabase.auth.getUser()

  return { response, user, supabase }
}
