-- ============================================================
-- Migration: 005 — Mercado Pago Checkout Pro
-- Adiciona mp_preference_id à tabela orders_encontro
-- ============================================================

ALTER TABLE public.orders_encontro
  ADD COLUMN IF NOT EXISTS mp_preference_id text;

CREATE INDEX IF NOT EXISTS idx_orders_encontro_mp_preference_id
  ON public.orders_encontro(mp_preference_id)
  WHERE mp_preference_id IS NOT NULL;
