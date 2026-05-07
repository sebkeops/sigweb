-- ============================================================
-- Migration : ajout des avis détaillés Google Places sur prospects
-- À exécuter dans l'éditeur SQL Supabase
--
-- Étend l'enrichissement Google Places existant pour récupérer
-- jusqu'à 5 avis détaillés par prospect. Utilisé par le générateur
-- de maquettes (section "Avis" personnalisée par commerce).
--
-- Format jsonb attendu (snapshot Google Places API v1) :
-- [
--   {
--     "name": "places/X/reviews/Y",
--     "rating": 5,
--     "text": "...",
--     "author_name": "Sophie M.",
--     "author_initial": "S",
--     "publish_time": "2025-12-01T...",
--     "relative_time": "il y a 2 mois"
--   }
-- ]
--
-- Pas d'index : la colonne est lue uniquement par id de prospect.
-- ============================================================

ALTER TABLE prospects
  ADD COLUMN IF NOT EXISTS google_reviews jsonb;

-- Note : pas de CHECK contraignant le format JSON car les normalisations
-- évoluent au fil des versions Google Places API. La validation se fait
-- côté serveur dans lib/google-places/.
