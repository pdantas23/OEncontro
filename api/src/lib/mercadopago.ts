const MP_API = 'https://api.mercadopago.com'

function getToken(): string {
  const token = process.env.MP_ACCESS_TOKEN
  if (!token) throw new Error('MP_ACCESS_TOKEN não configurado')
  return token
}

export interface MpPreferenceInput {
  items: Array<{ title: string; quantity: number; unit_price: number; currency_id: string }>
  payer: { name: string; email: string; identification?: { type: string; number: string } }
  back_urls: { success: string; failure: string; pending: string }
  auto_return: string
  external_reference: string
  notification_url: string
  statement_descriptor: string
}

export interface MpPreferenceResult {
  id: string
  init_point: string
  sandbox_init_point: string
}

export async function createPreference(input: MpPreferenceInput): Promise<MpPreferenceResult> {
  const res = await fetch(`${MP_API}/checkout/preferences`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${getToken()}`,
    },
    body: JSON.stringify(input),
  })

  if (!res.ok) {
    const body = await res.text()
    console.error('[mercadopago] Erro ao criar preference:', res.status, body)
    throw new Error(`MP API error ${res.status}`)
  }

  return res.json() as Promise<MpPreferenceResult>
}

export interface MpPayment {
  id: number
  status: string
  external_reference: string
}

export async function getPayment(paymentId: string): Promise<MpPayment | null> {
  const res = await fetch(`${MP_API}/v1/payments/${paymentId}`, {
    headers: { Authorization: `Bearer ${getToken()}` },
  })

  if (res.status === 404) {
    return null
  }

  if (!res.ok) {
    console.error('[mercadopago] Erro ao consultar payment:', res.status)
    throw new Error(`MP API error ${res.status}`)
  }

  return res.json() as Promise<MpPayment>
}
