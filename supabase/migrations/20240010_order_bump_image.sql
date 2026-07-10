-- Adiciona coluna image_url aos order bumps para foto do produto
ALTER TABLE order_bumps_encontro
  ADD COLUMN image_url text;
