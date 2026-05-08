-- ============================================================
-- Migration : table email_campaigns (templates d'emails de prospection)
-- À exécuter dans l'éditeur SQL Supabase
--
-- ⚠️ Avant d'appliquer : remplace 'REMPLACER_PAR_VOTRE_UUID_ADMIN'
-- par le vrai UUID admin (le même que dans rls_admin_uuid.sql).
--
-- Réutilise la fonction set_updated_at() définie dans schema.sql.
--
-- Une campagne = 1 template avec 2 variantes (sans-site / avec-site).
-- À l'envoi, on choisit la variante selon le scoring web du prospect
-- (cf. lib/web-variant/, partagé avec le générateur d'affiche A4).
--
-- V1 artisanale : 1 seule campagne par défaut (`is_default = true`).
-- L'index unique partiel garantit qu'au plus 1 campagne défaut existe.
-- ============================================================

CREATE TABLE IF NOT EXISTS email_campaigns (
  id                                uuid          PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at                        timestamptz   NOT NULL DEFAULT now(),
  updated_at                        timestamptz   NOT NULL DEFAULT now(),

  name                              text          NOT NULL,

  -- ── Variante "sans-site" (prospect sans site web) ────────────
  variant_sans_site_subject         text          NOT NULL,
  variant_sans_site_body_html       text          NOT NULL,
  variant_sans_site_body_text       text          NOT NULL,

  -- ── Variante "avec-site" (prospect avec site existant) ───────
  variant_avec_site_subject         text          NOT NULL,
  variant_avec_site_body_html       text          NOT NULL,
  variant_avec_site_body_text       text          NOT NULL,

  is_default                        boolean       NOT NULL DEFAULT false,

  CONSTRAINT email_campaigns_name_length_check
    CHECK (char_length(name) BETWEEN 1 AND 200)
);

-- ── Trigger updated_at ─────────────────────────────────────────

CREATE TRIGGER email_campaigns_set_updated_at
  BEFORE UPDATE ON email_campaigns
  FOR EACH ROW
  EXECUTE FUNCTION set_updated_at();

-- ── Index ──────────────────────────────────────────────────────

-- Au plus une campagne par défaut active à un instant T.
CREATE UNIQUE INDEX IF NOT EXISTS email_campaigns_default_unique_idx
  ON email_campaigns ((true))
  WHERE is_default = true;

-- ── Row Level Security ─────────────────────────────────────────

ALTER TABLE email_campaigns ENABLE ROW LEVEL SECURITY;

-- Admin uniquement, lecture/écriture.
CREATE POLICY "admin_all_email_campaigns"
  ON email_campaigns
  FOR ALL
  USING (auth.uid() = 'REMPLACER_PAR_VOTRE_UUID_ADMIN'::uuid);
