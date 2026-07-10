import { Hono } from 'hono'
import { buildApprovalHtml } from '../lib/email-templates.js'

const app = new Hono()

app.get('/', (c) => {
  const html = buildApprovalHtml({
    buyerName: 'João da Silva',
    orderShort: 'A1B2C3D4',
    formattedTotal: 'R$ 497,00',
  })
  return c.html(html)
})

export default app
