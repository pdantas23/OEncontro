# Roadmap — O Encontro 2026

**Atualizado:** 2026-05-20

---

## Pré-produção (antes de aceitar pagamento real)

### 1. Segurança — Rotação de credenciais

As seguintes credenciais foram expostas durante sessões de desenvolvimento
e devem ser rotacionadas antes do go-live:

- [ ] **MP_ACCESS_TOKEN** — gerar novo no painel do Mercado Pago
- [ ] **SUPABASE_SERVICE_ROLE_KEY** — regenerar no Supabase (Settings > API)
- [ ] **SUPABASE_ANON_KEY** — regenerar junto com a service role key
- [ ] **Webhook signature secret do MP** — gerar/atualizar no painel MP
- [ ] **Usuário de teste do MP** — recriar (senha exposta)
- [ ] Atualizar todas as env vars no EasyPanel e no `.env.local`

### 2. Segurança — Itens do relatório (`docs/RELATORIO_SEGURANCA_MP.md`)

- [ ] **#2: Validar assinatura do webhook** — Implementar verificação
  HMAC-SHA256 do header `x-signature` em `api/src/routes/webhook.ts`.
  Adicionar `MP_WEBHOOK_SECRET` como env var no EasyPanel.
- [ ] **#4: Compensação de falha mais robusta** — Retry no
  `release_ticket_slot` em caso de falha de rede.
- [ ] **#5: Expiração de preference + cleanup** — Adicionar
  `expiration_date_to` na preference (30min). Criar cronjob para
  expirar pedidos abandonados e liberar vagas.

### 3. Resend (e-mails transacionais)

- [ ] Criar conta Resend
- [ ] Configurar domínio (DNS TXT verification)
- [ ] Configurar `RESEND_API_KEY` no EasyPanel
- [ ] Configurar `RESEND_FROM_EMAIL` e `RESEND_FROM_NAME`
- [ ] Testar envio de e-mail de confirmação (pagar com usuário teste do MP)

### 4. Troca de domínio (se/quando mudar de royalhubacademy.com)

- [ ] Atualizar `notification_url` no painel do Mercado Pago
- [ ] Atualizar DNS (A/CNAME para API e frontend)
- [ ] Atualizar domínio no EasyPanel
- [ ] Rebuild frontend com novo `NEXT_PUBLIC_APP_URL`
- [ ] Atualizar `CORS_ALLOWED_ORIGINS` no EasyPanel
- [ ] Atualizar `APP_URL` no EasyPanel

---

## Pós-MVP (melhorias)

### 5. WebSocket Realtime (admin)

O container Supabase Realtime está rodando mas a conexão WebSocket
falha no admin. Os KPIs do dashboard não atualizam em tempo real
(requerem refresh manual). Não bloqueia o sistema.

- [ ] Investigar JWT_SECRET sincronizado entre serviços
- [ ] Verificar proxy WebSocket no Kong/Nginx
- [ ] Testar com Supabase Studio se Realtime funciona lá

### 6. Refatorar repositórios legado

`src/repositories/*` ainda são usados pelo admin (`@supabase/ssr` direto).
Funciona mas cria duas formas de acessar os mesmos dados.

- [ ] Avaliar se vale migrar admin para API (mais endpoints CRUD)
- [ ] Ou manter e documentar a separação

### 7. Remover anon key do frontend público

Após a migração do checkout (Task 2), avaliar se o frontend público
ainda usa `createBrowserClient` em algum lugar.

- [ ] Grep por `createClient` fora de `/admin` e `/providers`
- [ ] Se não houver uso público, remover `NEXT_PUBLIC_SUPABASE_ANON_KEY`
  do `.env.production` e do bundle
- [ ] Manter apenas para admin auth (`AuthProvider`, `useAdminAuth`)

### 8. Cache inteligente nos endpoints

Os endpoints públicos usam `Cache-Control: 30s` (temporário para testes).

- [ ] Subir para 5min quando estável
- [ ] Avaliar CDN (Cloudflare) na frente da API
- [ ] Cache-bust via query param quando admin salva no painel

---

## Referências

- Relatório de segurança: `docs/RELATORIO_SEGURANCA_MP.md`
- Migração Edge Functions → API: `docs/MIGRACAO_API.md`
- Migração Frontend → API: `docs/MIGRACAO_FRONTEND_API.md`
- API README: `api/README.md`
