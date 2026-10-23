-- ============================================================
-- Migration : ajout de la catégorie « Coach / Formateur »
-- (famille Services à la personne).
-- À exécuter dans l'éditeur SQL Supabase, après
-- extend_categories_v2.sql.
--
-- Étend les contraintes CHECK sur `prospects.categorie` et
-- `maquettes.template_variant` avec 'coach_formateur'
-- (35 catégories). Aucune donnée existante n'est modifiée.
-- ============================================================

-- ── 1. prospects.categorie ─────────────────────────────────────

ALTER TABLE prospects
  DROP CONSTRAINT IF EXISTS prospects_categorie_check;

ALTER TABLE prospects
  ADD CONSTRAINT prospects_categorie_check CHECK (categorie IN (
    -- V1
    'boulangerie','boucherie','restaurant','pizzeria',
    'primeur','fromager','caviste',
    'coiffeur','esthetique','kine','cabinet',
    'menuisier','plombier','electricien','peintre','paysagiste',
    'photographe',
    -- V2 — Commerces de bouche additionnels
    'bar_cafe','traiteur','chocolatier','epicerie_fine',
    -- V2 — Bâtiment & artisanat additionnels
    'macon','couvreur','carreleur','piscinier',
    -- V2 — Services à la personne additionnels
    'osteopathe','praticien_bien_etre','coach_formateur',
    -- V2 — Commerces & services additionnels
    'fleuriste','bijoutier','librairie','garagiste',
    -- V2 — Hébergement
    'gite','camping',
    -- Fallback
    'autre'
  ));

-- ── 2. maquettes.template_variant ──────────────────────────────

ALTER TABLE maquettes
  DROP CONSTRAINT IF EXISTS maquettes_template_variant_check;

ALTER TABLE maquettes
  ADD CONSTRAINT maquettes_template_variant_check CHECK (template_variant IN (
    -- V1
    'boulangerie','boucherie','restaurant','pizzeria',
    'primeur','fromager','caviste',
    'coiffeur','esthetique','kine','cabinet',
    'menuisier','plombier','electricien','peintre','paysagiste',
    'photographe',
    -- V2 — Commerces de bouche additionnels
    'bar_cafe','traiteur','chocolatier','epicerie_fine',
    -- V2 — Bâtiment & artisanat additionnels
    'macon','couvreur','carreleur','piscinier',
    -- V2 — Services à la personne additionnels
    'osteopathe','praticien_bien_etre','coach_formateur',
    -- V2 — Commerces & services additionnels
    'fleuriste','bijoutier','librairie','garagiste',
    -- V2 — Hébergement
    'gite','camping',
    -- Fallback
    'autre'
  ));
