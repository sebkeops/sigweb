-- ============================================================
-- Migration : enrichissement Google Places sur prospects
-- À exécuter dans l'éditeur SQL Supabase
-- ============================================================

ALTER TABLE prospects
  ADD COLUMN IF NOT EXISTS google_place_id          text,
  ADD COLUMN IF NOT EXISTS google_rating            numeric(2,1),
  ADD COLUMN IF NOT EXISTS google_reviews_count     int,
  ADD COLUMN IF NOT EXISTS google_business_status   text,
  ADD COLUMN IF NOT EXISTS google_categories        jsonb,
  ADD COLUMN IF NOT EXISTS google_opening_hours     jsonb,
  -- Stocke les références photos Google (ex: ["places/X/photos/Y", ...]),
  -- jamais d'URLs complètes contenant la clé API.
  ADD COLUMN IF NOT EXISTS google_photo_refs        jsonb,
  ADD COLUMN IF NOT EXISTS google_maps_url          text,
  ADD COLUMN IF NOT EXISTS latitude                 numeric(9,6),
  ADD COLUMN IF NOT EXISTS longitude                numeric(9,6),
  ADD COLUMN IF NOT EXISTS last_enriched_at         timestamptz;

-- Contraintes de sanité
ALTER TABLE prospects
  DROP CONSTRAINT IF EXISTS prospects_google_rating_check;
ALTER TABLE prospects
  ADD CONSTRAINT prospects_google_rating_check
  CHECK (google_rating IS NULL OR (google_rating >= 0 AND google_rating <= 5));

ALTER TABLE prospects
  DROP CONSTRAINT IF EXISTS prospects_google_business_status_check;
ALTER TABLE prospects
  ADD CONSTRAINT prospects_google_business_status_check
  CHECK (google_business_status IS NULL OR google_business_status IN (
    'OPERATIONAL', 'CLOSED_TEMPORARILY', 'CLOSED_PERMANENTLY'
  ));

-- Index unique partiel : autorise plusieurs prospects sans google_place_id
-- (saisie manuelle), mais empêche les doublons côté Google.
DROP INDEX IF EXISTS prospects_google_place_id_unique_idx;
CREATE UNIQUE INDEX prospects_google_place_id_unique_idx
  ON prospects (google_place_id)
  WHERE google_place_id IS NOT NULL;

-- Index pour requêter facilement les fiches obsolètes
CREATE INDEX IF NOT EXISTS prospects_last_enriched_at_idx
  ON prospects (last_enriched_at);
