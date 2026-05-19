/**
 * src/lib/supabase/server.ts
 *
 * Cliente Supabase para uso em Server Components no build estático.
 * Usa a anon key sem cookies — adequado para dados públicos em build time.
 */

import { createClient as createSupabaseClient } from '@supabase/supabase-js'
import type { Database } from '@/types/database'

export async function createClient() {
  return createSupabaseClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  )
}
