# Migração: Edge Functions → API HTTP (Hono)

**Data:** 2026-05-19

## O que mudou

| Antes | Depois |
|-------|--------|
| Supabase Edge Functions (`supabase/functions/mp-*`) | API HTTP Node.js/Hono (`api/src/routes/*`) |
| Runtime Deno (Edge Runtime do Supabase self-hosted) | Node.js 20 (container Docker no EasyPanel) |
| Deploy via volume mount no servidor | Deploy via GitHub → EasyPanel (Dockerfile) |
| Secrets via `environment:` no docker-compose | Secrets via painel Ambiente do EasyPanel |
| `Deno.env.get()` | `process.env` |
| `notification_url` usava `SUPABASE_PUBLIC_URL` | `notification_url` usa `PUBLIC_API_URL` |
| Frontend chamava `/functions/v1/mp-create-preference` | Frontend chama `${NEXT_PUBLIC_API_URL}/create-preference` |

## O que NÃO mudou

- Lógica de negócio (validação, criação de preference, webhook, compensação)
- Polling da `/obrigado` via RPC `get_order_status` no Supabase
- Migrations SQL (20240005 mp_preference_id, 20240006 RPC RLS)
- Reserva atômica de vagas via `reserve_ticket_slot` RPC
- E-mail best-effort via Resend (comportamento idêntico)
- Template HTML do e-mail de confirmação

## Limpeza pendente

- As Edge Functions antigas em `supabase/functions/mp-create-preference/` e
  `supabase/functions/mp-webhook/` podem ser **removidas** após validação
  em produção com a nova API
- O arquivo `supabase/functions/_shared/cors.ts` também pode ser removido
- Os logs de erro do Edge Runtime no Supabase (referentes a functions
  ausentes) serão limpos quando as referências do template forem removidas
  — não bloqueia nada

## Referências

- Código da API: `/api/src/`
- README da API (endpoints, env vars, deploy): `/api/README.md`
- Relatório de segurança: `/docs/RELATORIO_SEGURANCA_MP.md`
