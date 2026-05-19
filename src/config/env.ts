/**
 * src/config/env.ts
 *
 * Validação e centralização das variáveis de ambiente via Zod.
 * Falha explicitamente na inicialização se variável obrigatória estiver ausente.
 * Nenhum módulo acessa process.env diretamente — sempre via este arquivo.
 */

import { z } from 'zod'

// ---------------------------------------------------------------------------
// Schema
// ---------------------------------------------------------------------------

const envSchema = z.object({
  // Supabase
  NEXT_PUBLIC_SUPABASE_URL: z.string().url('NEXT_PUBLIC_SUPABASE_URL deve ser uma URL válida'),
  NEXT_PUBLIC_SUPABASE_ANON_KEY: z.string().min(1, 'NEXT_PUBLIC_SUPABASE_ANON_KEY é obrigatória'),
  SUPABASE_SERVICE_ROLE_KEY: z.string().min(1, 'SUPABASE_SERVICE_ROLE_KEY é obrigatória').optional(),

  // API de pagamento (Hono em api.royalhubacademy.com)
  NEXT_PUBLIC_API_URL: z.string().url('NEXT_PUBLIC_API_URL deve ser uma URL válida'),

  // Pagamentos — Mercado Pago Checkout Pro
  PAYMENT_PROVIDER: z.enum(['mock', 'stripe', 'pagarmé', 'asaas', 'mercadopago']).default('mercadopago'),
  PAYMENT_SECRET_KEY: z.string().optional(),
  PAYMENT_WEBHOOK_SECRET: z.string().optional(),
  NEXT_PUBLIC_PAYMENT_PUBLIC_KEY: z.string().optional(),
  NEXT_PUBLIC_MP_SANDBOX: z.string().default('true'),

  // Resend
  RESEND_API_KEY: z.string().optional(),
  RESEND_FROM_EMAIL: z.string().email().default('noreply@royalhubacademy.com.br'),
  RESEND_FROM_NAME: z.string().default('Evento'),

  // App
  NEXT_PUBLIC_APP_URL: z.string().url().default('http://localhost:3000'),
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),

  // Rastreamento — Task Final TF15
  NEXT_PUBLIC_GTM_ID: z.string().optional(),
  NEXT_PUBLIC_META_PIXEL_ID: z.string().optional(),
  NEXT_PUBLIC_GOOGLE_ADS_ID: z.string().optional(),
})

// ---------------------------------------------------------------------------
// Parse + validação na inicialização
// ---------------------------------------------------------------------------

function parseEnv() {
  const result = envSchema.safeParse(process.env)

  if (!result.success) {
    const errors = result.error.issues
      .map((issue) => `  • ${issue.path.join('.')}: ${issue.message}`)
      .join('\n')

    throw new Error(
      `\n[env] Variáveis de ambiente inválidas ou ausentes:\n${errors}\n` +
        'Verifique o arquivo .env.local e compare com .env.example\n',
    )
  }

  return result.data
}

export const env = parseEnv()

// ---------------------------------------------------------------------------
// Tipos derivados
// ---------------------------------------------------------------------------

export type Env = z.infer<typeof envSchema>
