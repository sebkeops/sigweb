-- ============================================================
-- Migration : création de la table prospects (CRM MVP)
-- À exécuter dans l'éditeur SQL Supabase
--
-- ⚠️ Avant d'appliquer : remplace 'REMPLACER_PAR_VOTRE_UUID_ADMIN'
-- par le vrai UUID admin (le même que dans rls_admin_uuid.sql).
-- ============================================================

-- ── Table prospects ─────────────────────────────────────────

CREATE TABLE IF NOT EXISTS prospects (
  id                    uuid          PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at            timestamptz   NOT NULL DEFAULT now(),
  updated_at            timestamptz   NOT NULL DEFAULT now(),

  nom_commerce          text          NOT NULL,
  categorie             text          NOT NULL,
  adresse               text,
  ville                 text,
  code_postal           text,
  distance_km           numeric(5,1),

  telephone             text,
  email                 text,
  site_existant_url     text,
  instagram_url         text,
  facebook_url          text,

  score                 int,
  canal                 text          NOT NULL DEFAULT 'a_definir',
  statut                text          NOT NULL DEFAULT 'a_qualifier',

  notes                 text,
  date_dernier_contact  date,
  date_relance_prevue   date,

  CONSTRAINT prospects_categorie_check CHECK (categorie IN (
    'boulangerie','boucherie','restaurant','pizzeria','primeur','fromager',
    'caviste','coiffeur','esthetique','kine','cabinet','menuisier','plombier',
    'electricien','peintre','paysagiste','photographe','autre'
  )),

  CONSTRAINT prospects_canal_check CHECK (canal IN (
    'a_definir','terrain','email','reseaux','telephone','ecarte'
  )),

  CONSTRAINT prospects_statut_check CHECK (statut IN (
    'a_qualifier','qualifie','contacte','relance_1','relance_2','relance_3',
    'repondu','rdv_pris','devis_envoye','signe','perdu','ecarte'
  )),

  CONSTRAINT prospects_score_check CHECK (score IS NULL OR (score >= 1 AND score <= 10))
);

-- ── Trigger updated_at ───────────────────────────────────────
-- Réutilise la fonction set_updated_at() définie dans schema.sql

CREATE TRIGGER prospects_set_updated_at
  BEFORE UPDATE ON prospects
  FOR EACH ROW
  EXECUTE FUNCTION set_updated_at();

-- ── Index ────────────────────────────────────────────────────

CREATE INDEX IF NOT EXISTS prospects_created_at_idx ON prospects (created_at DESC);
CREATE INDEX IF NOT EXISTS prospects_statut_idx     ON prospects (statut);
CREATE INDEX IF NOT EXISTS prospects_canal_idx      ON prospects (canal);
CREATE INDEX IF NOT EXISTS prospects_categorie_idx  ON prospects (categorie);

-- ── Row Level Security ──────────────────────────────────────

ALTER TABLE prospects ENABLE ROW LEVEL SECURITY;

-- Admin uniquement : accès complet
CREATE POLICY "admin_all_prospects"
  ON prospects
  FOR ALL
  USING (auth.uid() = 'REMPLACER_PAR_VOTRE_UUID_ADMIN'::uuid);
