-- ============================================================
-- Migration : pilotage commercial CRM v3 — Phase 3 (tracking visites
-- maquette).
--
-- Cree la table `maquette_visits` qui stocke chaque consultation de
-- `/demos/{slug}` (page maquette publique d'un prospect). Approche
-- RGPD-friendly :
--   - aucun cookie pose
--   - IP hashee + tronquee (16 chars) pour distinguer les visiteurs
--     uniques sans pouvoir les identifier
--   - user agent reduit a 'mobile' | 'desktop' | 'tablet' (pas le UA
--     brut, qui est un quasi-identifiant)
--   - duree mesuree cote client via Beacon API + fetch keepalive
--     fallback (envoye a `pagehide`)
--
-- Sert a :
--   1. Mesurer l'engagement reel par prospect (cf. Module 3 du brief
--      CRM v3 : timeline + encadre 'Maquette consultee' sur la fiche)
--   2. Distinguer la source du trafic (affiche A4 vs email vs autre)
--   3. Alimenter le futur dashboard (Phase 6) avec un KPI 'maquettes
--      visitees uniques'
--
-- Idempotent : CREATE TABLE / INDEX / POLICY avec IF NOT EXISTS.
-- ============================================================

CREATE TABLE IF NOT EXISTS maquette_visits (
  id                    uuid          PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at            timestamptz   NOT NULL DEFAULT now(),

  -- Slug de la maquette consultee. Pas de FK vers `maquettes(slug)` :
  --   1. Une maquette peut etre depubliee/supprimee — on garde la
  --      trace de la visite
  --   2. Permet de tracker des visites avant qu'une maquette existe
  --      (cas marginal mais possible)
  slug                  text          NOT NULL,

  -- Prospect lie via `maquettes.slug → maquettes.prospect_id` au moment
  -- de la visite. NULL si :
  --   - la maquette est orpheline (cas pathologique)
  --   - la maquette n'existe pas (visite d'un slug invalide)
  --   - le prospect a ete supprime apres la visite (cascade SET NULL)
  -- Les visites orphelines sont ignorees du calcul des stats par
  -- prospect mais conservees pour les stats globales du dashboard.
  prospect_id           uuid          REFERENCES prospects(id) ON DELETE SET NULL,

  -- Source du trafic, derivee du parametre `?src=...` dans l'URL :
  --   'affiche' : QR code de l'affiche A4 deposee en physique
  --   'email'   : lien dans l'email Resend envoye au prospect
  --   'carte'   : QR de la carte de visite (parametre present mais
  --               cible /simulations, pas /demos — capture preventive
  --               si quelqu'un construit un lien `?src=carte` vers
  --               une maquette specifique)
  --   'direct'  : aucun `?src` ou pas de referrer → trafic direct
  --   'other'   : `?src` present avec une valeur non whitelistee →
  --               aucune erreur cote serveur, mais on normalise
  source                text          NOT NULL DEFAULT 'direct',

  -- Hash SHA256 tronque a 16 chars hexa (= 64 bits d'entropie). Permet
  -- de detecter les rafraichissements d'un meme visiteur sur une
  -- fenetre courte (cf. fenetre UPSERT 30min cote code) sans stocker
  -- d'identifiant personnel. NB : les VPN/CGNAT peuvent regrouper
  -- plusieurs visiteurs sous un meme hash — limite acceptee.
  ip_hash               text          NOT NULL,

  -- Resume du user agent : 'mobile' / 'desktop' / 'tablet'. On NE
  -- conserve PAS le UA brut (quasi-identifiant pour le fingerprinting).
  user_agent_summary    text,

  -- Duree de consultation en secondes, envoyee a `pagehide` cote
  -- client via Beacon API ou fetch keepalive. NULL si le client a
  -- ferme l'onglet brutalement avant que le PATCH parte (rare).
  duration_seconds      integer,

  -- Referrer HTTP (header Referer). Aide a confirmer la source quand
  -- `?src` est absent. Tronque a 500 chars pour eviter les abus.
  referrer              text,

  -- Flag de test, mis a `true` si la visite vient d'une session admin
  -- authentifiee (cookie Supabase Auth detecte cote route handler).
  -- Permet a Sebastien de tester ses maquettes sans polluer les KPIs.
  is_test               boolean       NOT NULL DEFAULT false,

  -- ── Contraintes ──

  CONSTRAINT maquette_visits_source_check
    CHECK (source IN ('affiche', 'email', 'carte', 'direct', 'other')),

  CONSTRAINT maquette_visits_user_agent_summary_check
    CHECK (user_agent_summary IS NULL OR user_agent_summary IN ('mobile', 'desktop', 'tablet')),

  CONSTRAINT maquette_visits_duration_check
    CHECK (duration_seconds IS NULL OR duration_seconds >= 0)
);

-- ── Index ──

-- Requete principale : "toutes les visites d'un slug, recentes en
-- premier". Sert au calcul des stats par maquette et au dashboard.
CREATE INDEX IF NOT EXISTS maquette_visits_slug_created_idx
  ON maquette_visits (slug, created_at DESC);

-- Requete fiche prospect : "toutes les visites de ce prospect". Index
-- partiel pour ne pas indexer les visites orphelines (prospect_id NULL).
CREATE INDEX IF NOT EXISTS maquette_visits_prospect_idx
  ON maquette_visits (prospect_id, created_at DESC)
  WHERE prospect_id IS NOT NULL;

-- Index sur ip_hash + slug + created_at pour la fenetre de dedup
-- 30min (UPSERT cote code timeline) : "ce hash a-t-il visite cette
-- maquette dans les 30 dernieres minutes ?".
CREATE INDEX IF NOT EXISTS maquette_visits_ip_slug_recent_idx
  ON maquette_visits (ip_hash, slug, created_at DESC);

-- ── RLS ──
-- L'API d'insertion (route handler /api/maquettes/tracking) utilise
-- le service_role pour bypass RLS. Cote lecture, seul l'admin a
-- besoin d'acceder aux visites (pour la fiche prospect + dashboard).
-- Aligne sur le pattern des autres tables admin.

ALTER TABLE maquette_visits ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'maquette_visits'
      AND policyname = 'admin_all_maquette_visits'
  ) THEN
    CREATE POLICY "admin_all_maquette_visits"
      ON maquette_visits
      AS PERMISSIVE
      FOR ALL
      TO authenticated
      USING (true)
      WITH CHECK (true);
  END IF;
END $$;
