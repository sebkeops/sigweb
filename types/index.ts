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
}
