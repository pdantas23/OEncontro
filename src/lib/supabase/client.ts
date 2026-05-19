/**
 * src/lib/supabase/client.ts
 *
 * Cliente Supabase para uso em Client Components ('use client').
 * NUNCA usar este cliente em Server Components ou API Routes.
 * Para server-side, usar @/lib/supabase/server.ts
 */

import { createBrowserClient } from '@supabase/ssr'
import type { Database } from '@/types/database'

export function createClient() {
  return createBrowserClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  )
}
