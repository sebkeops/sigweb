-- ============================================================
-- Migration : pilotage commercial CRM v3 — Phase 1 (métadonnées statut).
--
-- Ajoute 2 colonnes a `prospects` pour preparer les modules de
-- pilotage commercial (timeline, dashboard, filtrage tests vs vrais
-- envois). Aucun changement aux 13 valeurs de `statut` existantes —
-- elles sont conservees telles quelles (le compteur de relances
-- relance_1/2/3 est utile au metier).
--
-- 1. `statut_updated_at` (timestamptz) — horodatage de la derniere
--    transition de statut. Permet :
--      - de calculer la duree dans un statut (ex: "depuis combien
--        de temps ce prospect est-il en relance_2 ?")
--      - d'afficher la fraicheur sur les listes admin
--      - de feeder le futur dashboard "A faire aujourd'hui"
--    Initialise a `now()` pour tous les prospects existants — leur
--    historique avant la migration est perdu (limite acceptee : on
--    repart de l'etat actuel comme point de depart, cf. discussion
--    sur l'historique des statuts).
--
-- 2. `is_test` (boolean) — flag pour distinguer les prospects de
--    test (ex: prospect cree pour verifier le rendu email) des vrais
--    prospects. Sert au filtrage automatique des dashboards (Phase 5
--    du chantier CRM v3). Default false — tous les prospects existants
--    sont consideres reels.
--
-- 3. Index `prospects_statut_updated_at_idx` — pour les requetes
--    futures du dashboard (Phase 6) type "prospects sans contact
--    depuis X jours" qui filtreront sur `statut_updated_at < now() -
--    interval 'X days'`.
--
-- Idempotent : ADD COLUMN IF NOT EXISTS + CREATE INDEX IF NOT EXISTS.
-- ============================================================

ALTER TABLE prospects
  ADD COLUMN IF NOT EXISTS statut_updated_at timestamptz NOT NULL DEFAULT now();

ALTER TABLE prospects
  ADD COLUMN IF NOT EXISTS is_test boolean NOT NULL DEFAULT false;

CREATE INDEX IF NOT EXISTS prospects_statut_updated_at_idx
  ON prospects (statut_updated_at DESC);
