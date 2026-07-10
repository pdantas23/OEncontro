-- Adiciona coluna item_type ao schedule para diferenciar palestra, almoço, etc.
ALTER TABLE schedule_encontro
  ADD COLUMN item_type text NOT NULL DEFAULT 'palestra';
