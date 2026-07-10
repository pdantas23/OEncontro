import { serve } from '@hono/node-server'
import { Hono } from 'hono'
import { cors } from 'hono/cors'
import createOrder from './routes/create-order.js'
import createPreference from './routes/create-preference.js'
import webhook from './routes/webhook.js'
import publicRoutes from './routes/public.js'
import emailPreview from './routes/email-preview.js'

const app = new Hono()

// ---------------------------------------------------------------------------
// CORS — rotas chamadas pelo browser (create-preference + endpoints públicos).
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

const corsMiddleware = cors({
  origin: allowedOrigins,
  allowMethods: ['GET', 'POST', 'OPTIONS'],
  allowHeaders: ['Content-Type', 'Authorization'],
})

app.use('/create-order/*', corsMiddleware)
app.use('/create-order', corsMiddleware)
app.use('/create-preference/*', corsMiddleware)
app.use('/lots/*', corsMiddleware)
app.use('/lots', corsMiddleware)
app.use('/order-bumps/*', corsMiddleware)
app.use('/order-bumps', corsMiddleware)
app.use('/speakers/*', corsMiddleware)
app.use('/speakers', corsMiddleware)
app.use('/schedule/*', corsMiddleware)
app.use('/schedule', corsMiddleware)
app.use('/event-config/*', corsMiddleware)
app.use('/event-config', corsMiddleware)

// ---------------------------------------------------------------------------
// Rotas
// ---------------------------------------------------------------------------

app.get('/health', (c) => c.json({ ok: true }))

// Checkout + Pagamento MP
app.route('/create-order', createOrder)
app.route('/create-preference', createPreference)
app.route('/mp-webhook', webhook)

// Preview de e-mail (somente dev)
if (process.env.NODE_ENV !== 'production') {
  app.route('/email-preview', emailPreview)
}

// Dados públicos (leitura)
app.route('/', publicRoutes)

// ---------------------------------------------------------------------------
// Servidor
// ---------------------------------------------------------------------------

import { startCleanupScheduler } from './lib/cleanup.js'

const port = Number(process.env.PORT) || 3000

console.log(`[api] Iniciando na porta ${port}`)
serve({ fetch: app.fetch, port })

// Expira pedidos pending > 30min a cada 15 minutos
startCleanupScheduler()
