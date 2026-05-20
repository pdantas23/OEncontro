-- ============================================================
-- Migration: 007 — Imagem do lote de ingresso
-- Adiciona image_url + bucket de storage para imagens de lotes
-- ============================================================

ALTER TABLE public.ticket_lots_encontro
  ADD COLUMN IF NOT EXISTS image_url text;

-- Bucket para imagens de ingressos
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'ticket-lots',
  'ticket-lots',
  true,
  5242880,
  ARRAY['image/jpeg', 'image/png', 'image/webp']
)
ON CONFLICT (id) DO NOTHING;

-- Policies de storage
CREATE POLICY "ticket_lots_public_read" ON storage.objects
  FOR SELECT USING (bucket_id = 'ticket-lots');

CREATE POLICY "ticket_lots_admin_upload" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'ticket-lots' AND public.is_admin()
  );

CREATE POLICY "ticket_lots_admin_delete" ON storage.objects
  FOR DELETE USING (
    bucket_id = 'ticket-lots' AND public.is_admin()
  );
