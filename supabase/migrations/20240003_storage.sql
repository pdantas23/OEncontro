-- ============================================================
-- Migration: 003 — Supabase Storage
-- Buckets para upload de imagens (palestrantes, evento)
-- ============================================================

-- Bucket para fotos de palestrantes
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'speakers',
  'speakers',
  true,                    -- público (URLs acessíveis pela landing page)
  5242880,                 -- limite: 5MB
  ARRAY['image/jpeg', 'image/png', 'image/webp']
)
ON CONFLICT (id) DO NOTHING;

-- Bucket para assets do evento (logo, hero, memórias)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'event-assets',
  'event-assets',
  true,
  10485760,               -- limite: 10MB
  ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'video/mp4']
)
ON CONFLICT (id) DO NOTHING;

-- ------------------------------------------------------------
-- Policies do Storage
-- ------------------------------------------------------------

-- Leitura pública para os dois buckets (URLs nas páginas públicas)
CREATE POLICY "speakers_public_read" ON storage.objects
  FOR SELECT USING (bucket_id = 'speakers');

CREATE POLICY "event_assets_public_read" ON storage.objects
  FOR SELECT USING (bucket_id = 'event-assets');

-- Upload apenas para admins
CREATE POLICY "speakers_admin_upload" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'speakers' AND public.is_admin()
  );

CREATE POLICY "event_assets_admin_upload" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'event-assets' AND public.is_admin()
  );

-- Delete apenas para admins
CREATE POLICY "speakers_admin_delete" ON storage.objects
  FOR DELETE USING (
    bucket_id = 'speakers' AND public.is_admin()
  );

CREATE POLICY "event_assets_admin_delete" ON storage.objects
  FOR DELETE USING (
    bucket_id = 'event-assets' AND public.is_admin()
  );
