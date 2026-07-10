-- Adiciona campo "label" aos lotes de ingresso.
-- Exibido acima do card na home (ex: "Dia 17", "Dias 18 e 19").
ALTER TABLE ticket_lots_encontro
  ADD COLUMN IF NOT EXISTS label TEXT;
