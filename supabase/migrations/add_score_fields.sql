-- ============================================================
-- Migration : champs de scoring automatique sur prospects
-- À exécuter dans l'éditeur SQL Supabase.
--
-- Logique :
--   - score_calcule       : score automatique calculé selon la grille v2 (0-10)
--   - score_proximite, score_besoin_web, score_activite, score_malus : sous-scores
--   - score_explanations  : array JSON des libellés de chaque critère
--   - score_calcule_at    : horodatage du dernier calcul auto
--   - score_override_manuel : valeur forcée manuellement par l'admin (NULL = pas d'override)
--
--   - Le champ existant `score` reste la VALEUR DE RÉFÉRENCE affichée :
--       * si score_override_manuel IS NULL → score = score_calcule
--       * sinon                            → score = score_override_manuel
-- ============================================================

ALTER TABLE prospects
  ADD COLUMN IF NOT EXISTS score_calcule           int,
  ADD COLUMN IF NOT EXISTS score_proximite         int,
  ADD COLUMN IF NOT EXISTS score_besoin_web        int,
  ADD COLUMN IF NOT EXISTS score_activite          int,
  ADD COLUMN IF NOT EXISTS score_malus             int,
  ADD COLUMN IF NOT EXISTS score_override_manuel   int,
  ADD COLUMN IF NOT EXISTS score_explanations      jsonb,
  ADD COLUMN IF NOT EXISTS score_calcule_at        timestamptz;

-- Le score peut maintenant valoir 0 (la grille v2 plafonne entre 0 et 10).
-- L'ancienne contrainte 1-10 doit être assouplie à 0-10.
ALTER TABLE prospects
  DROP CONSTRAINT IF EXISTS prospects_score_check;
ALTER TABLE prospects
  ADD CONSTRAINT prospects_score_check
  CHECK (score IS NULL OR (score >= 0 AND score <= 10));

ALTER TABLE prospects
  DROP CONSTRAINT IF EXISTS prospects_score_calcule_check;
ALTER TABLE prospects
  ADD CONSTRAINT prospects_score_calcule_check
  CHECK (score_calcule IS NULL OR (score_calcule >= 0 AND score_calcule <= 10));

ALTER TABLE prospects
  DROP CONSTRAINT IF EXISTS prospects_score_override_manuel_check;
ALTER TABLE prospects
  ADD CONSTRAINT prospects_score_override_manuel_check
  CHECK (score_override_manuel IS NULL OR (score_override_manuel >= 0 AND score_override_manuel <= 10));

-- Note : aucun recalcul SQL des prospects existants n'est fait ici.
-- Le recalcul est piloté par la route handler /api/admin/prospects/recompute-scores
-- qui réutilise la fonction TS computeScore (source de vérité unique).
