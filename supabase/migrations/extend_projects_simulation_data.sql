-- ============================================================
-- Migration : système de simulations publiques BDD-driven (Phase 1).
--
-- Le site exposait jusqu'ici 4 simulations publiques lues depuis
-- des fichiers JSON locaux (lib/data/simulations/*.json). On bascule
-- l'intégralité du contenu en BDD pour pouvoir générer et éditer
-- les 34 simulations depuis l'admin.
--
-- À exécuter dans l'éditeur SQL Supabase.
--
-- 1. Étend `projects` avec deux colonnes :
--    - `simulation_data` (jsonb) : équivalent d'un fichier JSON
--      simulation (validé côté code par SimulationDataSchema).
--      Nullable car seules les lignes `project_kind='simulation'`
--      la portent.
--    - `category_family` (text) : famille éditoriale parmi 6 valeurs
--      définies dans `lib/crm/constants.ts` (CATEGORIE_FAMILIES).
--      Sert au filtre famille public sur /simulations.
--
-- 2. Ajoute deux index pour les requêtes /simulations :
--    - filtre famille (partiel sur les simulations uniquement)
--    - liste publiée (kind + published)
--
-- Idempotent : tous les ADD COLUMN / CREATE INDEX sont IF NOT EXISTS.
-- ============================================================

-- ── 1. Colonnes ────────────────────────────────────────────────

ALTER TABLE projects
  ADD COLUMN IF NOT EXISTS simulation_data jsonb;

ALTER TABLE projects
  ADD COLUMN IF NOT EXISTS category_family text;

-- Contrainte CHECK sur category_family : aligne avec les 6 familles
-- définies côté code (lib/crm/constants.ts → CATEGORIE_FAMILIES).
-- 'autre' est inclus pour le fallback même s'il n'est pas exposé
-- dans le filtre public.
ALTER TABLE projects
  DROP CONSTRAINT IF EXISTS projects_category_family_check;

ALTER TABLE projects
  ADD CONSTRAINT projects_category_family_check CHECK (
    category_family IS NULL OR category_family IN (
      'bouche',
      'batiment',
      'services_personne',
      'commerces_services',
      'hebergement',
      'autre'
    )
  );

-- ── 2. Index ───────────────────────────────────────────────────

-- Filtre famille (uniquement sur les simulations). Partiel pour
-- éviter d'indexer toutes les réalisations qui n'utilisent pas ce
-- champ.
CREATE INDEX IF NOT EXISTS idx_projects_category_family
  ON projects(category_family)
  WHERE project_kind = 'simulation';

-- Liste publique /simulations : filtre principal kind + published.
-- Composite, utile pour la requête `WHERE project_kind = X AND
-- published = TRUE ORDER BY created_at DESC` exécutée à chaque
-- chargement de page.
CREATE INDEX IF NOT EXISTS idx_projects_kind_published
  ON projects(project_kind, published);
