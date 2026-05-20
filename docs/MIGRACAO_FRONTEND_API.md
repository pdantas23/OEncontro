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

### O que NÃO foi feito
- Admin continua usando Supabase direto via `@supabase/ssr` (intencional — não precisa migrar)
- Checkout `actions.ts` continua usando Supabase anon key para INSERT de orders e RPCs (reserve/release) — migrar para API seria significativo e não estava no escopo
- Repositórios legado (`src/repositories/*`) mantidos — usados pelo admin e pelo `actions.ts`
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

1. **`checkout/actions.ts` ainda usa Supabase direto** para INSERT de orders e RPCs — funciona mas depende da anon key no browser. Migrar para API seria mais seguro (service role server-side) mas é mudança significativa.
2. **Repositórios legado em `src/repositories/`** — usados pelo admin. Podem ser mantidos indefinidamente ou migrados quando o admin for refatorado.
3. **`NEXT_PUBLIC_MP_SANDBOX`** — variável residual no env.ts, não usada por nenhum código do frontend.

## Riscos identificados

1. **API cai → home mostra skeletons:** Se `api.royalhubacademy.com` ficar indisponível, as seções dinâmicas (lotes, speakers, programação) mostram loading/skeleton. O restante da home (hero, sobre, FAQ) continua renderizando normalmente.
2. **CORS mal configurado:** Se `CORS_ALLOWED_ORIGINS` não incluir o domínio correto do frontend, as chamadas falham silenciosamente. Verificar com `curl -X OPTIONS`.
3. **Cache de 5min nos endpoints:** Um lote criado no admin pode levar até 5 minutos para aparecer no site. Isso é aceitável para o caso de uso mas pode surpreender durante testes.

### Como reverter
```bash
git revert <hash-do-commit-api>
git revert <hash-do-commit-frontend>
```
Cada commit é independente e revertível.
