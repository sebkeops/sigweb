import 'server-only'

import type {
  GoogleBusinessStatus,
  GoogleOpeningHours,
  GoogleReviewItem,
  ProspectCategorie,
} from '@/types'
import {
  fetchPlacesApi,
  GooglePlacesError,
  PLACE_FIELDS_DETAILS,
  PLACE_FIELDS_SEARCH,
} from './client'
import { distanceFromBase } from './haversine'
import {
  type AddressComponent,
  extractCity,
  extractPhotoRefs,
  extractPostalCode,
  formatAuthorName,
  getAuthorInitial,
  mapGoogleTypeToCategorie,
} from './mapping'
import { resolveAndParseMapsUrl } from './urls'

export { GooglePlacesError } from './client'
export type { GooglePlacesErrorCode } from './client'
export { buildPhotoUrl } from './photos'
export { searchNearby, searchNearbyMulti } from './nearby'
export type { NearbyHit } from './nearby'
export {
  categorieToGoogleTypes,
  formatAuthorName,
  getAuthorInitial,
  sourceableCategories,
} from './mapping'

// ── Types Google bruts (extrait du field mask) ──────────────────────────

interface RawReview {
  name?: string
  rating?: number
  text?: { text?: string; languageCode?: string }
  originalText?: { text?: string; languageCode?: string }
  authorAttribution?: { displayName?: string; uri?: string; photoUri?: string }
  publishTime?: string
  relativePublishTimeDescription?: string
}

interface RawPlace {
  id: string
  displayName?: { text?: string; languageCode?: string }
  formattedAddress?: string
  addressComponents?: AddressComponent[]
  location?: { latitude?: number; longitude?: number }
  types?: string[]
  primaryType?: string
  primaryTypeDisplayName?: { text?: string; languageCode?: string }
  businessStatus?: string
  rating?: number
  userRatingCount?: number
  regularOpeningHours?: GoogleOpeningHours
  internationalPhoneNumber?: string
  nationalPhoneNumber?: string
  websiteUri?: string
  googleMapsUri?: string
  photos?: { name?: string }[]
  reviews?: RawReview[]
}

interface SearchResponse {
  places?: RawPlace[]
}

// ── Type normalisé exposé au reste de l'app ────────────────────────────

export interface EnrichedPlaceData {
  placeId: string
  name: string
  formattedAddress: string | null
  city: string | null
  postalCode: string | null
  phoneNumber: string | null
  website: string | null
  rating: number | null
  userRatingCount: number | null
  businessStatus: GoogleBusinessStatus | null
  types: string[]
  /** Libellé localisé du type principal (ex: "Magasin de nouveautés"). */
  primaryTypeDisplay: string | null
  openingHours: GoogleOpeningHours | null
  photoRefs: string[]
  googleMapsUrl: string | null
  latitude: number | null
  longitude: number | null
  distanceKm: number | null
  suggestedCategorie: ProspectCategorie
  /**
   * Avis détaillés Google (max 5, pas de pagination côté API).
   * Le nom d'auteur est déjà tronqué via `formatAuthorName` (Prénom + Initiale.).
   * Vide si aucun avis n'est disponible (commerce récent, jamais évalué…).
   */
  reviews: GoogleReviewItem[]
}

function normalizeReview(raw: RawReview): GoogleReviewItem | null {
  if (!raw.name || typeof raw.rating !== 'number') return null

  // Filtre V1 : on jette les avis sans texte exploitable. Un "5 étoiles
  // sans commentaire" n'a aucune valeur visuelle dans la section avis.
  // Si l'API renvoie peu d'avis avec texte, l'UI gérera l'affichage
  // dégradé (ex: bandeau noté sans cartes).
  const rawText = raw.text?.text ?? raw.originalText?.text ?? ''
  const text = rawText.trim()
  if (text.length === 0) return null

  const displayName = raw.authorAttribution?.displayName ?? ''
  return {
    name: raw.name,
    rating: Math.max(1, Math.min(5, Math.round(raw.rating))),
    text,
    author_name: formatAuthorName(displayName),
    author_initial: getAuthorInitial(displayName),
    publish_time: raw.publishTime ?? null,
  }
}

function normalizeReviews(reviews: RawReview[] | undefined): GoogleReviewItem[] {
  if (!reviews) return []
  return reviews
    .map(normalizeReview)
    .filter((r): r is GoogleReviewItem => r !== null)
    .slice(0, 5)
}

function normalizeBusinessStatus(s: string | undefined): GoogleBusinessStatus | null {
  if (s === 'OPERATIONAL' || s === 'CLOSED_TEMPORARILY' || s === 'CLOSED_PERMANENTLY') return s
  return null
}

function normalizePlace(raw: RawPlace): EnrichedPlaceData {
  const lat = raw.location?.latitude ?? null
  const lon = raw.location?.longitude ?? null
  return {
    placeId: raw.id,
    name: raw.displayName?.text ?? '(sans nom)',
    formattedAddress: raw.formattedAddress ?? null,
    city: extractCity(raw.addressComponents),
    postalCode: extractPostalCode(raw.addressComponents),
    phoneNumber: raw.nationalPhoneNumber ?? raw.internationalPhoneNumber ?? null,
    website: raw.websiteUri ?? null,
    rating: typeof raw.rating === 'number' ? raw.rating : null,
    userRatingCount: typeof raw.userRatingCount === 'number' ? raw.userRatingCount : null,
    businessStatus: normalizeBusinessStatus(raw.businessStatus),
    types: raw.types ?? [],
    primaryTypeDisplay: raw.primaryTypeDisplayName?.text ?? null,
    openingHours: raw.regularOpeningHours ?? null,
    photoRefs: extractPhotoRefs(raw.photos),
    googleMapsUrl: raw.googleMapsUri ?? null,
    latitude: lat,
    longitude: lon,
    distanceKm: lat != null && lon != null ? distanceFromBase(lat, lon) : null,
    suggestedCategorie: mapGoogleTypeToCategorie(raw.types),
    reviews: normalizeReviews(raw.reviews),
  }
}

// ── API publique ────────────────────────────────────────────────────────

export async function getPlaceDetails(placeId: string): Promise<EnrichedPlaceData> {
  if (!placeId || !/^[A-Za-z0-9_-]+$/.test(placeId)) {
    throw new GooglePlacesError('NOT_FOUND', 'Identifiant Google invalide.')
  }
  // languageCode=fr : sans ça, primaryTypeDisplayName revient en anglais
  // ("Store" au lieu de "Magasin"). regionCode=FR pour cohérence avec searchText.
  const raw = await fetchPlacesApi<RawPlace>(
    `/places/${placeId}?languageCode=fr&regionCode=FR`,
    {
      fieldMask: PLACE_FIELDS_DETAILS,
    }
  )
  if (!raw.id) throw new GooglePlacesError('NOT_FOUND', 'Lieu introuvable.')
  return normalizePlace(raw)
}

/**
 * Recherche Text Search Google Places. Renvoie jusqu'à `max` résultats.
 * Filtre régionalisé sur la France pour limiter les faux positifs.
 */
export async function searchPlaces(
  name: string,
  city: string | null,
  max = 3
): Promise<EnrichedPlaceData[]> {
  const query = [name, city].filter(Boolean).join(' ').trim()
  if (query.length < 2) {
    throw new GooglePlacesError('NOT_FOUND', 'Requête trop courte.')
  }
  const data = await fetchPlacesApi<SearchResponse>('/places:searchText', {
    method: 'POST',
    fieldMask: PLACE_FIELDS_SEARCH,
    body: {
      textQuery: query,
      regionCode: 'FR',
      languageCode: 'fr',
      maxResultCount: Math.min(Math.max(max, 1), 10),
    },
  })
  const places = data.places ?? []
  if (places.length === 0) throw new GooglePlacesError('NOT_FOUND', 'Aucun lieu trouvé.')
  return places.map(normalizePlace)
}

/** Renvoie le 1er résultat (le plus pertinent) ou null. */
export async function searchPlace(name: string, city: string | null): Promise<EnrichedPlaceData | null> {
  const list = await searchPlaces(name, city, 1).catch((e) => {
    if (e instanceof GooglePlacesError && e.code === 'NOT_FOUND') return []
    throw e
  })
  return list[0] ?? null
}

/**
 * Récupère un lieu depuis une URL Google Maps (courte ou longue).
 * Stratégie : extraire le nom du segment /place/<name>/, puis faire un
 * Text Search avec ce nom (et la ville si déductible). On ne se fie pas
 * aux place_id hex car ils ne sont pas compatibles avec l'API Places (New).
 */
export async function getPlaceFromUrl(url: string): Promise<EnrichedPlaceData> {
  const parsed = await resolveAndParseMapsUrl(url)
  if (parsed.placeName) {
    const result = await searchPlace(parsed.placeName, null)
    if (result) return result
  }
  // Fallback : si on n'a que des coordonnées, on n'a pas de moyen fiable
  // de retrouver le bon commerce → on renvoie INVALID_URL pour basculer
  // l'utilisateur sur la recherche par nom + ville.
  throw new GooglePlacesError(
    'INVALID_URL',
    'URL non reconnue. Essayez la recherche par nom + ville.'
  )
}
