-- ============================================================
-- Migration: 20240014_orders_has_inventory_issue
-- Adiciona coluna has_inventory_issue em orders_encontro para
-- sinalizar pedidos com inconsistência de estoque detectada no
-- webhook (oversell de ingresso-bump). Não dispara reversão da
-- venda — apenas marca para resolução manual pelo time comercial.
--
-- Índice parcial: a maioria dos pedidos terá false; só queremos
-- buscar rapidamente os true (lista de "atenção" no admin).
--
-- ROLLBACK:
--   DROP INDEX IF EXISTS idx_orders_encontro_has_inventory_issue;
--   ALTER TABLE public.orders_encontro DROP COLUMN IF EXISTS has_inventory_issue;
-- ============================================================

ALTER TABLE public.orders_encontro
  ADD COLUMN IF NOT EXISTS has_inventory_issue boolean NOT NULL DEFAULT false;

CREATE INDEX IF NOT EXISTS idx_orders_encontro_has_inventory_issue
  ON public.orders_encontro (has_inventory_issue)
  WHERE has_inventory_issue = true;
