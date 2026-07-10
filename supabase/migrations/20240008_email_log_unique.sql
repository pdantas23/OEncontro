-- ============================================================
-- Migration: 008 — UNIQUE parcial em email_logs_encontro
-- Impede envio duplicado de e-mail para o mesmo pedido+template.
-- Apenas logs com status='sent' são considerados — retries e
-- falhas não bloqueiam reenvio.
-- ============================================================

CREATE UNIQUE INDEX IF NOT EXISTS idx_email_logs_unique_sent
  ON public.email_logs_encontro (order_id, template)
  WHERE status = 'sent';
