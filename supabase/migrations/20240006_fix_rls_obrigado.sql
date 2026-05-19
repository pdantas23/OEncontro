-- ============================================================
-- Migration: 006 — Fix RLS: permitir leitura do pedido na /obrigado
--
-- PROBLEMA:
--   A policy "orders_encontro_select_admin" exige is_admin() para
--   SELECT. A página /obrigado e o polling usam a anon key no
--   client-side, então o comprador não consegue ler o próprio pedido.
--
-- ABORDAGEM ESCOLHIDA: Opção B — RPC com SECURITY DEFINER
--
--   Descartamos a Opção A (policy anon SELECT na tabela) porque
--   exporia a tabela inteira para leitura anônima (mesmo filtrando
--   por id, nada impede um GET sem filtro que retornaria todos os
--   pedidos via PostgREST).
--
--   Descartamos uma View porque, com security_invoker=false, a view
--   também permitiria listagem completa via GET sem filtro, expondo
--   nomes e emails de todos os compradores.
--
--   O RPC SECURITY DEFINER aceita um UUID como parâmetro e retorna
--   APENAS as colunas necessárias para a /obrigado. Não é possível
--   enumerar, listar, ou acessar dados de outros pedidos sem conhecer
--   o UUID (128 bits de entropia). Campos sensíveis como buyer_cpf,
--   buyer_whatsapp, payment_id, pix_code, mp_preference_id ficam
--   protegidos.
-- ============================================================

CREATE OR REPLACE FUNCTION public.get_order_status(p_order_id uuid)
RETURNS TABLE (
  id               uuid,
  payment_status   text,
  payment_method   text,
  buyer_name       text,
  buyer_email      text,
  total            numeric
)
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT
    o.id,
    o.payment_status,
    o.payment_method,
    o.buyer_name,
    o.buyer_email,
    o.total
  FROM public.orders_encontro o
  WHERE o.id = p_order_id
$$;

-- Permitir que a anon key chame esta função
GRANT EXECUTE ON FUNCTION public.get_order_status(uuid) TO anon;
GRANT EXECUTE ON FUNCTION public.get_order_status(uuid) TO authenticated;
