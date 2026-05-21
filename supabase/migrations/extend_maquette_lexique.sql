-- ============================================================
-- Migration : extension presets métier — lexique global.
-- À exécuter dans l'éditeur SQL Supabase, après
-- `extend_maquette_variants_and_univers_section.sql`.
--
-- Ajoute 7 colonnes texte nullables pour les libellés transverses
-- conditionnés par catégorie, éditables individuellement depuis
-- l'éditeur split-pane (section "Lexique") :
--
--   - brand_tagline         : sous-titre sous le nom (header + footer)
--   - nav_histoire_label    : label du lien #histoire (header + footer)
--   - nav_univers_label     : label du lien #univers (header + footer)
--   - hero_cta_primaire     : texte du bouton CTA Hero primaire
--   - histoire_suptitle     : sectionEyebrow de la section Histoire
--   - avis_section_titre    : titre de la section Avis (markdown italique)
--   - footer_colonne_label  : H4 de la colonne d'ancrage du Footer
--
-- Toutes nullables : les maquettes pré-migration ont NULL, les
-- composants côté rendu retombent sur `template.defaults.*`
-- (valeurs identiques aux chaînes hardcodées préexistantes pour
-- les 4 maquettes Famille 2 → zéro régression).
-- ============================================================

ALTER TABLE maquettes
  ADD COLUMN IF NOT EXISTS brand_tagline        text,
  ADD COLUMN IF NOT EXISTS nav_histoire_label   text,
  ADD COLUMN IF NOT EXISTS nav_univers_label    text,
  ADD COLUMN IF NOT EXISTS hero_cta_primaire    text,
  ADD COLUMN IF NOT EXISTS histoire_suptitle    text,
  ADD COLUMN IF NOT EXISTS avis_section_titre   text,
  ADD COLUMN IF NOT EXISTS footer_colonne_label text;
