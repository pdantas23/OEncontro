-- Migration: funções RPC para reserva atômica de vagas (T059)
-- reserve_ticket_slot: check + increment em uma única transação (FOR UPDATE lock)
-- release_ticket_slot: compensação quando pagamento falha ou expira
-- Tabela: ticket_lots_encontro

CREATE OR REPLACE FUNCTION reserve_ticket_slot(p_lot_id uuid, p_quantity int DEFAULT 1)
RETURNS boolean AS $$
DECLARE
  v_available int;
BEGIN
  SELECT (total_limit - sold_count) INTO v_available
  FROM ticket_lots_encontro
  WHERE id = p_lot_id AND status = 'active'
  FOR UPDATE; -- lock da linha para evitar race condition

  IF v_available IS NULL OR v_available < p_quantity THEN
    RETURN false;
  END IF;

  UPDATE ticket_lots_encontro
  SET sold_count = sold_count + p_quantity
  WHERE id = p_lot_id;

  RETURN true;
END;
$$ LANGUAGE plpgsql;

-- Compensação: decrementa sold_count quando pagamento falha ou expira
CREATE OR REPLACE FUNCTION release_ticket_slot(p_lot_id uuid, p_quantity int DEFAULT 1)
RETURNS void AS $$
BEGIN
  UPDATE ticket_lots_encontro
  SET sold_count = GREATEST(sold_count - p_quantity, 0)
  WHERE id = p_lot_id;
END;
$$ LANGUAGE plpgsql;

-- Incrementa sold_count diretamente (chamado pelo TicketLotRepository)
CREATE OR REPLACE FUNCTION increment_ticket_sold_count(lot_id uuid, qty int DEFAULT 1)
RETURNS boolean AS $$
DECLARE
  v_available int;
BEGIN
  SELECT (total_limit - sold_count) INTO v_available
  FROM ticket_lots_encontro
  WHERE id = lot_id AND status = 'active'
  FOR UPDATE;

  IF v_available IS NULL OR v_available < qty THEN
    RETURN false;
  END IF;

  UPDATE ticket_lots_encontro
  SET sold_count = sold_count + qty
  WHERE id = lot_id;

  RETURN true;
END;
$$ LANGUAGE plpgsql;
