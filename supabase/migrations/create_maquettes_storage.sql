-- ============================================================
-- Migration : bucket Supabase Storage pour les assets de maquettes
-- À exécuter dans l'éditeur SQL Supabase
--
-- ⚠️ Avant d'appliquer : remplace 'REMPLACER_PAR_VOTRE_UUID_ADMIN'
-- par le vrai UUID admin (le même que dans rls_admin_uuid.sql).
--
-- Bucket public en lecture, upload restreint à l'admin.
-- Limite : 5 MB par fichier, types image uniquement.
--
-- Note : ce SQL doit être exécuté avec un rôle disposant des droits
-- sur le schéma `storage` (l'éditeur SQL Supabase tourne en
-- service_role par défaut, donc OK).
-- ============================================================

-- ── Bucket ─────────────────────────────────────────────────────

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'maquettes-assets',
  'maquettes-assets',
  true,
  5242880,
  ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/svg+xml']
)
ON CONFLICT (id) DO UPDATE SET
  public             = EXCLUDED.public,
  file_size_limit    = EXCLUDED.file_size_limit,
  allowed_mime_types = EXCLUDED.allowed_mime_types;

-- ── Policies ───────────────────────────────────────────────────

-- Lecture publique : nécessaire pour afficher les logos / photos
-- uploadés sur la page publique /demos/[slug].
DROP POLICY IF EXISTS "public_read_maquettes_assets" ON storage.objects;
CREATE POLICY "public_read_maquettes_assets"
  ON storage.objects
  FOR SELECT
  USING (bucket_id = 'maquettes-assets');

-- Upload : admin uniquement.
DROP POLICY IF EXISTS "admin_insert_maquettes_assets" ON storage.objects;
CREATE POLICY "admin_insert_maquettes_assets"
  ON storage.objects
  FOR INSERT
  WITH CHECK (
    bucket_id = 'maquettes-assets'
    AND auth.uid() = 'REMPLACER_PAR_VOTRE_UUID_ADMIN'::uuid
  );

-- Update : admin uniquement (rare, mais utile pour upsert).
DROP POLICY IF EXISTS "admin_update_maquettes_assets" ON storage.objects;
CREATE POLICY "admin_update_maquettes_assets"
  ON storage.objects
  FOR UPDATE
  USING (
    bucket_id = 'maquettes-assets'
    AND auth.uid() = 'REMPLACER_PAR_VOTRE_UUID_ADMIN'::uuid
  );

-- Delete : admin uniquement (suppression de logo / photo).
DROP POLICY IF EXISTS "admin_delete_maquettes_assets" ON storage.objects;
CREATE POLICY "admin_delete_maquettes_assets"
  ON storage.objects
  FOR DELETE
  USING (
    bucket_id = 'maquettes-assets'
    AND auth.uid() = 'REMPLACER_PAR_VOTRE_UUID_ADMIN'::uuid
  );
