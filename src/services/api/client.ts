/**
 * src/services/api/client.ts
 *
 * Cliente HTTP para a API Hono (api.royalhubacademy.com).
 * Usado pelos hooks de dados públicos em vez de Supabase direto.
 */

const API_URL = process.env.NEXT_PUBLIC_API_URL

interface ApiResponse<T> {
  data: T
  error?: string
}

export async function apiFetch<T>(path: string): Promise<T> {
  if (!API_URL) {
    throw new Error('NEXT_PUBLIC_API_URL não configurada')
  }

  const res = await fetch(`${API_URL}${path}`)

  if (!res.ok) {
    const body = await res.text().catch(() => '')
    throw new Error(`API error ${res.status}: ${body}`)
  }

  const json: ApiResponse<T> = await res.json()

  if (json.error) {
    throw new Error(json.error)
  }

  return json.data
}
