# Migração Frontend → API Hono (dados em runtime)

**Data:** 2026-05-19 (tarefa noturna autônoma)

## Resumo executivo

### O que foi feito
- Criados 6 endpoints públicos na API Hono: `/lots`, `/lots/:id`, `/order-bumps`, `/speakers`, `/schedule`, `/event-config`
- Home page migrada de Server Component async (dados em build time) para Client Components com hooks (dados em runtime via API)
- Checkout migrado de Supabase direto para API Hono (`/lots/:id`, `/order-bumps`)
- Criado sistema de hooks (`useLots`, `useSpeakers`, `useSchedule`, `useEventConfig`, `useOrderBumps`) com wrapper `apiFetch`
- CORS configurado para todos os endpoints públicos
- Cache-Control de 5 minutos nos endpoints públicos

### O que NÃO foi feito (noturna) — resolvido depois
- ~~Checkout `actions.ts` continua usando Supabase anon key~~ → **MIGRADO** em 2026-05-20 (Task 2)
- Admin continua usando Supabase direto via `@supabase/ssr` (intencional — não precisa migrar)
- Repositórios legado (`src/repositories/*`) mantidos — usados pelo admin
- Não foi criado endpoint `/merchandise` (tabela não existe no schema)

### Risco de regressão
- **Home page (baixo):** Dados vêm da API em runtime. Se a API cair, seções mostram loading/skeleton. Não quebra o site — apenas não mostra dados dinâmicos.
- **Checkout (baixo):** Busca de lote e bumps via API. Se falhar, redireciona para home. Fluxo de pagamento (actions.ts) não foi alterado.
- **Admin (nenhum):** Não tocado.
- **Pagamento (nenhum):** Endpoints `/create-preference` e `/mp-webhook` não foram alterados.

## Decisões tomadas autonomamente

1. **Não usar React Query/SWR:** hooks customizados com `useState`/`useEffect` são suficientes para este caso. Adicionar React Query traria uma dependência de ~12KB que não se justifica com 6 endpoints simples sem invalidação de cache complexa.

2. **Manter home page como Server Component com Client Components filhos:** Em vez de converter toda a home para `'use client'`, extraí as seções dinâmicas (HeroDynamic, ProgramacaoSection, PalestrantesSection, IngressosSection) como Client Components. O layout/SEO estático permanece no Server Component. Isso preserva metadata estática e é mais eficiente.

3. **Cast `as unknown as ScheduleItemWithSpeaker[]` no DynamicSections:** O tipo `ScheduleItemWithSpeaker` usa `Json` do Supabase para `social_links`, mas os hooks retornam `Record<string, unknown>`. Cast é necessário para compatibilidade com `ProgramacaoTabs` — mesmo padrão já usado pelo admin em `src/app/admin/programacao/page.tsx:25`.

4. **Checkout busca dados via API mas mantém actions.ts com Supabase direto:** O `actions.ts` faz INSERT no `orders_encontro` e chama RPCs (`reserve_ticket_slot`, `release_ticket_slot`) via Supabase client-side. Migrar essas operações de escrita para a API seria uma mudança grande (novos endpoints, validação, compensação) — deixado para próxima fase.

## Mudanças aplicadas

### Arquivos novos
- `api/src/routes/public.ts` — 6 endpoints GET públicos
- `src/services/api/client.ts` — wrapper `apiFetch` para fetch tipado
- `src/services/api/hooks.ts` — hooks React para cada endpoint
- `src/components/home/DynamicSections.tsx` — seções dinâmicas da home (HeroDynamic, ProgramacaoSection, PalestrantesSection, IngressosSection)

### Arquivos modificados
- `api/src/index.ts` — registra rotas públicas + CORS para novos paths
- `src/app/(home)/page.tsx` — migra de async Server Component para layout estático + Client Components dinâmicos
- `src/app/checkout/page.tsx` — troca Supabase client por `apiFetch`

## Estado do build
- Build do frontend: **OK** (com .env.production, sem .env.local)
- Build da API: **OK**
- `npm run dev`: **funciona** (porta 3000, Turbopack, sem erros)

## Endpoints novos na API

| Método | Path | Descrição | Auth | Cache |
|--------|------|-----------|------|-------|
| GET | `/lots` | Lotes ativos | Público | 5min |
| GET | `/lots/:id` | Detalhes de um lote | Público | 5min |
| GET | `/order-bumps` | Order bumps ativos | Público | 5min |
| GET | `/speakers` | Palestrantes | Público | 5min |
| GET | `/schedule` | Programação com speaker | Público | 5min |
| GET | `/event-config` | Config do evento | Público | 5min |

Todos retornam `{ data: T }` ou `{ data: null/[], error: string }`.

## O que o Philip precisa fazer ao acordar

### Sequência de deploy
1. **Push já foi feito para main** — EasyPanel rebuilda a API automaticamente
2. **Verificar que a API tem os endpoints novos:** `curl https://api.royalhubacademy.com/lots`
3. **NÃO precisa de novas env vars** — endpoints públicos usam o Supabase service role que já está configurado
4. **Build do frontend:** `mv .env.local .env.local.bak && npm run build && mv .env.local.bak .env.local`
5. **Deploy do `out/`** para Hostinger (substituir arquivos existentes)
6. **Testar no site:** abrir royalhubacademy.com/encontro e verificar se lotes/palestrantes/programação carregam

### Testes sugeridos
```bash
# API endpoints
curl https://api.royalhubacademy.com/health
curl https://api.royalhubacademy.com/lots
curl https://api.royalhubacademy.com/speakers
curl https://api.royalhubacademy.com/schedule
curl https://api.royalhubacademy.com/event-config
curl https://api.royalhubacademy.com/order-bumps

# CORS
curl -I -X OPTIONS https://api.royalhubacademy.com/lots \
  -H "Origin: https://royalhubacademy.com"
```

## Itens não resolvidos

1. ~~`checkout/actions.ts` ainda usa Supabase direto~~ → **RESOLVIDO** em 2026-05-20
2. **Repositórios legado em `src/repositories/`** — usados pelo admin. Podem ser mantidos indefinidamente ou migrados quando o admin for refatorado.
3. ~~`NEXT_PUBLIC_MP_SANDBOX`~~ → **REMOVIDA** em 2026-05-20

## Riscos identificados

1. **API cai → home mostra skeletons:** Se `api.royalhubacademy.com` ficar indisponível, as seções dinâmicas (lotes, speakers, programação) mostram loading/skeleton. O restante da home (hero, sobre, FAQ) continua renderizando normalmente.
2. **CORS mal configurado:** Se `CORS_ALLOWED_ORIGINS` não incluir o domínio correto do frontend, as chamadas falham silenciosamente. Verificar com `curl -X OPTIONS`.
3. **Cache de 30s nos endpoints** (reduzido de 5min em 2026-05-20). Subir para 5min quando estável.

### Como reverter
```bash
git revert <hash-do-commit-api>
git revert <hash-do-commit-frontend>
```
Cada commit é independente e revertível.

---

## Tasks completadas em 2026-05-20

1. **Cache reduzido para 30s** (`ffb4299`) — endpoints públicos usavam 5min,
   agora 30s para facilitar testes. Subir para 5min quando estável.

2. **`actions.ts` migrado para API** (`11317e7`) — Novo endpoint
   `POST /create-order` na API faz reserve + insert server-side com
   service role. Frontend não faz mais INSERT nem RPC direto no banco.
   Compensação automática se falhar.

3. **`NEXT_PUBLIC_MP_SANDBOX` removido** (`010f7a2`) — Variável residual
   no env.ts que não era usada por nenhum código. O sandbox do MP é
   controlado pela env `MP_SANDBOX` na API. Remover também de `.env.local`
   manualmente.

4. **Copy atualizado** (`8edf9b6`) — FAQ: duas perguntas (Pix? Cartão?)
   unificadas em "Quais formas de pagamento?" mencionando Mercado Pago.

5. **Roadmap criado** (`3cb2747`) — `docs/ROADMAP.md` com itens
   pré-produção e pós-MVP. Ver arquivo para lista completa.
