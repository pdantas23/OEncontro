-- ============================================================
-- Migration: 002 — Row Level Security (RLS) e Policies
-- Todas as tabelas usam sufixo _encontro
-- Roles: 'comercial' | 'marketing'
-- ============================================================

-- ------------------------------------------------------------
-- Habilitar RLS em todas as tabelas
-- ------------------------------------------------------------
ALTER TABLE public.profiles_encontro       ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.event_config_encontro   ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ticket_lots_encontro    ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_bumps_encontro    ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.speakers_encontro       ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.schedule_encontro       ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders_encontro         ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.email_logs_encontro     ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tracking_events_encontro ENABLE ROW LEVEL SECURITY;

-- ------------------------------------------------------------
-- Função auxiliar: verifica se o usuário autenticado tem acesso ao painel
-- Roles válidas: 'comercial' | 'marketing'
-- ------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.profiles_encontro
    WHERE uuid = auth.uid()
    AND role IN ('comercial', 'marketing')
  )
$$;

-- ------------------------------------------------------------
-- profiles_encontro
-- Apenas usuários do painel podem ler/escrever
-- ------------------------------------------------------------
CREATE POLICY "profiles_encontro_select" ON public.profiles_encontro
  FOR SELECT USING (public.is_admin());

CREATE POLICY "profiles_encontro_insert" ON public.profiles_encontro
  FOR INSERT WITH CHECK (public.is_admin());

CREATE POLICY "profiles_encontro_update" ON public.profiles_encontro
  FOR UPDATE USING (public.is_admin());

-- ------------------------------------------------------------
-- event_config_encontro
-- Leitura pública (landing page consome dados do evento)
-- Escrita apenas para usuários do painel
-- ------------------------------------------------------------
CREATE POLICY "event_config_encontro_select_public" ON public.event_config_encontro
  FOR SELECT USING (true);

CREATE POLICY "event_config_encontro_update_admin" ON public.event_config_encontro
  FOR UPDATE USING (public.is_admin());

-- ------------------------------------------------------------
-- ticket_lots_encontro
-- Leitura pública (exibidos na landing page)
-- Escrita apenas para usuários do painel
-- ------------------------------------------------------------
CREATE POLICY "ticket_lots_encontro_select_public" ON public.ticket_lots_encontro
  FOR SELECT USING (true);

CREATE POLICY "ticket_lots_encontro_insert_admin" ON public.ticket_lots_encontro
  FOR INSERT WITH CHECK (public.is_admin());

CREATE POLICY "ticket_lots_encontro_update_admin" ON public.ticket_lots_encontro
  FOR UPDATE USING (public.is_admin());

CREATE POLICY "ticket_lots_encontro_delete_admin" ON public.ticket_lots_encontro
  FOR DELETE USING (public.is_admin());

-- ------------------------------------------------------------
-- order_bumps_encontro
-- Leitura pública (exibidos no checkout)
-- Escrita apenas para usuários do painel
-- ------------------------------------------------------------
CREATE POLICY "order_bumps_encontro_select_public" ON public.order_bumps_encontro
  FOR SELECT USING (true);

CREATE POLICY "order_bumps_encontro_insert_admin" ON public.order_bumps_encontro
  FOR INSERT WITH CHECK (public.is_admin());

CREATE POLICY "order_bumps_encontro_update_admin" ON public.order_bumps_encontro
  FOR UPDATE USING (public.is_admin());

CREATE POLICY "order_bumps_encontro_delete_admin" ON public.order_bumps_encontro
  FOR DELETE USING (public.is_admin());

-- ------------------------------------------------------------
-- speakers_encontro
-- Leitura pública (exibidos na landing page)
-- Escrita apenas para usuários do painel
-- ------------------------------------------------------------
CREATE POLICY "speakers_encontro_select_public" ON public.speakers_encontro
  FOR SELECT USING (true);

CREATE POLICY "speakers_encontro_insert_admin" ON public.speakers_encontro
  FOR INSERT WITH CHECK (public.is_admin());

CREATE POLICY "speakers_encontro_update_admin" ON public.speakers_encontro
  FOR UPDATE USING (public.is_admin());

CREATE POLICY "speakers_encontro_delete_admin" ON public.speakers_encontro
  FOR DELETE USING (public.is_admin());

-- ------------------------------------------------------------
-- schedule_encontro
-- Leitura pública (exibida na landing page)
-- Escrita apenas para usuários do painel
-- ------------------------------------------------------------
CREATE POLICY "schedule_encontro_select_public" ON public.schedule_encontro
  FOR SELECT USING (true);

CREATE POLICY "schedule_encontro_insert_admin" ON public.schedule_encontro
  FOR INSERT WITH CHECK (public.is_admin());

CREATE POLICY "schedule_encontro_update_admin" ON public.schedule_encontro
  FOR UPDATE USING (public.is_admin());

CREATE POLICY "schedule_encontro_delete_admin" ON public.schedule_encontro
  FOR DELETE USING (public.is_admin());

-- ------------------------------------------------------------
-- orders_encontro
-- Insert público via service_role (checkout server-side)
-- Select/Update apenas via service_role ou painel
-- Comprador NÃO acessa a tabela diretamente — acesso pelo server
-- ------------------------------------------------------------
CREATE POLICY "orders_encontro_insert_service" ON public.orders_encontro
  FOR INSERT WITH CHECK (true);
  -- O insert é feito exclusivamente via Server Action com service_role

CREATE POLICY "orders_encontro_select_admin" ON public.orders_encontro
  FOR SELECT USING (public.is_admin());

CREATE POLICY "orders_encontro_update_service" ON public.orders_encontro
  FOR UPDATE USING (public.is_admin());

-- ------------------------------------------------------------
-- email_logs_encontro
-- Apenas usuários do painel podem ler
-- Insert via service_role
-- ------------------------------------------------------------
CREATE POLICY "email_logs_encontro_select_admin" ON public.email_logs_encontro
  FOR SELECT USING (public.is_admin());

CREATE POLICY "email_logs_encontro_insert_service" ON public.email_logs_encontro
  FOR INSERT WITH CHECK (true);

CREATE POLICY "email_logs_encontro_update_service" ON public.email_logs_encontro
  FOR UPDATE USING (public.is_admin());

-- ------------------------------------------------------------
-- tracking_events_encontro
-- Insert público (disparado pelo cliente/servidor)
-- Select apenas para usuários do painel
-- ------------------------------------------------------------
CREATE POLICY "tracking_events_encontro_insert_public" ON public.tracking_events_encontro
  FOR INSERT WITH CHECK (true);

CREATE POLICY "tracking_events_encontro_select_admin" ON public.tracking_events_encontro
  FOR SELECT USING (public.is_admin());
