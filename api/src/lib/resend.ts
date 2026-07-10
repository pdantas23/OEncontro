/**
 * Envio de e-mail best-effort via Resend.
 * Se RESEND_API_KEY estiver ausente ou vazia, pula silenciosamente.
 * Nunca lança exceção — falhas são logadas e ignoradas.
 */

interface SendEmailInput {
  to: string
  subject: string
  html: string
}

export async function sendEmail(input: SendEmailInput): Promise<boolean> {
  const apiKey = process.env.RESEND_API_KEY
  if (!apiKey) {
    console.warn('[resend] RESEND_API_KEY não configurada — e-mail não enviado')
    return false
  }

  const fromEmail = process.env.RESEND_FROM_EMAIL ?? 'noreply@seudominio.com.br'
  const fromName = process.env.RESEND_FROM_NAME ?? 'O Encontro 2026'

  try {
    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        from: `${fromName} <${fromEmail}>`,
        to: [input.to],
        subject: input.subject,
        html: input.html,
      }),
    })

    if (!res.ok) {
      const err = await res.text()
      console.error('[resend] Erro:', res.status, err)
      return false
    }

    console.log('[resend] E-mail enviado para', input.to)
    return true
  } catch (err) {
    console.error('[resend] Falha ao enviar e-mail:', err)
    return false
  }
}
