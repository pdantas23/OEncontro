import { createClient, type SupabaseClient } from '@supabase/supabase-js'
import ws from 'ws'

let _client: SupabaseClient | null = null

export function getSupabase(): SupabaseClient {
  if (!_client) {
    const url = process.env.SUPABASE_URL
    const key = process.env.SUPABASE_SERVICE_ROLE_KEY

    if (!url || !key) {
      throw new Error('SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY são obrigatórios')
    }

    _client = createClient(url, key, {
      auth: { persistSession: false, autoRefreshToken: false },
      // Node 20 não tem WebSocket nativo. Injeta ws como polyfill
      // para satisfazer o RealtimeClient (que inicializa mesmo sem uso).
      realtime: { transport: ws as unknown as typeof WebSocket },
    })
  }
  return _client
}
