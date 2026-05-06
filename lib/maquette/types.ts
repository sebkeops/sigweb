import type {
  MaquetteAvisItem,
  MaquettePhotoAssignment,
  MaquettePhotoEntry,
  MaquetteTemplateVariant,
  MaquetteUniversItem,
  MaquetteValeurItem,
} from '@/types'

/**
 * Palette d'un template, format hex strict #RRGGBB.
 * Les neutres (cream, ink) sont communs au système et garantissent la
 * lisibilité — seuls `primary` et `accent` peuvent être surchargés
 * par une palette extraite ou personnalisée.
 */
export interface TemplatePalette {
  cream: string
  creamLight: string
  creamWarm: string
  ink: string
  inkSoft: string
  inkMuted: string
  primary: string
  primarySoft: string
  accent: string
  accentLight: string
}

/**
 * Textes par défaut d'un template. Les chaînes peuvent contenir des
 * marqueurs `*mot*` pour signaler les passages à mettre en italique
 * dans le rendu HTML (cf. parseItalicMarkers en Session 2).
 *
 * `heroEyebrow(city)` est une fonction car la ville varie par prospect.
 */
export interface TemplateDefaults {
  heroEyebrow: (city: string | null) => string
  heroTitle: string
  heroLead: string
  heroQuote: string
  heroQuoteAuthor: string
  histoireTitle: string
  histoireLead: string
  textePresentation: string
  universSectionTitle: string
  universSectionIntro: string
  ctaBannerTitle: string
  ctaBannerText: string
  /** Tagline sous le nom dans le brand (header), ex: "Boulangerie · Pâtisserie". */
  brandTagline: string
}

export interface TemplateConfig {
  variant: MaquetteTemplateVariant
  palette: TemplatePalette
  defaults: TemplateDefaults
  universItems: MaquetteUniversItem[]
  valeursItems: MaquetteValeurItem[]
}

/**
 * Données de maquette telles que retournées par `generateInitialMaquette`,
 * prêtes à être insérées en BDD (champs alignés sur la table `maquettes`).
 *
 * Le slug n'en fait PAS partie : sa génération nécessite un round-trip
 * BDD pour la déduplication, qui se fait dans la server action.
 *
 * `avis_items` reste null à la génération initiale : la sélection des
 * 3 avis se fait manuellement en Session 4 (Éditeur avancé).
 */
export interface MaquetteInitialData {
  prospect_id: string
  template_variant: MaquetteTemplateVariant

  hero_eyebrow: string
  hero_title: string
  hero_lead: string
  hero_quote: string
  hero_quote_author: string
  histoire_title: string
  histoire_lead: string
  texte_presentation: string
  annee_creation: number | null
  cta_banner_title: string
  cta_banner_text: string

  logo_url: null
  logo_initial: string
  palette_mode: 'category'
  palette_primary: null
  palette_accent: null

  /**
   * @deprecated Anciens champs photos — conservés pendant la transition
   * vers le nouveau modèle pool + assignations. Cf. CLEANUP-TODO.md.
   * `generateInitialMaquette` les remplit en parallèle de `available_photos`
   * et `photo_assignments` pour ne casser ni la page publique pré-3.1, ni
   * un éventuel rollback.
   */
  hero_photo_url: string | null
  /** @deprecated Cf. CLEANUP-TODO.md. */
  histoire_photo_url: string | null
  /** @deprecated Cf. CLEANUP-TODO.md. */
  univers_photos_urls: string[] | null

  available_photos: MaquettePhotoEntry[]
  photo_assignments: MaquettePhotoAssignment[]

  univers_items: MaquetteUniversItem[]
  valeurs_items: MaquetteValeurItem[]
  avis_items: MaquetteAvisItem[] | null
}
