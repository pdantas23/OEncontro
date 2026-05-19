import { serve } from '@hono/node-server'
import { Hono } from 'hono'
import { cors } from 'hono/cors'
import createPreference from './routes/create-preference.js'
import webhook from './routes/webhook.js'

const app = new Hono()

// ---------------------------------------------------------------------------
// CORS — só para rotas chamadas pelo browser (create-preference).
// O webhook é chamado server-to-server pelo MP, sem CORS.
// ---------------------------------------------------------------------------

const allowedOrigins = (process.env.CORS_ALLOWED_ORIGINS ?? '')
  .split(',')
  .map((o) => o.trim())
  .filter(Boolean)

if (allowedOrigins.length === 0) {
  console.warn(
    '[CORS] CORS_ALLOWED_ORIGINS não definida ou vazia. ' +
    'Nenhuma origem cross-origin será aceita. ' +
    'Defina CORS_ALLOWED_ORIGINS no ambiente para liberar o frontend.'
  )
}

app.use(
  '/create-preference/*',
  cors({
    origin: allowedOrigins,
    allowMethods: ['GET', 'POST', 'OPTIONS'],
    allowHeaders: ['Content-Type', 'Authorization'],
  }),
)

// ---------------------------------------------------------------------------
// Rotas
// ---------------------------------------------------------------------------

app.get('/health', (c) => c.json({ ok: true }))

app.route('/create-preference', createPreference)
app.route('/mp-webhook', webhook)

// ---------------------------------------------------------------------------
// Servidor
// ---------------------------------------------------------------------------

const port = Number(process.env.PORT) || 3000

console.log(`[api] Iniciando na porta ${port}`)
serve({ fetch: app.fetch, port })
