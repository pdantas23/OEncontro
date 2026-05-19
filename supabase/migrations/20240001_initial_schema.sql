-- ============================================================
-- Migration: 001 — Schema inicial do projeto
-- Plataforma de Ingressos para Eventos de Cerimonialistas
-- Convenção: todas as tabelas usam sufixo _encontro
-- ============================================================

-- ------------------------------------------------------------
-- Extensões
-- ------------------------------------------------------------
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ------------------------------------------------------------
-- profiles_encontro
-- Perfis de usuários com acesso ao painel administrativo.
-- uuid é PK e FK para auth.users (mesmo UUID do Supabase Auth).
-- role: 'comercial' | 'marketing'
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.profiles_encontro (
  uuid       uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email      text NOT NULL UNIQUE,
  role       text NOT NULL DEFAULT 'comercial',
  created_at timestamptz NOT NULL DEFAULT now()
);

-- ------------------------------------------------------------
-- event_config_encontro
-- Configurações globais do evento (single-row table)
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.event_config_encontro (
  id                   uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  name                 text,                          -- Task Final TF03
  date                 timestamptz,                   -- Task Final TF04
  location             text,                          -- Task Final TF04
  description          text,
  group_link           text,                          -- Task Final TF04
  whatsapp_support     text,                          -- Task Final TF04
  total_ticket_limit   int,
  low_stock_threshold  int NOT NULL DEFAULT 20,
  sale_status          text NOT NULL DEFAULT 'open',  -- open | closed | soldout
  meta_pixel_id        text,                          -- Task Final TF15
  gtm_id               text,                          -- Task Final TF15
  google_ads_id        text,                          -- Task Final TF15
  updated_at           timestamptz
);

-- Garantir que existe exatamente uma linha de configuração
INSERT INTO public.event_config_encontro (sale_status, low_stock_threshold)
VALUES ('open', 20)
ON CONFLICT DO NOTHING;

-- ------------------------------------------------------------
-- ticket_lots_encontro
-- Lotes de ingresso com preço e limite
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.ticket_lots_encontro (
  id            uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  name          text NOT NULL,
  description   text,
  price         numeric(10, 2) NOT NULL DEFAULT 0,   -- Task Final TF06
  total_limit   int NOT NULL,
  sold_count    int NOT NULL DEFAULT 0,
  status        text NOT NULL DEFAULT 'active',       -- active | inactive | soldout
  benefits      jsonb,
  display_order int NOT NULL DEFAULT 0,
  created_at    timestamptz NOT NULL DEFAULT now(),
  updated_at    timestamptz NOT NULL DEFAULT now()
);

-- ------------------------------------------------------------
-- order_bumps_encontro
-- Itens adicionais no checkout (camisa, almoço, etc.)
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.order_bumps_encontro (
  id            uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  name          text NOT NULL,
  description   text,
  price         numeric(10, 2) NOT NULL DEFAULT 0,   -- Task Final TF07
  stock_limit   int,
  sold_count    int NOT NULL DEFAULT 0,
  has_sizes     boolean NOT NULL DEFAULT false,
  active        boolean NOT NULL DEFAULT true,
  display_order int NOT NULL DEFAULT 0,
  created_at    timestamptz NOT NULL DEFAULT now(),
  updated_at    timestamptz NOT NULL DEFAULT now()
);

-- Seed de order bumps padrão (preços serão definidos na TF07)
INSERT INTO public.order_bumps_encontro (name, description, has_sizes, active, display_order)
VALUES
  ('Camisa do Evento', 'Camisa oficial do evento com estampa exclusiva', true,  true, 1),
  ('Almoço',           'Almoço incluso no dia do evento',                false, true, 2)
ON CONFLICT DO NOTHING;

-- ------------------------------------------------------------
-- speakers_encontro
-- Palestrantes do evento
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.speakers_encontro (
  id            uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  name          text NOT NULL,
  role          text,
  bio           text,
  photo_url     text,
  social_links  jsonb,
  display_order int NOT NULL DEFAULT 0,
  created_at    timestamptz NOT NULL DEFAULT now(),
  updated_at    timestamptz NOT NULL DEFAULT now()
);

-- ------------------------------------------------------------
-- schedule_encontro
-- Programação do evento
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.schedule_encontro (
  id            uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  day           int NOT NULL DEFAULT 1,
  start_time    time NOT NULL,
  end_time      time,
  talk_title    text NOT NULL,
  speaker_id    uuid REFERENCES public.speakers_encontro(id) ON DELETE SET NULL,
  description   text,
  display_order int NOT NULL DEFAULT 0,
  created_at    timestamptz NOT NULL DEFAULT now(),
  updated_at    timestamptz NOT NULL DEFAULT now()
);

-- ------------------------------------------------------------
-- orders_encontro
-- Pedidos de compra de ingressos
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.orders_encontro (
  id               uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  buyer_name       text NOT NULL,
  buyer_email      text NOT NULL,
  buyer_whatsapp   text NOT NULL,
  buyer_cpf        text,
  ticket_lot_id    uuid NOT NULL REFERENCES public.ticket_lots_encontro(id),
  ticket_quantity  int NOT NULL DEFAULT 1,
  order_bumps      jsonb,    -- [{id, name, quantity, size, price}]
  subtotal         numeric(10, 2) NOT NULL,
  total            numeric(10, 2) NOT NULL,
  payment_method   text NOT NULL,           -- pix | credit_card
  payment_status   text NOT NULL DEFAULT 'pending',
                                             -- pending | paid | canceled | expired | refunded
  payment_id       text,                    -- ID da API de pagamento
  pix_code         text,
  pix_qrcode_url   text,
  pix_expires_at   timestamptz,
  created_at       timestamptz NOT NULL DEFAULT now(),
  updated_at       timestamptz NOT NULL DEFAULT now()
);

-- Índices para queries frequentes
CREATE INDEX IF NOT EXISTS idx_orders_encontro_buyer_email    ON public.orders_encontro(buyer_email);
CREATE INDEX IF NOT EXISTS idx_orders_encontro_payment_status ON public.orders_encontro(payment_status);
CREATE INDEX IF NOT EXISTS idx_orders_encontro_ticket_lot_id  ON public.orders_encontro(ticket_lot_id);
CREATE INDEX IF NOT EXISTS idx_orders_encontro_pix_expires_at ON public.orders_encontro(pix_expires_at)
  WHERE payment_status = 'pending' AND pix_expires_at IS NOT NULL;

-- ------------------------------------------------------------
-- email_logs_encontro
-- Log de envios de e-mail transacional
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.email_logs_encontro (
  id               uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  order_id         uuid NOT NULL REFERENCES public.orders_encontro(id) ON DELETE CASCADE,
  template         text NOT NULL,
  recipient        text NOT NULL,
  status           text NOT NULL DEFAULT 'pending', -- sent | failed | retrying
  attempts         int NOT NULL DEFAULT 0,
  last_attempt_at  timestamptz,
  created_at       timestamptz NOT NULL DEFAULT now()
);

-- ------------------------------------------------------------
-- tracking_events_encontro
-- Log de eventos de rastreamento (analytics)
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.tracking_events_encontro (
  id          uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  event_name  text NOT NULL,
  order_id    uuid REFERENCES public.orders_encontro(id) ON DELETE SET NULL,
  session_id  text,
  metadata    jsonb,
  created_at  timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_tracking_events_encontro_name       ON public.tracking_events_encontro(event_name);
CREATE INDEX IF NOT EXISTS idx_tracking_events_encontro_created_at ON public.tracking_events_encontro(created_at);
