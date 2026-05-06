-- ============================================================
-- Migration : restructuration des photos maquette
-- À exécuter dans l'éditeur SQL Supabase
--
-- Session 3.0 — Passage du trio de colonnes
--   (hero_photo_url, histoire_photo_url, univers_photos_urls)
-- vers le modèle pool + assignations :
--   (available_photos, photo_assignments)
--
-- Stratégie de transition :
--   - On AJOUTE les nouvelles colonnes (nullable, default null).
--   - On NE TOUCHE PAS aux anciennes colonnes : elles seront supprimées
--     dans une migration ultérieure une fois le nouveau modèle validé
--     visuellement sur 5+ maquettes (cf. CLEANUP-TODO.md).
--
-- Pas de CHECK constraint sur le format JSONB côté BDD : la validation
-- se fait à RUNTIME via Zod (cf. lib/maquette/photos/schema.ts) sur
-- chaque INSERT/UPDATE qui touche ces colonnes.
--
-- Idempotente : `ADD COLUMN IF NOT EXISTS` permet de la rejouer sans erreur.
-- ============================================================

ALTER TABLE maquettes
  ADD COLUMN IF NOT EXISTS available_photos   jsonb,
  ADD COLUMN IF NOT EXISTS photo_assignments  jsonb;

-- Pas d'index : ces colonnes sont lues par maquette (id ou slug),
-- jamais filtrées en WHERE.

-- Note de migration des DONNÉES :
-- Les maquettes existantes sont migrées par la route handler
-- POST /api/admin/migrate-maquettes-photos (idempotent, ne traite
-- que les maquettes ayant available_photos IS NULL).
-- Les anciennes colonnes restent intactes pour rollback.

COMMENT ON COLUMN maquettes.available_photos IS
  'Pool de photos (Google + uploads). Format : jsonb array de { id (uuid), source (''google''|''upload''), reference (text), caption?, uploaded_at? }. Validation Zod côté code.';

COMMENT ON COLUMN maquettes.photo_assignments IS
  'Assignation slot → photo_id. Format : jsonb array de 7 entrées (hero, histoire, univers_1..5), photo_id nullable. Validation Zod côté code.';
