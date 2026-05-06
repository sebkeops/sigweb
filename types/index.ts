export type ProjectKind = 'simulation' | 'realisation'

export interface SimulationFeaturedCard {
  title: string
  text: string
  image: string
}

export interface SimulationData {
  businessType: string
  theme: string
  name: string
  tagline: string
  description: string
  heroImage: string
  gallery: string[]
  contact: {
    address: string
    city: string
    phone: string
  }
  hours: string[]
  highlights: string[]
  featuredCards: SimulationFeaturedCard[]
  reviews: string[]
  seoTitle?: string
  seoDescription?: string
  intro?: string
}

export interface Project {
  id: string
  title: string
  slug: string
  business_type: string | null
  short_description: string | null
  content: string | null
  cover_image_url: string | null
  external_url: string | null
  project_kind: ProjectKind
  published: boolean
  featured_home: boolean
  created_at: string
  updated_at: string
}

export interface Contact {
  id: string
  name: string
  business_name: string | null
  email: string
  phone: string | null
  business_type: string | null
  message: string
  is_read: boolean
  created_at: string
}

export type ProspectCategorie =
  | 'boulangerie' | 'boucherie' | 'restaurant' | 'pizzeria' | 'primeur' | 'fromager'
  | 'caviste' | 'coiffeur' | 'esthetique' | 'kine' | 'cabinet' | 'menuisier'
  | 'plombier' | 'electricien' | 'peintre' | 'paysagiste' | 'photographe' | 'autre'

export type ProspectCanal =
  | 'a_definir' | 'terrain' | 'email' | 'reseaux' | 'telephone' | 'ecarte'

export type ProspectStatut =
  | 'a_qualifier' | 'qualifie' | 'contacte'
  | 'relance_1' | 'relance_2' | 'relance_3'
  | 'repondu' | 'rdv_pris' | 'devis_envoye'
  | 'signe' | 'perdu' | 'ecarte'

export type ProspectSource = 'manuel' | 'enrichissement' | 'sourcing'

export type GoogleBusinessStatus = 'OPERATIONAL' | 'CLOSED_TEMPORARILY' | 'CLOSED_PERMANENTLY'

export interface GoogleOpeningPeriod {
  open: { day: number; hour: number; minute: number }
  close?: { day: number; hour: number; minute: number }
}

export interface GoogleOpeningHours {
  weekdayDescriptions?: string[]
  periods?: GoogleOpeningPeriod[]
  openNow?: boolean
}

export interface Prospect {
  id: string
  created_at: string
  updated_at: string
  nom_commerce: string
  categorie: ProspectCategorie
  adresse: string | null
  ville: string | null
  code_postal: string | null
  distance_km: number | null
  telephone: string | null
  email: string | null
  site_existant_url: string | null
  instagram_url: string | null
  facebook_url: string | null
  score: number | null
  canal: ProspectCanal
  statut: ProspectStatut
  notes: string | null
  date_dernier_contact: string | null
  date_relance_prevue: string | null
  source: ProspectSource

  // Enrichissement Google Places
  google_place_id: string | null
  google_rating: number | null
  google_reviews_count: number | null
  google_business_status: GoogleBusinessStatus | null
  google_categories: string[] | null
  google_opening_hours: GoogleOpeningHours | null
  google_photo_refs: string[] | null
  google_maps_url: string | null
  google_primary_type_display: string | null
  latitude: number | null
  longitude: number | null
  last_enriched_at: string | null

  // Scoring automatique (grille v2)
  score_calcule: number | null
  score_proximite: number | null
  score_besoin_web: number | null
  score_activite: number | null
  score_malus: number | null
  score_override_manuel: number | null
  score_explanations: string[] | null
  score_calcule_at: string | null
  score_override_at: string | null

  // Avis Google détaillés (max 5, snapshot via enrichissement Places)
  google_reviews: GoogleReviewItem[] | null

  // Liaison maquette
  maquette_id: string | null
  maquette_url: string | null
}

// ─── Maquettes (générateur de maquettes ultra-personnalisées) ────────────────

export type MaquetteTemplateVariant = 'boulangerie' | 'boucherie' | 'restaurant' | 'pizzeria'

export type MaquettePaletteMode = 'category' | 'extracted' | 'custom'

/** Item d'une carte univers (5 par maquette). */
export interface MaquetteUniversItem {
  cat: string   // ex: "Spécialité maison"
  name: string  // ex: "Pains au levain"
  desc: string  // 1–2 lignes
}

/** Item d'une valeur (4 par maquette). */
export interface MaquetteValeurItem {
  title: string
  desc: string
}

/**
 * Avis affiché dans la maquette.
 * Snapshot autonome : permet l'édition manuelle d'un texte sans casser
 * la source `prospects.google_reviews`. `edited = true` flagge un override.
 */
export interface MaquetteAvisItem {
  author: string
  author_initial?: string
  rating: number       // 1..5
  text: string
  date: string | null  // ISO ou date FR brute, à formatter au render
  edited: boolean
}

/**
 * Avis Google brut, tel que stocké dans `prospects.google_reviews`.
 * Format aligné sur Google Places API v1 (champ `reviews`).
 *
 * Convention V1 : on ne persiste que les avis ayant un `text` non vide
 * (un avis "5 étoiles sans commentaire" est visuellement inutile dans
 * la maquette). Le filtrage est fait à la normalisation, pas au render.
 *
 * On NE STOCKE PAS la chaîne relative ("il y a 2 mois") : elle vieillit
 * mal en BDD. À la place, on garde `publish_time` (ISO immuable) et on
 * calcule la chaîne relative dynamiquement au render via `date-fns`.
 */
export interface GoogleReviewItem {
  name: string                    // "places/X/reviews/Y"
  rating: number                  // 1..5
  text: string                    // non vide (filtré à la normalisation)
  author_name: string
  author_initial: string | null
  publish_time: string | null     // ISO
}

// ─── Photos : nouveau modèle pool + assignations ────────────────────────────
//
// Modèle introduit en Session 3.0 pour supporter la gestion humaine des
// placements (drag & drop dans l'éditeur) + l'upload de photos personnelles.
// Remplace progressivement l'ancien trio `hero_photo_url` / `histoire_photo_url`
// / `univers_photos_urls`. Cf. CLEANUP-TODO.md.

export type MaquettePhotoSource = 'google' | 'upload'

/** Une photo dans le pool d'une maquette. */
export interface MaquettePhotoEntry {
  /** UUID local stable, sert au drag & drop et aux assignations. */
  id: string
  source: MaquettePhotoSource
  /**
   * Selon `source` :
   *   - 'google' : ref Places API (`places/X/photos/Y`)
   *   - 'upload' : URL absolue Supabase Storage (bucket `maquettes-assets`)
   */
  reference: string
  /** Légende optionnelle (édition future). */
  caption?: string
  /** ISO. Présent uniquement sur les photos uploadées (cf. brief 3.0). */
  uploaded_at?: string
}

export type MaquettePhotoSlot =
  | 'hero' | 'histoire'
  | 'univers_1' | 'univers_2' | 'univers_3' | 'univers_4' | 'univers_5'

/**
 * Assignation slot → photo.
 *
 * NOTE pour le drag & drop futur : la même `photo_id` PEUT légitimement
 * apparaître dans plusieurs assignations (cas d'une photo "signature" qu'on
 * veut afficher sur Hero ET Histoire, par exemple). À la migration legacy
 * en revanche, on désassigne les doublons (cf. `migrateLegacyPhotos`).
 */
export interface MaquettePhotoAssignment {
  slot: MaquettePhotoSlot
  photo_id: string | null
}

export interface Maquette {
  id: string
  created_at: string
  updated_at: string

  prospect_id: string
  slug: string
  template_variant: MaquetteTemplateVariant
  published: boolean
  published_at: string | null

  hero_eyebrow: string | null
  hero_title: string | null
  hero_lead: string | null
  hero_quote: string | null
  hero_quote_author: string | null
  histoire_title: string | null
  histoire_lead: string | null
  texte_presentation: string | null
  annee_creation: number | null
  cta_banner_title: string | null
  cta_banner_text: string | null

  logo_url: string | null
  logo_initial: string | null
  palette_mode: MaquettePaletteMode
  palette_primary: string | null
  palette_accent: string | null

  /** @deprecated Remplacé par available_photos + photo_assignments. Cf. CLEANUP-TODO.md. */
  hero_photo_url: string | null
  /** @deprecated Cf. CLEANUP-TODO.md. */
  histoire_photo_url: string | null
  /** @deprecated Cf. CLEANUP-TODO.md. */
  univers_photos_urls: string[] | null

  /** Pool de toutes les photos disponibles (Google + uploads). */
  available_photos: MaquettePhotoEntry[] | null
  /** Assignation slot → photo. 7 slots : hero, histoire, univers_1..5. */
  photo_assignments: MaquettePhotoAssignment[] | null

  univers_items: MaquetteUniversItem[] | null
  valeurs_items: MaquetteValeurItem[] | null
  avis_items: MaquetteAvisItem[] | null
}

export const MAQUETTE_PHOTO_SLOTS: readonly MaquettePhotoSlot[] = [
  'hero', 'histoire',
  'univers_1', 'univers_2', 'univers_3', 'univers_4', 'univers_5',
] as const
