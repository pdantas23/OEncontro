-- ============================================================
-- Migration: 20240013_ticket_lot_bumps
-- Cria a tabela ticket_lot_bumps_encontro que define quais
-- lotes são oferecidos como order bump no checkout de outros,
-- com promoção opcional aplicada apenas naquele contexto.
--
-- Constraints no DB (cinto duplo da validação aplicacional):
--   - principal != oferecido
--   - UNIQUE (principal, oferecido)
--   - discount_type e discount_value coerentes (ambos NULL ou ambos preenchidos)
--   - discount_type ∈ ('percent', 'fixed') quando não-NULL
--   - percent ∈ (0, 100], fixed > 0
--
-- Validações deixadas para a camada aplicacional (decisão 2):
--   - overlap de event_days entre principal e oferecido (depende de outra linha)
--   - discount 'fixed' < price do lote oferecido (cross-table)
--   - re-validar combos quando o preço do lote oferecido for alterado depois
--
-- ON DELETE:
--   - principal_lot_id CASCADE: lote principal é dono natural da regra
--   - offered_lot_id  RESTRICT: força admin a remover combos antes de
--                               deletar o lote oferecido (evita perda silenciosa)
--
-- RLS: leitura pública, escrita só admin (padrão de order_bumps_encontro).
--
-- ROLLBACK:
--   DROP TABLE IF EXISTS public.ticket_lot_bumps_encontro;
-- ============================================================

CREATE TABLE IF NOT EXISTS public.ticket_lot_bumps_encontro (
  id                uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  principal_lot_id  uuid NOT NULL REFERENCES public.ticket_lots_encontro(id) ON DELETE CASCADE,
  offered_lot_id    uuid NOT NULL REFERENCES public.ticket_lots_encontro(id) ON DELETE RESTRICT,
  discount_type     text,                  -- 'percent' | 'fixed' | NULL
  discount_value    numeric(10, 2),        -- coerente com discount_type
  display_order     int  NOT NULL DEFAULT 0,
  active            boolean NOT NULL DEFAULT true,
  created_at        timestamptz NOT NULL DEFAULT now(),
  updated_at        timestamptz NOT NULL DEFAULT now(),

  CONSTRAINT ticket_lot_bumps_distinct_lots
    CHECK (principal_lot_id <> offered_lot_id),

  CONSTRAINT ticket_lot_bumps_unique_pair
    UNIQUE (principal_lot_id, offered_lot_id),

  CONSTRAINT ticket_lot_bumps_discount_coherent
    CHECK (
      (discount_type IS NULL AND discount_value IS NULL)
      OR (discount_type IS NOT NULL AND discount_value IS NOT NULL)
    ),

  CONSTRAINT ticket_lot_bumps_discount_type_valid
    CHECK (
      discount_type IS NULL
      OR discount_type IN ('percent', 'fixed')
    ),

  CONSTRAINT ticket_lot_bumps_discount_value_bounds
    CHECK (
      discount_value IS NULL
      OR (discount_type = 'percent' AND discount_value > 0 AND discount_value <= 100)
      OR (discount_type = 'fixed'   AND discount_value > 0)
    )
);

-- Índices auxiliares (a UNIQUE já indexa principal+oferecido juntos)
CREATE INDEX IF NOT EXISTS idx_ticket_lot_bumps_principal
  ON public.ticket_lot_bumps_encontro (principal_lot_id, active, display_order);

CREATE INDEX IF NOT EXISTS idx_ticket_lot_bumps_offered
  ON public.ticket_lot_bumps_encontro (offered_lot_id);

-- RLS no mesmo padrão de order_bumps_encontro
ALTER TABLE public.ticket_lot_bumps_encontro ENABLE ROW LEVEL SECURITY;

CREATE POLICY "ticket_lot_bumps_encontro_select_public" ON public.ticket_lot_bumps_encontro
  FOR SELECT USING (true);

CREATE POLICY "ticket_lot_bumps_encontro_insert_admin" ON public.ticket_lot_bumps_encontro
  FOR INSERT WITH CHECK (public.is_admin());

CREATE POLICY "ticket_lot_bumps_encontro_update_admin" ON public.ticket_lot_bumps_encontro
  FOR UPDATE USING (public.is_admin());

CREATE POLICY "ticket_lot_bumps_encontro_delete_admin" ON public.ticket_lot_bumps_encontro
  FOR DELETE USING (public.is_admin());
