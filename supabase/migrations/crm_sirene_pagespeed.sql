-- ============================================================
-- Migration : intégration API Sirene (INSEE/data.gouv.fr) et
-- Google PageSpeed Insights — ajouts MINIMAUX, idempotents.
--
-- Sources :
--   - Sirene : données légales d'une entreprise (siret, NAF, date_creation,
--     etat_administratif). Sourcing par zone+activité ET enrichissement
--     d'une fiche existante. Ne fournit AUCUN email/telephone (à démarcher
--     en terrain/réseau si la fiche n'a pas d'autre canal de contact).
--   - PageSpeed : score de performance d'un site existant (perf + mobile).
--     Pertinent uniquement si le prospect a déjà une URL. Alimente
--     l'argument 'refonte' dans score_besoin_web.
--
-- Principe : tous les bruts en JSONB (sirene_raw, pagespeed_raw) +
-- quelques colonnes typées filtrables. Pas de table parallèle.
--
-- Idempotente : ADD COLUMN IF NOT EXISTS / DROP+ADD CONSTRAINT pour la
-- CHECK source (Postgres ne supporte pas l'ajout conditionnel de valeur
-- à une CHECK existante).
-- ============================================================

-- ── 1. Colonnes Sirene ───────────────────────────────────────

ALTER TABLE prospects
  ADD COLUMN IF NOT EXISTS siret               text,
  ADD COLUMN IF NOT EXISTS code_naf            text,
  ADD COLUMN IF NOT EXISTS libelle_naf         text,
  ADD COLUMN IF NOT EXISTS date_creation       date,
  ADD COLUMN IF NOT EXISTS tranche_effectif    text,
  ADD COLUMN IF NOT EXISTS etat_administratif  text,  -- 'A' (Actif), 'F' (Fermé), 'C' (Cessé), null
  ADD COLUMN IF NOT EXISTS sirene_raw          jsonb,
  ADD COLUMN IF NOT EXISTS sirene_enriched_at  timestamptz;

-- siret = clé naturelle de dédup. Index UNIQUE partiel (autorise plusieurs
-- siret NULL côté Google où l'info n'existe pas, mais garantit l'unicité
-- des prospects ayant un siret renseigné).
CREATE UNIQUE INDEX IF NOT EXISTS prospects_siret_unique_idx
  ON prospects (siret)
  WHERE siret IS NOT NULL;

CREATE INDEX IF NOT EXISTS prospects_code_naf_idx
  ON prospects (code_naf);

CREATE INDEX IF NOT EXISTS prospects_etat_administratif_idx
  ON prospects (etat_administratif);

-- ── 2. Extension de la CHECK 'source' avec 'sirene' et 'both' ────

-- 'sirene' : sourcing/enrichissement venu de Sirene uniquement
-- 'both'   : prospect connu des deux sources (fusion à l'import après
--            match SIRET)
ALTER TABLE prospects
  DROP CONSTRAINT IF EXISTS prospects_source_check;
ALTER TABLE prospects
  ADD CONSTRAINT prospects_source_check
  CHECK (source IN ('manuel', 'enrichissement', 'sourcing', 'sirene', 'both'));

-- ── 3. Colonnes PageSpeed ────────────────────────────────────

ALTER TABLE prospects
  ADD COLUMN IF NOT EXISTS pagespeed_score_perf    smallint,   -- 0..100
  ADD COLUMN IF NOT EXISTS pagespeed_score_mobile  smallint,   -- 0..100 (perf mobile distincte si dispo)
  ADD COLUMN IF NOT EXISTS pagespeed_analyzed_at   timestamptz,
  ADD COLUMN IF NOT EXISTS pagespeed_status        text,       -- 'pending' / 'done' / 'error' / null
  ADD COLUMN IF NOT EXISTS pagespeed_raw           jsonb;

ALTER TABLE prospects
  DROP CONSTRAINT IF EXISTS prospects_pagespeed_status_check;
ALTER TABLE prospects
  ADD CONSTRAINT prospects_pagespeed_status_check
  CHECK (pagespeed_status IS NULL OR pagespeed_status IN ('pending', 'done', 'error'));

ALTER TABLE prospects
  DROP CONSTRAINT IF EXISTS prospects_pagespeed_score_perf_range;
ALTER TABLE prospects
  ADD CONSTRAINT prospects_pagespeed_score_perf_range
  CHECK (pagespeed_score_perf IS NULL OR (pagespeed_score_perf BETWEEN 0 AND 100));

ALTER TABLE prospects
  DROP CONSTRAINT IF EXISTS prospects_pagespeed_score_mobile_range;
ALTER TABLE prospects
  ADD CONSTRAINT prospects_pagespeed_score_mobile_range
  CHECK (pagespeed_score_mobile IS NULL OR (pagespeed_score_mobile BETWEEN 0 AND 100));

-- Index pour le cron batch : récupère vite les 'pending' à traiter.
CREATE INDEX IF NOT EXISTS prospects_pagespeed_status_idx
  ON prospects (pagespeed_status)
  WHERE pagespeed_status = 'pending';

-- ── 4. Flag 'doublon potentiel à vérifier' ───────────────────

-- Posé par l'import quand un match nom+CP existe sans SIRET commun
-- (dédup conservatrice — on ne fusionne pas automatiquement, on signale).
-- Le freelance peut filtrer cette liste pour fusionner manuellement.
ALTER TABLE prospects
  ADD COLUMN IF NOT EXISTS dedup_warning text;  -- ex: "match nom+CP avec prospect <uuid>, à vérifier"

CREATE INDEX IF NOT EXISTS prospects_dedup_warning_idx
  ON prospects (dedup_warning)
  WHERE dedup_warning IS NOT NULL;
