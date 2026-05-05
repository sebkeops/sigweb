-- ============================================================
-- Migration : champ `source` sur prospects (origine de la fiche)
-- À exécuter dans l'éditeur SQL Supabase.
--
-- Valeurs autorisées :
--   - manuel        : saisie via le formulaire de création directe
--   - enrichissement: créé via la page d'enrichissement Google
--                     (URL ou recherche par nom — non distingué)
--   - sourcing      : importé via une session de sourcing batch
--
-- Backfill arbitraire : tous les prospects existants à la date de cette
-- migration sont affectés à `enrichissement`. Choix conscient — la
-- plupart ont effectivement été créés via la feature d'enrichissement
-- Google, et on n'a aucune trace historique pour distinguer les rares
-- saisies manuelles. Si tu vois un prospect mal classé, tu peux le
-- corriger manuellement en SQL.
-- ============================================================

-- 1. Ajout de la colonne, defaut transitoire `enrichissement` pour le backfill
ALTER TABLE prospects
  ADD COLUMN IF NOT EXISTS source text NOT NULL DEFAULT 'enrichissement';

-- 2. CHECK constraint
ALTER TABLE prospects
  DROP CONSTRAINT IF EXISTS prospects_source_check;
ALTER TABLE prospects
  ADD CONSTRAINT prospects_source_check
  CHECK (source IN ('manuel', 'enrichissement', 'sourcing'));

-- 3. Réajuste le DEFAULT pour les futures créations : `manuel` (cas par défaut
-- d'un INSERT sans source, qui correspond à une saisie manuelle)
ALTER TABLE prospects
  ALTER COLUMN source SET DEFAULT 'manuel';

-- 4. Index pour filtrer la liste sur la source
CREATE INDEX IF NOT EXISTS prospects_source_idx ON prospects (source);
