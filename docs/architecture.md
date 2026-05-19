# Arquitetura — Plataforma de Ingressos para Eventos de Cerimonialistas

> Gerado em: M1 Setup & Infraestrutura
> Regenerar com `npm run graph` após mudanças estruturais.

## Mapa de dependências

```
src/
├── app/                     ← Rotas e páginas (Next.js App Router)
│   ├── (marketing)/page.tsx ← Landing page pública
│   ├── checkout/page.tsx    ← Checkout em 6 etapas
│   ├── obrigado/page.tsx    ← Pós-compra (Pix / Cartão)
│   └── admin/**             ← Painel administrativo (protegido)
│
├── config/
│   ├── theme.ts             ← FONTE ÚNICA DE VERDADE VISUAL
│   ├── env.ts               ← Variáveis de ambiente validadas (Zod)
│   └── site.ts              ← Metadados do site
│
├── adapters/
│   ├── PaymentAdapter.ts    ← Interface IPaymentAdapter
│   └── MockPaymentAdapter   ← Implementação dev/test
│
├── services/                ← Regras de negócio (sem UI)
│   ├── AdminAuthService     ← depende de: SupabaseAdapter
│   ├── OrderService         ← depende de: OrderRepository, PaymentService
│   ├── PaymentService       ← depende de: IPaymentAdapter
│   ├── TicketLotService     ← depende de: TicketLotRepository
│   └── EmailService         ← depende de: Resend client, email_logs
│
├── repositories/            ← Acesso a dados (apenas Supabase)
│   ├── AdminUserRepository  ← tabela: admin_users
│   ├── OrderRepository      ← tabela: orders
│   ├── TicketLotRepository  ← tabela: ticket_lots
│   ├── OrderBumpRepository  ← tabela: order_bumps
│   ├── SpeakerRepository    ← tabela: speakers
│   ├── ScheduleRepository   ← tabela: schedule
│   └── EventConfigRepository← tabela: event_config
│
├── lib/
│   ├── supabase/
│   │   ├── client.ts        ← Browser client (Client Components)
│   │   ├── server.ts        ← Server client (Server Components/Actions)
│   │   └── middleware.ts    ← Session update helper
│   └── email/
│       ├── client.ts        ← Resend instance
│       └── templates/       ← React Email components
│
├── types/
│   ├── database.ts          ← Gerado pelo Supabase CLI (stub inicial)
│   ├── auth.ts
│   ├── checkout.ts
│   ├── order.ts
│   └── api.ts
│
└── utils/
    ├── cn.ts                ← classnames helper
    ├── format.ts
    ├── dates.ts
    └── errors.ts
```

## Fluxo de dados (checkout)

```
page.tsx (UI)
  └── Server Action
        └── OrderService
              ├── TicketLotRepository → Supabase
              └── PaymentService
                    └── IPaymentAdapter (Mock / Real)
```

## Dependência circular detectada

Nenhuma. Executar `npm run graph` para verificar.

## Regras de uso

- Consultar este mapa antes de qualquer alteração.
- Identificar o subgrafo afetado — não reler o projeto inteiro.
- Atualizar este arquivo quando a estrutura de dependências mudar.
