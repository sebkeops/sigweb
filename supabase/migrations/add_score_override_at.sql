-- ============================================================
-- Migration : horodatage de l'override manuel de score
-- À exécuter dans l'éditeur SQL Supabase.
--
-- Rationale : permet d'afficher "Score modifié manuellement le DD/MM/YYYY"
-- dans les tooltips de la liste CRM. Le champ score_calcule_at existe déjà
-- pour la date du dernier calcul auto, on ajoute son équivalent pour le manuel.
-- ============================================================

ALTER TABLE prospects
  ADD COLUMN IF NOT EXISTS score_override_at timestamptz;
