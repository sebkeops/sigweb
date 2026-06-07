-- ============================================================
-- Migration : pilotage commercial CRM v3 — Phase 3 (fixup email-test).
--
-- Ajoute la valeur 'email-test' a la CHECK constraint de
-- `maquette_visits.source` pour distinguer les envois email TEST
-- (bouton 'Envoyer un test' en admin, redirige vers une adresse
-- du domaine sigweb.fr) des envois email REELS au prospect.
--
-- Quand le tracker detecte cette source 'email-test', il force aussi
-- is_test=true sur la ligne maquette_visits ET sur l'event timeline
-- 'maquette_visited' — ces visites n'apparaissent ainsi ni dans
-- l'encadre stats ni dans la timeline cote admin (filtrage existant
-- WHERE is_test = false).
--
-- Idempotent : DROP/ADD CONSTRAINT (Postgres ne supporte pas l'ajout
-- conditionnel d'une valeur a une CHECK existante).
--
-- Si vous deployez sur une BDD ou crm_v3_maquette_visits.sql n'a pas
-- encore tourne : cette migration est sans effet (la CHECK n'existe
-- pas → DROP IF EXISTS no-op, puis ADD ne fait rien car la table
-- n'existe pas). Inversement, si la table existe : la CHECK est
-- remplacee proprement.
-- ============================================================

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_tables WHERE tablename = 'maquette_visits' AND schemaname = 'public'
  ) THEN
    ALTER TABLE maquette_visits
      DROP CONSTRAINT IF EXISTS maquette_visits_source_check;

    ALTER TABLE maquette_visits
      ADD CONSTRAINT maquette_visits_source_check
      CHECK (source IN ('affiche', 'email', 'email-test', 'carte', 'direct', 'other'));
  END IF;
END $$;
