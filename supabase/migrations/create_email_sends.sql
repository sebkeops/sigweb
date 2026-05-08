-- ============================================================
-- Migration : table email_sends (historique des envois Resend)
-- À exécuter dans l'éditeur SQL Supabase
--
-- ⚠️ Avant d'appliquer : remplace 'REMPLACER_PAR_VOTRE_UUID_ADMIN'
-- par le vrai UUID admin (le même que dans rls_admin_uuid.sql).
--
-- Une ligne = un email envoyé (ou en cours d'envoi). On y écrit le
-- contenu final (sujet + body) après substitution des variables, pour
-- garder une trace exacte de ce qui a été envoyé même si le template
-- de la campagne est modifié plus tard.
--
-- Le statut suit la cascade Resend :
--   pending → sent → delivered → opened → clicked
--                  ↘ bounced / complained
-- ============================================================

CREATE TABLE IF NOT EXISTS email_sends (
  id                       uuid          PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at               timestamptz   NOT NULL DEFAULT now(),

  prospect_id              uuid          NOT NULL REFERENCES prospects(id)        ON DELETE CASCADE,
  campaign_id              uuid                   REFERENCES email_campaigns(id)  ON DELETE SET NULL,

  variant                  text          NOT NULL,

  to_email                 text          NOT NULL,
  from_email               text          NOT NULL,
  subject                  text          NOT NULL,
  body_html                text          NOT NULL,
  body_text                text          NOT NULL,

  -- URL de l'image preview de la maquette (Supabase Storage), nullable
  -- si génération échouée → l'email est parti avec le placeholder fallback.
  preview_image_url        text,
  -- Snapshot de l'URL de la maquette au moment de l'envoi (`prospect.maquette_url`
  -- + `?source=email`). Permet de retracer où pointait le QR/lien même si la
  -- maquette est dépubliée plus tard.
  maquette_url             text,

  -- ID Resend pour le tracking (nullable jusqu'à la confirmation de l'envoi).
  resend_id                text,

  status                   text          NOT NULL DEFAULT 'pending',

  -- ── Timeline détaillée ──────────────────────────────────────
  sent_at                  timestamptz,
  delivered_at             timestamptz,
  first_opened_at          timestamptz,
  last_opened_at           timestamptz,
  open_count               int           NOT NULL DEFAULT 0,
  first_clicked_at         timestamptz,
  click_count              int           NOT NULL DEFAULT 0,
  bounced_at               timestamptz,
  bounce_reason            text,
  unsubscribed_at          timestamptz,

  CONSTRAINT email_sends_variant_check
    CHECK (variant IN ('sans-site', 'avec-site')),

  CONSTRAINT email_sends_status_check
    CHECK (status IN ('pending', 'sent', 'delivered', 'opened', 'clicked', 'bounced', 'complained')),

  -- L'email destinataire doit ressembler à un email (validation minimale,
  -- la vraie validation est côté Zod côté server action).
  CONSTRAINT email_sends_to_email_format_check
    CHECK (to_email ~ '^[^@\s]+@[^@\s]+\.[^@\s]+$')
);

-- ── Index ──────────────────────────────────────────────────────

-- Historique d'un prospect, ordonné chronologiquement.
CREATE INDEX IF NOT EXISTS email_sends_prospect_created_idx
  ON email_sends (prospect_id, created_at DESC);

-- Lookup webhook : Resend nous push avec son ID, on doit retrouver l'envoi.
CREATE INDEX IF NOT EXISTS email_sends_resend_id_idx
  ON email_sends (resend_id)
  WHERE resend_id IS NOT NULL;

-- Filtres par statut (ex: dashboard "envois en bounce").
CREATE INDEX IF NOT EXISTS email_sends_status_idx
  ON email_sends (status);

-- ── Row Level Security ─────────────────────────────────────────

ALTER TABLE email_sends ENABLE ROW LEVEL SECURITY;

-- Admin uniquement, lecture/écriture.
CREATE POLICY "admin_all_email_sends"
  ON email_sends
  FOR ALL
  USING (auth.uid() = 'REMPLACER_PAR_VOTRE_UUID_ADMIN'::uuid);
