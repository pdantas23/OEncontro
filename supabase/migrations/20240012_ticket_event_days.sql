-- ============================================================
-- Migration: 20240012_ticket_event_days
-- Adiciona coluna event_days int[] em ticket_lots_encontro para
-- representar de forma estruturada os dias do evento que cada lote
-- cobre. Habilita filtragem de order bumps por overlap de dias
-- (operador && do Postgres em int[]).
--
-- Backfill dos 3 lotes existentes pelo UUID real, conferidos em
-- consulta direta ao DB (não por name — protege contra renomeação).
--
-- ROLLBACK:
--   DROP INDEX IF EXISTS idx_ticket_lots_encontro_event_days;
--   ALTER TABLE public.ticket_lots_encontro DROP COLUMN IF EXISTS event_days;
-- ============================================================

ALTER TABLE public.ticket_lots_encontro
  ADD COLUMN IF NOT EXISTS event_days int[];

-- Índice GIN para consultas de overlap (a && b)
CREATE INDEX IF NOT EXISTS idx_ticket_lots_encontro_event_days
  ON public.ticket_lots_encontro USING GIN (event_days);

-- Backfill dos lotes existentes (por ID — IDs reais conferidos no DB)
UPDATE public.ticket_lots_encontro SET event_days = ARRAY[17]    WHERE id = 'ea0400ab-cccd-45c2-8bb0-d590662e31d2'; -- Ingresso X
UPDATE public.ticket_lots_encontro SET event_days = ARRAY[18,19] WHERE id = 'c876095c-de33-4988-b482-b3251a89659d'; -- Passaporte VIP (1º Lote)
UPDATE public.ticket_lots_encontro SET event_days = ARRAY[18,19] WHERE id = '76e8f723-189f-4177-bbf7-9f09ade9f33f'; -- Passaporte Start (1º Lote)
