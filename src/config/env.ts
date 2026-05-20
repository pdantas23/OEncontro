/**
 * src/config/env.ts
 *
 * Validação e centralização das variáveis de ambiente via Zod.
 * Falha explicitamente na inicialização se variável obrigatória estiver ausente.
 * Nenhum módulo acessa process.env diretamente — sempre via este arquivo.
 *
 * IMPORTANTE: Todas as vars NEXT_PUBLIC_* são lidas como referências literais
 * (process.env.NEXT_PUBLIC_X) para que o Next.js faça substituição estática
 * no bundle do cliente. Passar `process.env` como objeto para o Zod não
 * funciona porque o acesso seria dinâmico (process.env[key]).
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
  RESEND_FROM_EMAIL: z.string().email().default('noreply@royalhubacademy.com'),
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
// Leitura literal de cada var — necessário para substituição estática
// do Next.js no bundle do cliente. NÃO usar process.env como objeto.
// ---------------------------------------------------------------------------

function getEnvVars() {
  return {
    NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
    NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY,
    NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL,
    PAYMENT_PROVIDER: process.env.PAYMENT_PROVIDER,
    PAYMENT_SECRET_KEY: process.env.PAYMENT_SECRET_KEY,
    PAYMENT_WEBHOOK_SECRET: process.env.PAYMENT_WEBHOOK_SECRET,
    NEXT_PUBLIC_PAYMENT_PUBLIC_KEY: process.env.NEXT_PUBLIC_PAYMENT_PUBLIC_KEY,
    NEXT_PUBLIC_MP_SANDBOX: process.env.NEXT_PUBLIC_MP_SANDBOX,
    RESEND_API_KEY: process.env.RESEND_API_KEY,
    RESEND_FROM_EMAIL: process.env.RESEND_FROM_EMAIL,
    RESEND_FROM_NAME: process.env.RESEND_FROM_NAME,
    NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL,
    NODE_ENV: process.env.NODE_ENV,
    NEXT_PUBLIC_GTM_ID: process.env.NEXT_PUBLIC_GTM_ID,
    NEXT_PUBLIC_META_PIXEL_ID: process.env.NEXT_PUBLIC_META_PIXEL_ID,
    NEXT_PUBLIC_GOOGLE_ADS_ID: process.env.NEXT_PUBLIC_GOOGLE_ADS_ID,
  }
}

// ---------------------------------------------------------------------------
// Parse + validação na inicialização
// ---------------------------------------------------------------------------

function parseEnv() {
  const result = envSchema.safeParse(getEnvVars())

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
