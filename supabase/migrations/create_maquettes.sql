-- ============================================================
-- Migration : création de la table maquettes (générateur de maquettes)
-- À exécuter dans l'éditeur SQL Supabase
--
-- ⚠️ Avant d'appliquer : remplace 'REMPLACER_PAR_VOTRE_UUID_ADMIN'
-- par le vrai UUID admin (le même que dans rls_admin_uuid.sql).
--
-- Réutilise la fonction set_updated_at() définie dans schema.sql.
-- ============================================================

-- ── Table maquettes ────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS maquettes (
  id                       uuid          PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at               timestamptz   NOT NULL DEFAULT now(),
  updated_at               timestamptz   NOT NULL DEFAULT now(),

  prospect_id              uuid          NOT NULL REFERENCES prospects(id) ON DELETE CASCADE,

  -- Slug : pilote l'URL publique /demos/[slug] et est utilisé pour
  -- générer les QR codes des affiches A4 distribuées en visite terrain.
  -- ⚠️ STABILITÉ : le slug est généré UNE SEULE FOIS à la création de la
  -- maquette (à partir de prospects.nom_commerce, déduplication via
  -- suffixe -2, -3...). Il NE DOIT PAS être recalculé si le nom du
  -- prospect change ensuite — sinon les URLs distribuées et les QR
  -- codes imprimés seraient cassés. Toute modification du slug doit
  -- être un acte explicite de l'admin via l'éditeur de maquette
  -- (section "Avancé"), avec confirmation de la rupture des liens.
  -- Aucun trigger ne synchronise prospects.nom_commerce → maquettes.slug.
  slug                     text          NOT NULL,
  template_variant         text          NOT NULL,
  published                boolean       NOT NULL DEFAULT false,
  published_at             timestamptz,

  -- ── Contenu textuel ───────────────────────────────────────────
  hero_eyebrow             text,
  hero_title               text,
  hero_lead                text,
  hero_quote               text,
  hero_quote_author        text,
  histoire_title           text,
  histoire_lead            text,
  texte_presentation       text,
  annee_creation           int,
  cta_banner_title         text,
  cta_banner_text          text,

  -- ── Personnalisation visuelle ─────────────────────────────────
  logo_url                 text,
  logo_initial             text,
  palette_mode             text          NOT NULL DEFAULT 'category',
  palette_primary          text,
  palette_accent           text,

  -- ── Photos ────────────────────────────────────────────────────
  -- hero/histoire : soit une URL bucket (upload manuel), soit une
  -- ref Google "places/X/photos/Y" — distinguées par le préfixe
  -- "places/" côté code.
  hero_photo_url           text,
  histoire_photo_url       text,
  univers_photos_urls      jsonb,

  -- ── Univers + Valeurs ─────────────────────────────────────────
  univers_items            jsonb,
  valeurs_items            jsonb,

  -- ── Avis sélectionnés / édités ────────────────────────────────
  -- Snapshot des avis affichés dans la section "Avis" de la maquette.
  -- Format : [{author, rating, text, date, edited}, ...].
  -- Indépendant de prospects.google_reviews pour permettre l'édition
  -- manuelle d'un avis sans casser la source Google.
  avis_items               jsonb,

  -- ── Contraintes ───────────────────────────────────────────────
  CONSTRAINT maquettes_slug_format_check CHECK (slug ~ '^[a-z0-9-]+$'),
  CONSTRAINT maquettes_slug_length_check CHECK (char_length(slug) BETWEEN 1 AND 80),

  CONSTRAINT maquettes_template_variant_check CHECK (template_variant IN (
    'boulangerie','boucherie','restaurant','pizzeria'
  )),

  CONSTRAINT maquettes_palette_mode_check CHECK (palette_mode IN (
    'category','extracted','custom'
  )),

  -- Format hex strict #RRGGBB (rejette #RGB pour cohérence et sécurité)
  CONSTRAINT maquettes_palette_primary_check
    CHECK (palette_primary IS NULL OR palette_primary ~ '^#[0-9A-Fa-f]{6}$'),
  CONSTRAINT maquettes_palette_accent_check
    CHECK (palette_accent IS NULL OR palette_accent ~ '^#[0-9A-Fa-f]{6}$'),

  CONSTRAINT maquettes_annee_creation_check
    CHECK (annee_creation IS NULL OR (annee_creation BETWEEN 1800 AND 2100)),

  -- Cohérence published / published_at
  CONSTRAINT maquettes_published_at_check
    CHECK ((published = false) OR (published = true AND published_at IS NOT NULL))
);

-- ── Trigger updated_at ─────────────────────────────────────────

CREATE TRIGGER maquettes_set_updated_at
  BEFORE UPDATE ON maquettes
  FOR EACH ROW
  EXECUTE FUNCTION set_updated_at();

-- ── Index ──────────────────────────────────────────────────────

-- Index unique global sur le slug : pilote l'URL publique /demos/[slug].
CREATE UNIQUE INDEX IF NOT EXISTS maquettes_slug_unique_idx ON maquettes (slug);

-- Index unique sur prospect_id : une seule maquette par prospect (V1).
-- Si tu veux plusieurs maquettes par prospect plus tard, retire l'UNIQUE.
CREATE UNIQUE INDEX IF NOT EXISTS maquettes_prospect_id_unique_idx ON maquettes (prospect_id);

-- Index pour les requêtes de la route publique /demos/[slug] :
-- WHERE slug = $1 AND published = true.
CREATE INDEX IF NOT EXISTS maquettes_published_slug_idx
  ON maquettes (slug)
  WHERE published = true;

-- ── Liaison côté prospects ─────────────────────────────────────

ALTER TABLE prospects
  ADD COLUMN IF NOT EXISTS maquette_id  uuid REFERENCES maquettes(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS maquette_url text;

CREATE INDEX IF NOT EXISTS prospects_maquette_id_idx ON prospects (maquette_id);

-- ── Row Level Security ─────────────────────────────────────────

ALTER TABLE maquettes ENABLE ROW LEVEL SECURITY;

-- Lecture publique des maquettes publiées (route /demos/[slug])
CREATE POLICY "public_read_published_maquettes"
  ON maquettes
  FOR SELECT
  USING (published = true);

-- Admin : accès complet
CREATE POLICY "admin_all_maquettes"
  ON maquettes
  FOR ALL
  USING (auth.uid() = 'REMPLACER_PAR_VOTRE_UUID_ADMIN'::uuid);
