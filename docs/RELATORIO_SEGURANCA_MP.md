# Relatório de Segurança — Integração Mercado Pago

> **Migração de arquitetura (2026-05-19):** O código de pagamento foi migrado
> de Supabase Edge Functions (`supabase/functions/mp-*`) para uma API HTTP
> separada em Node.js/Hono (`api/src/routes/*`). Os itens abaixo continuam
> aplicáveis na nova arquitetura — só mudou o local onde o código vive.
> As Edge Functions antigas podem ser removidas após validação em produção.
> As migrations 20240005 (mp_preference_id) e 20240006 (RPC RLS) continuam válidas.

**Data:** 2026-05-19
**Escopo:** API HTTP `api/src/routes/*`, `checkout/actions.ts`, polling `/obrigado`, RLS policies.
**Tipo:** Auditoria de código.
**Atualização:** 2026-05-19 — Seção 3 "RLS bloqueia polling da /obrigado" RESOLVIDO via RPC `get_order_status` SECURITY DEFINER (migration 20240006). Demais itens (#1, #2, #4, #5) permanecem PENDENTES.

---

## 1. CRÍTICO — Validação de assinatura do webhook

**O problema existe? SIM**

**Severidade: CRÍTICA**

**Arquivo:** `supabase/functions/mp-webhook/index.ts` (linhas 45-63)

**Descrição:**
A função `mp-webhook` aceita qualquer POST com um JSON contendo `type: "payment"` e `data.id`. Não há validação do header `x-signature` nem do `x-request-id` enviados pelo Mercado Pago.

O código atual apenas parseia o body e extrai `body.data.id`:

```typescript
// Linha 52-53
const body = await req.json()
if (body.type !== 'payment' && body.action !== 'payment.created' && body.action !== 'payment.updated') {
```

**Impacto:**
Um atacante que conheça (ou adivinhe) um `order_id` válido pode enviar uma requisição POST forjada para `{SUPABASE_URL}/functions/v1/mp-webhook` e marcar qualquer pedido como "paid" — recebendo ingresso e e-mail de confirmação sem pagar.

**Mitigação parcial existente:**
Após receber a notificação, o webhook consulta `GET /v1/payments/{paymentId}` na API do MP (linha 73) usando o `MP_ACCESS_TOKEN` real. Se o `paymentId` for inventado ou não existir na API do MP, a consulta retorna erro e o fluxo para (linha 77-79). Isso impede um ataque trivial com um `paymentId` inexistente.

**Ataque ainda possível:**
Um atacante pode usar qualquer `paymentId` válido de OUTRA transação (ou do mesmo vendedor) cujo status seja "approved". O webhook consultaria essa transação no MP, receberia `status: approved`, e usaria o `external_reference` desse pagamento. Se o `external_reference` corresponder a um pedido local, o pedido seria marcado como pago. No entanto, o atacante precisaria adivinhar um `paymentId` de uma transação real aprovada E o pedido correspondente — cenário improvável mas não impossível.

**O que fazer:**
1. Validar o header `x-signature` usando o HMAC-SHA256 com o `webhook_secret` obtido no painel do MP.
2. Comparar `x-request-id` para garantir que a notificação veio do MP.
3. Adicionar o secret `MP_WEBHOOK_SECRET` às variáveis de ambiente da Edge Function.
4. Documentação do MP: https://www.mercadopago.com.br/developers/pt/docs/your-integrations/notifications/webhooks

---

## 2. MÉDIO — Idempotência de notificações IPN

**O problema existe? PARCIALMENTE TRATADO**

**Severidade: MÉDIA**

**Arquivo:** `supabase/functions/mp-webhook/index.ts` (linhas 110-128)

**Descrição:**
Há uma verificação parcial de idempotência: o webhook checa se o pedido já tem status terminal antes de atualizá-lo:

```typescript
// Linhas 111-114
const terminalStatuses = ['paid', 'refunded']
if (terminalStatuses.includes(order.payment_status)) {
  return new Response('OK', { status: 200 })
}
```

**Problemas remanescentes:**

### 2a. E-mail duplicado em notificações concorrentes
Se o MP enviar duas notificações `approved` quase simultaneamente (o que acontece na prática — MP pode reenviar IPNs), ambas as requisições podem ler o pedido ANTES de qualquer uma atualizá-lo para "paid". As duas passariam pela verificação de status terminal e ambas:
- Atualizariam o pedido (operação idempotente — sem problema)
- Chamariam `sendApprovalEmail()` (e-mail duplicado — problema)

O `sendApprovalEmail` no webhook NÃO usa o `EmailLogRepository.alreadySent()` que existe no `EmailService` da aplicação Next.js. Ele insere direto no `email_logs_encontro`, mas não verifica se já foi enviado.

### 2b. `failed` → `paid` não tratado
A lista `terminalStatuses` inclui `['paid', 'refunded']` mas não `failed` nem `canceled`. Isso é CORRETO para o caso onde o MP envia `rejected` seguido de `approved` (ex: retentativa automática). Porém, se o status mudar de `failed` para `paid`, a função `release_ticket_slot` já teria sido chamada na notificação `failed`, liberando a vaga. A notificação `paid` subsequente marcaria o pedido como pago SEM reservar a vaga novamente — inconsistência de estoque.

**O que fazer:**
1. Adicionar `SELECT ... FOR UPDATE` (ou `advisory lock`) no pedido antes de processar, para serializar notificações concorrentes do mesmo pedido.
2. Verificar em `sendApprovalEmail` se já existe log com `status: 'sent'` para o template `payment_approved` daquele pedido antes de enviar.
3. Quando status muda de `failed`/`canceled` para `paid`, chamar `reserve_ticket_slot` novamente antes de confirmar o pagamento.

---

## 3. ~~CRÍTICO~~ RESOLVIDO — RLS bloqueia polling da /obrigado (com anon key)

**Status: RESOLVIDO em 2026-05-19**

**Migration:** `supabase/migrations/20240006_fix_rls_obrigado.sql`

**Abordagem:** Opção B refinada — RPC `get_order_status(p_order_id uuid)` com `SECURITY DEFINER`.

Descartamos Opção A (policy anon SELECT na tabela) porque exporia a tabela inteira para leitura anônima via PostgREST. Descartamos View porque `security_invoker=false` também permitiria listagem completa. O RPC aceita um UUID como parâmetro obrigatório e retorna APENAS 6 colunas: `id`, `payment_status`, `payment_method`, `buyer_name`, `buyer_email`, `total`. Campos sensíveis (`buyer_cpf`, `buyer_whatsapp`, `payment_id`, `pix_code`, `mp_preference_id`) permanecem protegidos.

**Arquivos alterados:**
- `supabase/migrations/20240006_fix_rls_obrigado.sql` — RPC + GRANT
- `src/types/database.ts` — tipo da RPC adicionado
- `src/types/checkout.ts` — tipo `OrderSummary` adicionado
- `src/app/obrigado/page.tsx` — usa `supabase.rpc('get_order_status')` em vez de query direta
- `src/hooks/usePaymentStatus.ts` — usa RPC para polling
- `src/components/obrigado/ObrigadoContent.tsx` — aceita `OrderSummary` em vez de `Order`
- `src/app/checkout/actions.ts` — gera UUID client-side (evita RETURNING bloqueado)

**Verificação (testes reais no banco):**
- RPC com anon key + UUID válido → retorna dados sem campos sensíveis ✅
- Query direta na tabela com anon key → `[]` (RLS continua bloqueando) ✅
- RPC com UUID inexistente → `[]` ✅
- RPC sem parâmetro → erro PGRST202 (não permite enumeração) ✅

---

## 4. BAIXO — Robustez da compensação no checkout

**O problema existe? PARCIALMENTE TRATADO**

**Severidade: BAIXA**

**Arquivo:** `src/app/checkout/actions.ts` (linhas 74-129)

**Descrição:**
A compensação está implementada em três pontos de falha:

| Cenário | Compensação | Status |
|---------|-------------|--------|
| INSERT do pedido falha | `release_ticket_slot` (linha 76) | OK |
| Edge Function retorna erro | `release_ticket_slot` + update para `failed` (linhas 114-115) | OK |
| Exceção inesperada (catch) | `release_ticket_slot` + update para `failed` (linhas 127-128) | OK |

**Cenário de falha parcial NÃO tratado:**

Se a chamada `release_ticket_slot` em si falhar (ex: rede caiu depois do fetch falhar), a vaga fica presa indefinidamente. Isso é um risco residual baixo porque:
- O RPC usa transação no Postgres (falha = rollback)
- Falha de rede simultânea no insert E no release é improvável

**Outro cenário:**
Se o `window.location.href = init_point` falhar (ex: bloqueador de popup, ou o usuário fecha o navegador antes do redirect), o pedido fica com status `pending` e a vaga fica reservada. Não há mecanismo de timeout/expiração para liberar vagas de pedidos abandonados nesta etapa (ver item #5).

**O que fazer:**
1. Adicionar retry no `release_ticket_slot` em caso de falha de rede (tentativa 2 com 1s de delay).
2. Ver item #5 para expiração automática de pedidos abandonados.

---

## 5. ALTO — Expiração da preference / pedidos abandonados

**O problema existe? SIM**

**Severidade: ALTA**

**Arquivo:** `supabase/functions/mp-create-preference/index.ts` (linhas 58-80)

**Descrição:**
A preference do Mercado Pago é criada SEM os campos `expiration_date_from` e `expiration_date_to`:

```typescript
const preference = {
  items: [...],
  payer: {...},
  back_urls: {...},
  auto_return: 'approved',
  external_reference: order_id,
  notification_url: ...,
  statement_descriptor: 'ENCONTRO',
  // ❌ SEM expiration_date_to
}
```

**Impacto:**
1. **Vaga presa indefinidamente:** A `reserve_ticket_slot` é chamada ANTES do redirect para o MP (no `actions.ts`, linha 39). Se o usuário:
   - Abre a página do MP e não paga
   - Fecha o navegador
   - Volta ao MP dias depois e paga

   A vaga estará reservada mas o pedido ficará em `pending` permanentemente se o webhook não for chamado.

2. **Sem cleanup automático:** Não há cronjob, Edge Function agendada ou mecanismo que expire pedidos pendentes e libere vagas.

3. **Acúmulo de vagas fantasma:** Em cenários com tráfego moderado, dezenas de vagas podem ficar presas em pedidos abandonados, causando "sold out" artificial.

**O que fazer:**
1. Adicionar `expiration_date_to` na preference (recomendado: 30 minutos):
   ```typescript
   expiration_date_to: new Date(Date.now() + 30 * 60 * 1000).toISOString()
   ```
2. Criar um cronjob (Edge Function ou Supabase pg_cron) que rode a cada 15 minutos:
   - Busca pedidos com `payment_status = 'pending'` e `created_at < NOW() - INTERVAL '30 minutes'`
   - Para cada um: chama `release_ticket_slot` e atualiza status para `expired`
3. A função `OrderRepository.findExpiredPix()` já existe e pode ser adaptada para este caso.

---

## Prioridade de correção

| # | Item | Severidade | Impacto | Status |
|---|------|------------|---------|--------|
| 3 | RLS bloqueia polling /obrigado | ~~CRÍTICA~~ | ~~Fluxo pós-pagamento quebrado~~ | **RESOLVIDO** (2026-05-19) |
| 1 | Webhook sem validação de assinatura | CRÍTICA | Pedidos podem ser marcados como pagos sem pagamento | **PENDENTE — ANTES DO GO-LIVE** |
| 5 | Sem expiração de preference/pedidos | ALTA | Vagas presas em pedidos abandonados = sold out artificial | **PENDENTE — ANTES DO GO-LIVE** |
| 2 | Idempotência parcial (e-mail duplicado) | MÉDIA | E-mails duplicados; edge case de estoque inconsistente | **PENDENTE — LOGO APÓS GO-LIVE** |
| 4 | Compensação de falha parcial | BAIXA | Risco residual em cenários de falha de rede simultânea | **PENDENTE — NICE TO HAVE** |

---

## Notas adicionais

- **`checkout/actions.ts` roda no CLIENTE (browser):** O código usa `createClient` (anon key) e `window.location.href`. Isso significa que todas as validações de preço e cálculos de total são feitas no cliente. Embora os preços venham do banco (não do input do usuário), um atacante sofisticado poderia manipular o DOM/JS para alterar o total enviado à Edge Function. A Edge Function `mp-create-preference` usa o total recebido do cliente sem revalidar contra o banco. **Recomendação:** recalcular o total dentro da Edge Function usando os dados do banco.

- **CORS `Access-Control-Allow-Origin: *`:** A Edge Function `mp-create-preference` usa `Access-Control-Allow-Origin: *`. Para produção, considerar restringir ao domínio real (`seudominio.com.br`).
