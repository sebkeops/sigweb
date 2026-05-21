-- ============================================================
-- Migration : consolidation finale presets métier — 16 nouvelles
-- catégories ajoutées en BDD (V2).
-- À exécuter dans l'éditeur SQL Supabase, après les migrations
-- précédentes liées aux maquettes.
--
-- 1. Étend la contrainte CHECK sur `prospects.categorie` aux 34
--    catégories du brief "Consolidation finale" (18 V1 + 16 V2).
--
-- 2. Étend la contrainte CHECK sur `maquettes.template_variant`
--    de la même manière (les maquettes générées doivent pouvoir
--    porter un id V2 dès qu'un preset y est exposé).
--
-- Note : les 16 ids V2 sont présents en BDD pour anticiper, mais
-- leur exposition dans le select admin est gérée côté code via
-- `CATEGORIES_EXPOSED_IN_ADMIN` (lib/crm/constants.ts). Un id V2
-- ne peut donc pas être saisi via l'UI tant que son preset n'est
-- pas livré, même si la BDD accepte la valeur.
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
    'osteopathe','praticien_bien_etre',
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
    'osteopathe','praticien_bien_etre',
    -- V2 — Commerces & services additionnels
    'fleuriste','bijoutier','librairie','garagiste',
    -- V2 — Hébergement
    'gite','camping',
    -- Fallback
    'autre'
  ));
