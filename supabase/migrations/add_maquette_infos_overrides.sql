-- ============================================================
-- Migration : ajout du champ d'override des infos pratiques sur maquettes
-- À exécuter dans l'éditeur SQL Supabase
--
-- Session 3.5 — Sous-livrable 5
--
-- Permet à l'admin d'override les valeurs affichées dans la section
-- "Infos pratiques" de la maquette publiée (adresse, téléphone, email),
-- ou de masquer ces valeurs.
--
-- Format JSONB attendu :
--   { adresse?: string|null, telephone?: string|null, email?: string|null }
--
-- Sémantique :
--   - clé absente du JSON         → utiliser la valeur du prospect
--   - clé présente avec null      → masquer cette info sur la maquette
--   - clé présente avec string    → utiliser cette valeur custom
--
-- Validation runtime côté code via Zod (cf. lib/maquette/content-schema.ts).
-- Pas de CHECK SQL pour rester souple sur les évolutions futures du shape.
-- ============================================================

ALTER TABLE maquettes
  ADD COLUMN IF NOT EXISTS infos_overrides jsonb;

COMMENT ON COLUMN maquettes.infos_overrides IS
  'Overrides des infos pratiques affichées sur /demos/[slug]. Format : { adresse?, telephone?, email? } où null = masquer, string = override, absent = utiliser le prospect. Validation Zod côté code.';
