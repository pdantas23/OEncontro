# Auditoria de Código — 2026-05-20

Investigação read-only. Nenhuma correção aplicada exceto o fix do login
(commit `2cefef4`).

---

## 2.1 Outros usos de router.push/replace em static export

| Arquivo | Linha | Contexto | Risco | Sugestão |
|---------|-------|----------|-------|----------|
| `src/components/checkout/steps/Step4Card.tsx` | 59 | `router.push('/obrigado?order_id=...')` após cartão aprovado | **Baixo** — Step4Card é código morto (não importado pelo CheckoutWizard) | Remover arquivo |
| `src/hooks/useAdminAuth.ts` | 25, 36 | `router.replace('/login')` se não autenticado | **Alto** — mesmo problema do login, pode travar ao redirecionar para /login | Trocar por `window.location.href` |
| `src/app/admin/login/page.tsx` | 9 | `router.replace('/login')` redirect legado | **Alto** | Trocar por `window.location.href` |
| `src/app/obrigado/page.tsx` | 19, 33 | `router.replace('/')` se order não encontrado | **Alto** | Trocar por `window.location.href` |
| `src/app/checkout/page.tsx` | 22, 26, 38, 47 | `router.replace(...)` para redirects de erro | **Alto** | Trocar por `window.location.href` |

**Total: 9 usos de router.push/replace restantes, todos com risco alto de travar em static export no Hostinger.**

---

## 2.2 Console.log temporários

### API (`api/src/`)

| Arquivo | Linha | Conteúdo | Tipo |
|---------|-------|----------|------|
| `api/src/index.ts` | 69 | `[api] Iniciando na porta ${port}` | **Proposital** — startup log |
| `api/src/routes/create-preference.ts` | 65-67 | Payload completo, APP_URL, appUrl | **TEMPORÁRIO** — marcado com `// TODO: remover` |
| `api/src/lib/resend.ts` | 44 | `[resend] E-mail enviado para` | **Proposital** — log de operação |

### Frontend (`src/`)

Nenhum `console.log` encontrado no frontend.

**Candidato a remoção:** `api/src/routes/create-preference.ts:65-67` (3 linhas de debug temporário).

---

## 2.3 Código morto

### Nunca importado (remoção segura)

| Arquivo | Motivo |
|---------|--------|
| `src/repositories/AdminUserRepository.ts` | Zero imports em todo o projeto |
| `src/repositories/TrackingEventRepository.ts` | Zero imports em todo o projeto |
| `src/services/AdminAuthService.ts` | Zero imports — login usa `actions.ts` direto |
| `src/components/checkout/steps/Step4Card.tsx` | Não importado pelo CheckoutWizard (wizard tem 3 steps, não 4) |

### Parcialmente morto (só tipos usados, funções nunca chamadas)

| Arquivo | Situação |
|---------|----------|
| `src/repositories/DashboardRepository.ts` | Só tipos importados (KpiData, SalesChartPoint); funções getKpis/getSalesChart nunca chamadas |
| `src/repositories/EmailLogRepository.ts` | Importado só pelo EmailService (que por sua vez é importado só em testes) |
| `src/services/email-triggers.ts` | Importado só pelo CheckoutService (que não é chamado por nenhum app code — foi substituído pela API) |
| `src/services/CheckoutService.ts` | Não chamado por nenhum app code (substituído pelo `POST /create-order` na API) |
| `src/services/TicketLotService.ts` | Não chamado por nenhum app code (RPCs agora chamadas pela API) |
| `src/services/EmailService.ts` | Não chamado por nenhum app code (e-mail agora enviado pela API) |
| `src/lib/paymentAdapter.ts` | Importado só pelo CheckoutService morto |
| `src/adapters/MockPaymentAdapter.ts` | Importado só pelo paymentAdapter morto |
| `src/adapters/PaymentAdapter.ts` | Importado só pelo paymentAdapter e MockPaymentAdapter |

### Env vars definidas em env.ts mas nunca lidas via `env.X`

| Variável | Definida em | Lida em |
|----------|------------|---------|
| `PAYMENT_PROVIDER` | env.ts:30 | Nenhum lugar |
| `PAYMENT_SECRET_KEY` | env.ts:31 | Nenhum lugar |
| `PAYMENT_WEBHOOK_SECRET` | env.ts:32 | Nenhum lugar |
| `NEXT_PUBLIC_PAYMENT_PUBLIC_KEY` | env.ts:33 | Nenhum lugar |
| `SUPABASE_SERVICE_ROLE_KEY` | env.ts:24 | Nenhum lugar no frontend (usado só na API) |
| `RESEND_API_KEY` | env.ts:35 | Só em EmailService (morto) |
| `RESEND_FROM_EMAIL` | env.ts:36 | Só em EmailService (morto) |
| `RESEND_FROM_NAME` | env.ts:37 | Só em EmailService (morto) |

---

## 2.4 Inconsistências de configuração

### env.ts vs uso real

O `env.ts` valida 16 variáveis mas apenas 6 são usadas pelo frontend em produção:
- `NEXT_PUBLIC_SUPABASE_URL` — Supabase client (admin auth)
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` — Supabase client (admin auth)
- `NEXT_PUBLIC_API_URL` — API Hono (checkout + dados públicos)
- `NEXT_PUBLIC_APP_URL` — SEO, sitemap, robots
- `NODE_ENV` — conditional rendering
- `NEXT_PUBLIC_GTM_ID/META_PIXEL_ID/GOOGLE_ADS_ID` — tracking (opcionalNais)

As outras 8 são resíduos da arquitetura anterior (pagamento via Supabase, Resend no frontend).

### .env.production vs env.ts

O `.env.production` não está no Git (ignorado). Mas o env.ts exige `NEXT_PUBLIC_API_URL` como obrigatório — se ausente no build, crasha. O `.env.local` pode sobrescrever `.env.production` (hierarquia Next.js) — o build de produção requer renomear `.env.local` antes.

---

## 2.5 Bugs potenciais

| # | Arquivo | Linha | Descrição | Severidade |
|---|---------|-------|-----------|------------|
| 1 | `src/hooks/useAdminAuth.ts` | 25, 36 | `router.replace('/login')` pode travar em static export (mesmo bug do login) | **Crítico** |
| 2 | `src/app/checkout/page.tsx` | 22-47 | `router.replace(...)` em 4 lugares — mesmo risco | **Crítico** |
| 3 | `src/app/obrigado/page.tsx` | 19, 33 | `router.replace('/')` — mesmo risco | **Alto** |
| 4 | `src/config/env.ts` | 87 | `throw new Error(...)` no módulo — se qualquer env var obrigatória estiver ausente, **crasha toda a app** em runtime (qualquer chunk que importe env.ts) | **Alto** |
| 5 | `src/providers/AuthProvider.tsx` | 64-68 | Query `profiles_encontro` no callback de `onAuthStateChange` — se Supabase estiver lento, pode segurar o re-render | **Médio** |
| 6 | `src/services/api/client.ts` | 14 | `throw new Error('NEXT_PUBLIC_API_URL não configurada')` — crasha o componente que chama apiFetch se a env var estiver ausente | **Médio** |

---

## 2.6 Riscos arquiteturais

### create-order + create-preference em duas chamadas sequenciais

`actions.ts` faz `POST /create-order` → `POST /create-preference` em sequência. Se o browser cair entre as duas (usuário fecha aba, rede cai), o pedido fica criado com vaga reservada mas sem preference/redirect. O pedido fica `pending` indefinidamente, prendendo a vaga.

**Mitigação:** Item #5 do ROADMAP (expiração de pedidos + cleanup). Alternativa: unificar em um único endpoint `POST /checkout` que faz tudo atômico.

### Anon key embutida no bundle

`NEXT_PUBLIC_SUPABASE_ANON_KEY` está no bundle público do frontend. É usada pelo admin auth (AuthProvider, useAdminAuth, login actions). A anon key respeita RLS, então o risco direto é baixo. Mas expõe o endpoint Supabase para quem inspecionar o JS.

Após a migração do checkout para a API, o frontend público **não usa mais a anon key** — apenas o admin. Avaliar se vale separar o admin em bundle distinto ou mover auth para a API.

### Webhook signature não validada

Item #2 do `RELATORIO_SEGURANCA_MP.md` — o webhook aceita qualquer POST. A mitigação parcial (consulta o MP para confirmar status) existe, mas um atacante com paymentId de outra transação poderia forjar aprovação.

---

## 2.7 O que fazer ao acordar (priorizado)

### Alto impacto, baixo esforço

1. **Trocar todos os `router.push/replace` por `window.location.href`** — 9 usos restantes em checkout, obrigado, admin auth. Mesma correção do login. ~30min.

2. **Remover console.log temporários** da create-preference (3 linhas). ~5min.

3. **Cadastrar `APP_URL` no EasyPanel** — sem isso, a API usa fallback hardcoded. ~2min.

### Alto impacto, médio esforço

4. **Limpar env.ts** — remover as 8 variáveis que não são mais usadas pelo frontend (PAYMENT_*, RESEND_*, SUPABASE_SERVICE_ROLE_KEY). Reduz superfície de ataque e simplifica o build. ~20min.

5. **Unificar create-order + create-preference** em um endpoint único `POST /checkout` na API. Elimina o race condition entre as duas chamadas. ~1h.

### Crítico mas custoso

6. **Validar assinatura do webhook** — implementar HMAC-SHA256 do header x-signature. Item #2 do relatório de segurança. Bloqueia go-live. ~2h.

7. **Rotacionar credenciais** — MP_ACCESS_TOKEN, SUPABASE keys. Obrigatório antes de produção real. ~30min manual.

### Pode esperar

8. **Remover código morto** — Step4Card, AdminAuthService, repositórios não usados. Cosmético, não bloqueia nada.

9. **Expiração de preferences** — Item #5 do ROADMAP. Importante mas pode esperar até ter tráfego real.

10. **Migrar admin auth para API** — remove anon key do bundle. Melhoria de segurança mas o risco atual é baixo (RLS protege).

---

## FECHAMENTO 2026-05-20 MANHÃ

### Commits aplicados

| Hash | Descrição |
|------|-----------|
| `140afc6` | fix(checkout): substitui router.replace por window.location |
| `005f560` | fix(obrigado): substitui router.replace por window.location |
| `ea608f6` | fix(admin): substitui router.replace por window.location |

### Status dos 9 router.push/replace (seção 2.1)

| Arquivo | Linha(s) | Status |
|---------|----------|--------|
| `src/app/checkout/page.tsx` | 22, 26, 38, 47 | **Corrigido** → `window.location.replace` |
| `src/app/obrigado/page.tsx` | 19, 33 | **Corrigido** → `window.location.replace` |
| `src/hooks/useAdminAuth.ts` | 25, 36 | **Corrigido** → `window.location.replace` |
| `src/app/admin/login/page.tsx` | 9 | **Corrigido** → `window.location.replace` |
| `src/components/checkout/steps/Step4Card.tsx` | 59 | **Corrigido** (código morto, mas consistência) |

Grep `router.push` e `router.replace` no projeto: **zero hits restantes.**

### npm run dev

**Funciona sem erros.** Next.js 16.2.6 (Turbopack), porta 3000, carrega `.env.local`, ready em 342ms. Nenhuma correção de código necessária — o problema reportado era transitório.

### O que falta no Bloco 1

Apenas deploy manual:
1. Build do frontend estático
2. Upload do `out/` para Hostinger
3. Teste end-to-end do checkout com MP sandbox

### Instruções para Philip fechar o Bloco 1

```bash
# 1. Puxar os commits mais recentes
cd "/Users/philip/Desktop/RoyalHub/Landing Pages/Encontro"
git pull origin main

# 2. Build de produção (renomear .env.local pra não sobrescrever)
mv .env.local .env.local.bak
npm run build
mv .env.local.bak .env.local

# 3. O output está em out/ — subir para Hostinger
#    (substituir todo o conteúdo de public_html/encontro/)

# 4. Verificar:
#    - https://royalhubacademy.com/encontro → home carrega
#    - Lotes aparecem (via API, não estáticos)
#    - Login admin funciona (botão não trava mais)
#    - Checkout: clicar "Garantir minha participação" → redireciona pro MP

# 5. Teste end-to-end do checkout:
#    - No admin, ajustar preço de um lote para R$ 1,00 (teste)
#    - Na home, clicar no lote → checkout → "Pagar com Mercado Pago"
#    - No MP sandbox, pagar com usuário de teste
#    - Verificar: /obrigado mostra "Pagamento confirmado"
#    - Verificar: pedido aparece no admin com status "paid"
```
