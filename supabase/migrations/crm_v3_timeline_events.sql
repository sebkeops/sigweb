-- ============================================================
-- Migration : pilotage commercial CRM v3 — Phase 2 (timeline events).
--
-- Cree la table `prospect_timeline_events` qui stocke les evenements
-- chronologiques rattaches a un prospect, EXCEPTE les evenements
-- email (deja captures finement par `email_sends` — colonnes
-- sent_at / delivered_at / first_opened_at / etc. — alimentees par
-- le webhook Resend). Le composant <Timeline> cote code fusionne les
-- 2 sources pour eviter la duplication (decision Option B validee).
--
-- Types d'events autorises dans cette table :
--
--   Phase 2 — uniquement :
--     - 'status_changed'    transition de statut prospect (manuelle ou
--                           automatique via progression email)
--
--   Phase 3 (a venir) :
--     - 'maquette_visited'  visite de /demos/{slug}
--
--   Phase 4 (a venir) :
--     - 'phone_call'        appel telephone (subtype : sans_reponse,
--                           parle, message_vocal)
--     - 'affiche_deposited' affiche A4 deposee en physique
--     - 'terrain_visit'     visite terrain
--     - 'dm_sent'           DM Facebook/Instagram envoye
--     - 'meeting_scheduled' RDV programme
--     - 'note'              note libre de l'admin
--
-- Les events email (email_sent, email_opened, email_clicked, etc.)
-- ne sont **PAS** stockes ici — ils sont derives a la volee de
-- `email_sends` par l'aggregator cote code.
--
-- Idempotent : CREATE TABLE / INDEX / POLICY avec IF NOT EXISTS.
-- ============================================================

CREATE TABLE IF NOT EXISTS prospect_timeline_events (
  id                    uuid          PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at            timestamptz   NOT NULL DEFAULT now(),

  prospect_id           uuid          NOT NULL REFERENCES prospects(id) ON DELETE CASCADE,

  -- Discriminant du type d'event. La CHECK constraint inclut les types
  -- prevus pour les Phases 3 et 4 pour eviter d'avoir a la modifier
  -- a chaque etape (et risquer une regression).
  event_type            text          NOT NULL,

  -- Sous-type optionnel (ex: 'sans_reponse' / 'parle' / 'message_vocal'
  -- pour phone_call). Vide pour les types qui n'en ont pas besoin.
  event_subtype         text,

  -- Provenance : 'automatic' (declenche par le systeme, ex: progression
  -- de statut sur envoi d'email) ou 'manual' (admin a saisi/declenche
  -- l'event).
  source                text          NOT NULL,

  -- Date a laquelle l'event s'est PRODUIT. Peut etre passe (ex: admin
  -- saisit un appel d'hier). Distinct de `created_at` (date d'insertion
  -- de la ligne).
  occurred_at           timestamptz   NOT NULL DEFAULT now(),

  -- Donnees structurees specifiques au type. Pour status_changed :
  -- { from: 'qualifie', to: 'contacte' }. Pour phone_call (Phase 4) :
  -- { resultat: 'parle', duree_min: 15 }. Etc.
  metadata              jsonb,

  -- Note libre additionnelle de l'admin sur cet event.
  notes                 text,

  -- Tracabilite — admin qui a cree l'event (auth.users.id). Nullable
  -- pour les events automatiques crees par le systeme. Pas de FK pour
  -- ne pas casser si un compte admin est supprime un jour.
  created_by_user_id    uuid,

  -- Flag test : si le prospect ou le contexte est en mode test, ne
  -- doit pas polluer les KPIs dashboard (Phase 6). Aligne sur
  -- `prospects.is_test` (Phase 1).
  is_test               boolean       NOT NULL DEFAULT false,

  -- ── Contraintes ──
  CONSTRAINT prospect_timeline_events_event_type_check
    CHECK (event_type IN (
      -- Phase 2
      'status_changed',
      -- Phase 3
      'maquette_visited',
      -- Phase 4
      'phone_call', 'affiche_deposited', 'terrain_visit',
      'dm_sent', 'meeting_scheduled', 'note'
    )),

  CONSTRAINT prospect_timeline_events_source_check
    CHECK (source IN ('automatic', 'manual'))
);

-- ── Index ──

-- Requete principale : la timeline d'un prospect.
CREATE INDEX IF NOT EXISTS prospect_timeline_events_prospect_occurred_idx
  ON prospect_timeline_events (prospect_id, occurred_at DESC);

-- Pour les filtres par type d'event (cote client, evite un full scan
-- si le dashboard Phase 6 fait des stats par type).
CREATE INDEX IF NOT EXISTS prospect_timeline_events_event_type_idx
  ON prospect_timeline_events (event_type);

-- ── RLS ──
-- Aligne sur le pattern des autres tables admin (email_sends, maquettes) :
-- l'admin authentifie a accès complet, personne d'autre.

ALTER TABLE prospect_timeline_events ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'prospect_timeline_events'
      AND policyname = 'admin_all_prospect_timeline_events'
  ) THEN
    CREATE POLICY "admin_all_prospect_timeline_events"
      ON prospect_timeline_events
      AS PERMISSIVE
      FOR ALL
      TO authenticated
      USING (true)
      WITH CHECK (true);
  END IF;
END $$;
