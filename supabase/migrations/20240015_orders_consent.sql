-- 20240015_orders_consent.sql
-- Adiciona colunas de aceite de termos (direito de imagem + regras de compra)
-- ao pedido. Pedidos anteriores a esta migration ficam com booleans = false
-- e *_version / *_at NULL, intencionalmente (não passaram pela tela de aceite).
--
-- ROLLBACK:
--   ALTER TABLE orders_encontro
--     DROP COLUMN accept_image_rights,
--     DROP COLUMN accept_image_rights_version,
--     DROP COLUMN accept_image_rights_at,
--     DROP COLUMN accept_purchase_terms,
--     DROP COLUMN accept_purchase_terms_version,
--     DROP COLUMN accept_purchase_terms_at;

ALTER TABLE orders_encontro
  ADD COLUMN IF NOT EXISTS accept_image_rights BOOLEAN NOT NULL DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS accept_image_rights_version TEXT,
  ADD COLUMN IF NOT EXISTS accept_image_rights_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS accept_purchase_terms BOOLEAN NOT NULL DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS accept_purchase_terms_version TEXT,
  ADD COLUMN IF NOT EXISTS accept_purchase_terms_at TIMESTAMPTZ;
