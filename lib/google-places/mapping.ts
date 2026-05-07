import 'server-only'
import type { ProspectCategorie } from '@/types'

// Ordre de priorité : la première règle qui matche gagne.
const TYPE_RULES: { types: string[]; categorie: ProspectCategorie }[] = [
  { types: ['bakery'], categorie: 'boulangerie' },
  { types: ['butcher_shop'], categorie: 'boucherie' },
  { types: ['pizza_restaurant'], categorie: 'pizzeria' },
  { types: ['restaurant'], categorie: 'restaurant' },
  // `grocery_or_supermarket` retiré volontairement : ramène les chaînes de
  // grandes surfaces (Carrefour, Intermarché…) qui ne sont pas la cible Sigweb.
  // `produce_store` capture bien les vrais primeurs indépendants.
  { types: ['produce_store'], categorie: 'primeur' },
  { types: ['cheese_shop'], categorie: 'fromager' },
  { types: ['liquor_store', 'wine_store'], categorie: 'caviste' },
  { types: ['hair_salon', 'barber_shop'], categorie: 'coiffeur' },
  { types: ['beauty_salon'], categorie: 'esthetique' },
  { types: ['physiotherapist'], categorie: 'kine' },
  { types: ['doctor', 'dentist'], categorie: 'cabinet' },
  { types: ['general_contractor', 'roofing_contractor'], categorie: 'menuisier' },
  { types: ['plumber'], categorie: 'plombier' },
  { types: ['electrician'], categorie: 'electricien' },
  { types: ['painter'], categorie: 'peintre' },
  { types: ['landscaping'], categorie: 'paysagiste' },
  { types: ['photographer'], categorie: 'photographe' },
]

export function mapGoogleTypeToCategorie(types: string[] | undefined): ProspectCategorie {
  if (!types || types.length === 0) return 'autre'
  const set = new Set(types)
  for (const rule of TYPE_RULES) {
    if (rule.types.some((t) => set.has(t))) return rule.categorie
  }
  return 'autre'
}

/**
 * Mapping inverse : pour une catégorie CRM, renvoie la liste des `types`
 * Google qu'on doit interroger via Nearby Search pour la trouver.
 * `'autre'` renvoie `[]` — pas de sourcing possible pour cette catégorie.
 */
export function categorieToGoogleTypes(categorie: ProspectCategorie): string[] {
  for (const rule of TYPE_RULES) {
    if (rule.categorie === categorie) return [...rule.types]
  }
  return []
}

/** Liste des catégories CRM utilisables en sourcing (= ayant un mapping Google). */
export function sourceableCategories(): ProspectCategorie[] {
  return TYPE_RULES.map((r) => r.categorie)
}

export interface AddressComponent {
  longText?: string
  shortText?: string
  types?: string[]
}

export function extractCity(components: AddressComponent[] | undefined): string | null {
  if (!components) return null
  const locality = components.find((c) => c.types?.includes('locality'))
  if (locality?.longText) return locality.longText
  const postalTown = components.find((c) => c.types?.includes('postal_town'))
  if (postalTown?.longText) return postalTown.longText
  const admin3 = components.find((c) => c.types?.includes('administrative_area_level_3'))
  return admin3?.longText ?? null
}

export function extractPostalCode(components: AddressComponent[] | undefined): string | null {
  if (!components) return null
  const cp = components.find((c) => c.types?.includes('postal_code'))
  return cp?.longText ?? cp?.shortText ?? null
}

/**
 * Extrait les références photos d'une réponse Google Places.
 *
 * Limite par défaut : 10 (Session 3.0 — augmenté de 5 → 10 pour offrir
 * un pool large que l'admin réorganisera dans l'éditeur). L'API Places
 * (New) renvoie typiquement jusqu'à 10 photos par lieu, parfois moins
 * selon le commerce. Pas de pagination disponible au-delà.
 */
export function extractPhotoRefs(
  photos: { name?: string }[] | undefined,
  max = 10
): string[] {
  if (!photos) return []
  return photos
    .map((p) => p.name)
    .filter((n): n is string => typeof n === 'string' && n.startsWith('places/'))
    .slice(0, max)
}

// Les helpers `formatAuthorName` et `getAuthorInitial` sont définis dans
// `./author-name.ts` (sans 'server-only' pour rester testables côté Node).
export { formatAuthorName, getAuthorInitial } from './author-name'
