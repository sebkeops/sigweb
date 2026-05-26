-- ============================================================
-- Migration : passe à `published = false` les 4 simulations
-- historiques (Phase 3 — refonte rendu unifié).
--
-- Contexte : le format JSONB stocké en Phase 1 (objet `SimulationData`
-- plat de 14 champs) n'est plus valide depuis la Phase 3, qui attend un
-- payload `{ maquette, prospect }` conforme au nouveau schéma Zod
-- `lib/maquette/data-schema.ts`. Les 4 simulations héritées (boulangerie,
-- boucherie, pizzeria, coiffure) ne parseront donc plus, et leur route
-- /simulations/{slug} retournerait un 404 silencieux à cause du
-- safeParse Zod qui échoue.
--
-- On les passe explicitement `published = false` pour que :
--   1. Elles disparaissent de la liste /simulations (filtre `published`)
--   2. Elles n'apparaissent pas dans generateStaticParams() (donc pas
--      de pré-rendu, pas de 404 publique visible)
--   3. Elles soient régénérées proprement en Phase 6 via le nouveau
--      générateur de simulations fictives (avec leur ancien slug pour
--      conserver les URLs)
--
-- À exécuter dans l'éditeur SQL Supabase une seule fois après merge
-- de la Phase 3 (idempotent : un re-run ne change rien si elles sont
-- déjà à false).
-- ============================================================

UPDATE projects
SET    published = false
WHERE  project_kind = 'simulation'
AND    slug IN ('boulangerie', 'boucherie', 'pizzeria', 'coiffure')
AND    published = true;  -- garde-fou idempotence
