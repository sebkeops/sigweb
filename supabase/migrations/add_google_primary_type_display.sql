-- ============================================================
-- Migration : libellé localisé du type Google (primaryTypeDisplayName)
-- Permet d'afficher "Magasin de nouveautés" au lieu de "Autre"
-- quand notre mapping interne tombe sur 'autre'.
-- À exécuter dans l'éditeur SQL Supabase.
-- ============================================================

ALTER TABLE prospects
  ADD COLUMN IF NOT EXISTS google_primary_type_display text;
