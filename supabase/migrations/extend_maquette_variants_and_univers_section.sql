-- ============================================================
-- Migration : généralisation maquettes Famille 2 → toutes catégories.
-- À exécuter dans l'éditeur SQL Supabase.
--
-- 1. Étend la contrainte CHECK sur `template_variant` à 19 valeurs
--    (les 18 catégories CRM + 'autre' fallback) pour permettre
--    de générer des maquettes pour les 14 nouvelles catégories
--    (primeur, fromager, caviste, coiffeur, esthetique, kine,
--    cabinet, menuisier, plombier, electricien, peintre,
--    paysagiste, photographe, autre).
--
-- 2. Ajoute 3 colonnes texte pour les overrides de la section
--    "Nos créations" — éditables depuis l'éditeur split-pane :
--    - univers_section_suptitle (court, ex: "Nos créations")
--    - univers_section_title    (titre principal, supporte *italique*)
--    - univers_section_intro    (paragraphe descriptif)
--
-- Les anciennes valeurs hardcodées dans les templates TS restent
-- le fallback côté code (composant `Univers.tsx`) pour les maquettes
-- existantes qui n'ont pas encore été éditées (NULL en BDD).
-- ============================================================

-- ── 1. Étendre la contrainte template_variant ─────────────────

ALTER TABLE maquettes
  DROP CONSTRAINT IF EXISTS maquettes_template_variant_check;

ALTER TABLE maquettes
  ADD CONSTRAINT maquettes_template_variant_check CHECK (template_variant IN (
    -- Famille 2 historique
    'boulangerie','boucherie','restaurant','pizzeria',
    -- Commerces de bouche additionnels
    'primeur','fromager','caviste',
    -- Services à la personne
    'coiffeur','esthetique','kine','cabinet',
    -- Artisans du bâtiment / maison
    'menuisier','plombier','electricien','peintre','paysagiste',
    -- Créatifs / services
    'photographe',
    -- Fallback générique
    'autre'
  ));

-- ── 2. Ajouter les 3 colonnes d'override "Nos créations" ──────

ALTER TABLE maquettes
  ADD COLUMN IF NOT EXISTS univers_section_suptitle text,
  ADD COLUMN IF NOT EXISTS univers_section_title    text,
  ADD COLUMN IF NOT EXISTS univers_section_intro    text;

-- Pas de CHECK NOT NULL : ces 3 champs peuvent rester NULL pour
-- les maquettes pré-migration ; le composant `Univers.tsx` tombe
-- sur le template par défaut quand c'est le cas. Les maquettes
-- créées via `generateInitialMaquette` les remplissent dès
-- l'INSERT, donc en pratique elles seront non-null pour toute
-- nouvelle maquette.
